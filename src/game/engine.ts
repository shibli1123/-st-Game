import * as THREE from 'three';
import { soundEngine } from '../audio/soundEngine';
import {
  createCarModel,
  createCharacterModel,
  createObjectiveBeacon,
  VehicleObject,
  CharacterObject
} from './proceduralModels';
import { buildProceduralCity, setupAtmosphere, CityData } from './proceduralCity';
import { Mission, PlayerStats, CameraMode, DialogueItem, WeatherType } from '../types/game';

// Pre-allocated math variables for zero-GC render loop
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _v3 = new THREE.Vector3();
const _forward = new THREE.Vector3();

export interface GameEngineCallbacks {
  onStatsUpdate: (stats: PlayerStats) => void;
  onDialogue: (dialogue: DialogueItem) => void;
  onMissionPassed: (mission: Mission, stats: PlayerStats) => void;
  onWasted: (reason: string) => void;
  onMinimapUpdate: (data: {
    playerPos: { x: number; z: number; heading: number };
    miaPos?: { x: number; z: number };
    policePositions: { x: number; z: number; heading: number }[];
    targetPos?: { x: number; z: number; radius: number };
  }) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private callbacks: GameEngineCallbacks;

  // City & Environment
  private cityData: CityData;
  private atmosphere: {
    keyLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    ambLight?: THREE.AmbientLight;
    skyMesh?: THREE.Mesh;
    sunMesh?: THREE.Mesh;
    haloMesh?: THREE.Mesh;
  };

  // Entities
  public playerVehicle: VehicleObject;
  public playerChar: CharacterObject;
  public miaChar: CharacterObject;
  public policeCars: { car: VehicleObject; active: boolean; aiTimer: number }[] = [];
  public policeOfficers: { char: CharacterObject; health: number; active: boolean }[] = [];
  public objectiveBeacon: THREE.Group;

  // Particle Pools
  private sparkParticles!: THREE.Points;
  private sparkGeo!: THREE.BufferGeometry;
  private sparkPositions!: Float32Array;
  private sparkLifetimes!: Float32Array;
  private maxSparks = 100;

  private smokeParticles!: THREE.Points;
  private smokeGeo!: THREE.BufferGeometry;
  private smokePositions!: Float32Array;
  private smokeLifetimes!: Float32Array;
  private maxSmokes = 80;

  // Rain Particle Pool
  private rainParticles!: THREE.Points;
  private rainGeo!: THREE.BufferGeometry;
  private rainPositions!: Float32Array;
  private maxRain = 1500;
  private rainMat!: THREE.PointsMaterial;

  // Dynamic Weather System (clear -> overcast -> light_rain)
  public weather: WeatherType = 'clear';
  private weatherTimer = 0;
  private weatherCycleDuration = 35; // 35 seconds per phase in dynamic cycle
  private currentWetness = 0; // 0 (dry) to 1.0 (slick mirror wet street)

  // Camera & Controls (Unreal Engine SpringArm feel)
  public cameraMode: CameraMode = 'chase';
  private cameraOffset = new THREE.Vector3(0, 4.4, -9.2);
  private cameraLookOffset = new THREE.Vector3(0, 1.2, 3.5);
  private cameraShake = 0;
  private springArmPos = new THREE.Vector3();

  // Input State
  private keys: Record<string, boolean> = {};
  private justPressedKeys: Record<string, boolean> = {};

  // Gameplay State
  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    cash: 250000,
    loveMeter: 65,
    loveTitle: 'Partners in Crime',
    specialAbility: 100,
    isSpecialActive: false,
    isInVehicle: true,
    currentVehicleName: 'Vapid Dominator GT',
    vehicleHealth: 100,
    vehicleSpeed: 0,
    nitro: 100,
    wantedLevel: 0,
    wantedFlashing: false,
    currentWeapon: 'Pistol',
    ammo: 120,
    weather: 'clear',
  };

  // Car Physics State & Unreal Suspension
  private carSpeed = 0; // m/s
  private carSteer = 0; // radians
  private carSlip = 0;
  private isDrifting = false;
  private isBraking = false;
  private chassisPitch = 0;
  private chassisRoll = 0;

  // On-foot Physics State
  private playerFootVelocity = new THREE.Vector3();
  private isRunningOnFoot = false;

  // Missions & Story
  public currentMission: Mission | null = null;
  public currentStepIndex: number = 0;
  private missionTargetPos: THREE.Vector3 | null = null;
  private wantedCooldownTimer: number = 0;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, container.clientWidth / container.clientHeight, 0.1, 900);
    this.clock = new THREE.Clock();

    // 2. High-Performance Unreal PBR Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Atmosphere & City
    this.atmosphere = setupAtmosphere(this.scene, this.renderer);
    this.cityData = buildProceduralCity(this.scene);

    // 4. Create Hero Vehicles & Characters
    this.playerVehicle = createCarModel('muscle', 0xb91c1c); // Deep crimson candy clearcoat
    this.playerVehicle.position.set(-35, 0, 50);
    this.playerVehicle.rotation.y = Math.PI;
    this.scene.add(this.playerVehicle);

    this.playerChar = createCharacterModel('leo');
    this.playerChar.visible = false;
    this.scene.add(this.playerChar);

    this.miaChar = createCharacterModel('mia');
    this.miaChar.position.copy(this.playerVehicle.passengerSeatPos);
    this.playerVehicle.add(this.miaChar);

    // 5. In-World 3D Destination Beacon (NO TEXT NAVIGATION)
    this.objectiveBeacon = createObjectiveBeacon();
    this.objectiveBeacon.visible = false;
    this.scene.add(this.objectiveBeacon);

    // 6. Police Cars Pool (4 cruisers)
    for (let i = 0; i < 4; i++) {
      const pCar = createCarModel('police', 0x090d16);
      pCar.position.set(0, -100, 0);
      pCar.visible = false;
      this.scene.add(pCar);
      this.policeCars.push({ car: pCar, active: false, aiTimer: 0 });
    }

    // 7. Particle Systems
    this.setupParticles();

    // 8. Event Listeners
    this.setupInput();
    window.addEventListener('resize', this.onResize);
  }

  private setupParticles() {
    // Sparks
    this.sparkGeo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.maxSparks * 3);
    this.sparkLifetimes = new Float32Array(this.maxSparks);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.35,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.sparkParticles = new THREE.Points(this.sparkGeo, sparkMat);
    this.scene.add(this.sparkParticles);

    // Tire Smoke
    this.smokeGeo = new THREE.BufferGeometry();
    this.smokePositions = new Float32Array(this.maxSmokes * 3);
    this.smokeLifetimes = new Float32Array(this.maxSmokes);
    this.smokeGeo.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));

    const smokeMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 1.2,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.smokeParticles = new THREE.Points(this.smokeGeo, smokeMat);
    this.scene.add(this.smokeParticles);

    // Rain Particles (1,500 particles for light rain)
    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.maxRain * 3);
    for (let i = 0; i < this.maxRain; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 90;
      this.rainPositions[i * 3 + 1] = Math.random() * 35;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMat = new THREE.PointsMaterial({
      color: 0xc8ddf5,
      size: 0.32,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.rainParticles = new THREE.Points(this.rainGeo, this.rainMat);
    this.scene.add(this.rainParticles);
  }

  private setupInput() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (!this.keys[key]) {
        this.justPressedKeys[key] = true;
      }
      this.keys[key] = true;

      // Enter/Exit Car toggle
      if (key === 'f' || key === 'enter') {
        this.toggleVehicleEnterExit();
      }

      // Special Ability toggle (Caps Lock or V)
      if (key === 'v' || key === 'capslock') {
        this.toggleSpecialAbility();
      }

      // Camera toggle (C)
      if (key === 'c') {
        this.cycleCamera();
      }

      // Weather cycle toggle (T)
      if (key === 't') {
        this.cycleWeather();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys[key] = false;
    });

    window.addEventListener('blur', () => {
      this.keys = {};
      this.justPressedKeys = {};
    });

    this.container.addEventListener('mousedown', (e) => {
      soundEngine.resume();
      if (e.button === 0) { // Left click = shoot
        this.playerShoot();
      }
    });
  }

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public start() {
    this.isRunning = true;
    this.clock.start();
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public toggleSpecialAbility() {
    if (this.stats.specialAbility > 20) {
      this.stats.isSpecialActive = !this.stats.isSpecialActive;
      soundEngine.playSlowMo(this.stats.isSpecialActive);
    }
  }

  public cycleCamera() {
    const modes: CameraMode[] = ['chase', 'hood', 'topdown', 'cinematic'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.cameraMode = modes[nextIdx];
  }

  public cycleWeather() {
    const cycleList: WeatherType[] = ['clear', 'overcast', 'light_rain'];
    const nextIdx = (cycleList.indexOf(this.weather) + 1) % cycleList.length;
    this.setWeather(cycleList[nextIdx]);
  }

  public setWeather(w: WeatherType) {
    this.weather = w;
    this.weatherTimer = 0;
    this.stats.weather = w;
  }

  public toggleVehicleEnterExit() {
    if (this.stats.isInVehicle) {
      // Exit vehicle
      this.stats.isInVehicle = false;
      this.playerVehicle.remove(this.miaChar);
      this.scene.add(this.miaChar);

      // Place player on left side of car
      _v1.set(-1.8, 0, 0).applyQuaternion(this.playerVehicle.quaternion).add(this.playerVehicle.position);
      this.playerChar.position.copy(_v1);
      this.playerChar.rotation.y = this.playerVehicle.rotation.y;
      this.playerChar.visible = true;

      // Place Mia on right side of car
      _v2.set(1.8, 0, 0).applyQuaternion(this.playerVehicle.quaternion).add(this.playerVehicle.position);
      this.miaChar.position.copy(_v2);
      this.miaChar.rotation.y = this.playerVehicle.rotation.y;
      this.miaChar.visible = true;

      soundEngine.updateEngine(0, false, false);
    } else {
      // Check distance to car
      const dist = this.playerChar.position.distanceTo(this.playerVehicle.position);
      if (dist < 6.0) {
        this.stats.isInVehicle = true;
        this.playerChar.visible = false;

        // Seat Mia back into passenger seat
        this.scene.remove(this.miaChar);
        this.miaChar.position.copy(this.playerVehicle.passengerSeatPos);
        this.miaChar.rotation.set(0, 0, 0);
        this.playerVehicle.add(this.miaChar);
      }
    }
  }

  public playerShoot() {
    if (this.stats.ammo <= 0) return;
    this.stats.ammo--;
    soundEngine.playGunshot();
    this.cameraShake = 0.35;

    // Determine fire origin and direction
    const origin = this.stats.isInVehicle ? this.playerVehicle.position.clone().add(new THREE.Vector3(0, 1.2, 0)) : this.playerChar.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.stats.isInVehicle ? this.playerVehicle.quaternion : this.playerChar.quaternion);

    // Spawn muzzle spark
    this.emitSparks(origin.clone().add(forward.clone().multiplyScalar(1.5)), 6);

    // Raycast hit check against police
    this.policeOfficers.forEach((officer) => {
      if (!officer.active) return;
      const dist = officer.char.position.distanceTo(origin);
      if (dist < 35) {
        officer.health -= 45;
        this.emitSparks(officer.char.position.clone().add(new THREE.Vector3(0, 1, 0)), 8);
        if (officer.health <= 0) {
          officer.active = false;
          officer.char.visible = false;
          this.stats.cash += 500;
          this.stats.loveMeter = Math.min(100, this.stats.loveMeter + 2);
          this.callbacks.onDialogue({
            id: 'mia-cheer-' + Date.now(),
            speaker: 'Mia',
            text: 'Good shot, Leo! Keep your head down!',
            duration: 3,
            color: '#f43f5e',
          });
        }
      }
    });

    // Check hit against police cruisers
    this.policeCars.forEach((p) => {
      if (!p.active) return;
      const dist = p.car.position.distanceTo(origin);
      if (dist < 40) {
        this.emitSparks(p.car.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 12);
      }
    });

    // Shooting raises wanted level if peaceful
    if (this.stats.wantedLevel === 0) {
      this.setWantedLevel(1);
    }
  }

  public setWantedLevel(stars: number) {
    this.stats.wantedLevel = Math.max(0, Math.min(5, stars));
    this.stats.wantedFlashing = false;
    soundEngine.setSiren(this.stats.wantedLevel > 0);

    // Spawn/manage police cruisers according to wanted level
    const countNeeded = Math.min(this.stats.wantedLevel, this.policeCars.length);
    for (let i = 0; i < this.policeCars.length; i++) {
      const p = this.policeCars[i];
      if (i < countNeeded && !p.active) {
        p.active = true;
        p.car.visible = true;
        // Spawn behind or ahead of player on street
        const spawnDist = 45 + i * 20;
        const offset = new THREE.Vector3(0, 0, -spawnDist).applyQuaternion(this.playerVehicle.quaternion);
        p.car.position.copy(this.playerVehicle.position).add(offset);
        p.car.position.y = 0;
      } else if (i >= countNeeded && p.active) {
        p.active = false;
        p.car.visible = false;
      }
    }
  }

  public setMission(mission: Mission) {
    this.currentMission = mission;
    this.currentStepIndex = 0;
    this.setWantedLevel(mission.initialWanted);

    if (mission.startDialogue && mission.startDialogue.length > 0) {
      let delay = 0;
      mission.startDialogue.forEach((d) => {
        setTimeout(() => {
          if (this.currentMission?.id === mission.id) {
            this.callbacks.onDialogue(d);
          }
        }, delay * 1000);
        delay += d.duration;
      });
    }

    this.updateMissionTarget();
  }

  private updateMissionTarget() {
    if (!this.currentMission) {
      this.missionTargetPos = null;
      if (this.objectiveBeacon) this.objectiveBeacon.visible = false;
      return;
    }
    const step = this.currentMission.steps[this.currentStepIndex];
    if (step) {
      this.missionTargetPos = new THREE.Vector3(step.targetPos.x, 0, step.targetPos.z);
      if (this.objectiveBeacon) {
        this.objectiveBeacon.position.set(step.targetPos.x, 0, step.targetPos.z);
        this.objectiveBeacon.visible = true;
      }
    } else {
      this.missionTargetPos = null;
      if (this.objectiveBeacon) this.objectiveBeacon.visible = false;
    }
  }

  // ---- MAIN SIMULATION TICK ----
  private loop = () => {
    if (!this.isRunning) return;
    this.animFrameId = requestAnimationFrame(this.loop);

    let rawDt = this.clock.getDelta();
    // Clamped frame delta per game craft instructions
    let dt = Math.min(rawDt, 0.05);

    // Animate In-World Objective Beacon
    if (this.objectiveBeacon && this.objectiveBeacon.visible) {
      const time = Date.now() * 0.002;
      this.objectiveBeacon.children[1].rotation.z += dt * 1.5;
      this.objectiveBeacon.children[2].rotation.z -= dt * 2.2;
      const pulse = 1 + Math.sin(time * 3) * 0.12;
      this.objectiveBeacon.children[0].scale.set(pulse, 1, pulse);
    }

    // Apply Special Ability slow-mo factor
    if (this.stats.isSpecialActive) {
      dt *= 0.35;
      this.stats.specialAbility -= 15 * rawDt;
      if (this.stats.specialAbility <= 0) {
        this.stats.isSpecialActive = false;
        soundEngine.playSlowMo(false);
      }
    } else {
      this.stats.specialAbility = Math.min(100, this.stats.specialAbility + 4 * rawDt);
    }

    // 1. Update Player Physics (Car or Foot)
    if (this.stats.isInVehicle) {
      this.updateCarPhysics(dt);
    } else {
      this.updateOnFootPhysics(dt);
    }

    // 2. Update AI Companion (Mia)
    this.updateMiaAI(dt);

    // 3. Update Police Cruisers AI
    this.updatePoliceAI(dt);

    // 4. Update Mission Checkpoints
    this.updateMissionProgress(dt);

    // 5. Update Particles
    this.updateParticles(dt);

    // 6. Camera Follow & Camera Shake
    this.updateCamera(dt);

    // 7. Dynamic Weather System & Street Reflections
    this.updateWeather(dt);

    // 8. Update Minimap & UI Stats
    this.updateHUDStats();

    // 9. Render Frame
    this.renderer.render(this.scene, this.camera);

    // Clear justPressed
    this.justPressedKeys = {};
  };

  private updateCarPhysics(dt: number) {
    const isW = this.keys['w'] || this.keys['arrowup'];
    const isS = this.keys['s'] || this.keys['arrowdown'];
    const isA = this.keys['a'] || this.keys['arrowleft'];
    const isD = this.keys['d'] || this.keys['arrowright'];
    const isHandbrake = this.keys[' '];
    const isNitro = this.keys['shift'] && this.stats.nitro > 0;

    const maxSpeedForward = isNitro ? 55 : 42; // m/s (~150-200 km/h)
    const maxSpeedReverse = -12;
    const accelRate = isNitro ? 26 : 16;
    const brakeRate = 28;
    const naturalDrag = 3.5;

    // Nitro consumption
    if (isNitro && this.carSpeed > 5) {
      this.stats.nitro = Math.max(0, this.stats.nitro - 22 * dt);
      soundEngine.playNitro(true);
      // Exhaust fire sparks
      this.playerVehicle.exhaustPipes.forEach((p) => {
        _v1.set(0, 0, 0).applyMatrix4(p.matrixWorld);
        this.emitSparks(_v1, 2);
      });
    } else {
      this.stats.nitro = Math.min(100, this.stats.nitro + 5 * dt);
    }

    // Acceleration & Braking
    if (isW) {
      if (this.carSpeed < 0) {
        this.carSpeed += brakeRate * dt; // Braking from reverse
      } else {
        this.carSpeed = Math.min(maxSpeedForward, this.carSpeed + accelRate * dt);
      }
    } else if (isS) {
      if (this.carSpeed > 0) {
        this.carSpeed = Math.max(0, this.carSpeed - brakeRate * dt); // Braking
        this.isBraking = true;
      } else {
        this.carSpeed = Math.max(maxSpeedReverse, this.carSpeed - (accelRate * 0.6) * dt); // Reverse
      }
    } else {
      // Natural rolling friction
      if (this.carSpeed > 0) {
        this.carSpeed = Math.max(0, this.carSpeed - naturalDrag * dt);
      } else if (this.carSpeed < 0) {
        this.carSpeed = Math.min(0, this.carSpeed + naturalDrag * dt);
      }
      this.isBraking = false;
    }

    // Steering & Drifting
    const steerMax = 0.68;
    const steerSpeed = 3.4;
    let targetSteer = 0;
    if (isA) targetSteer += steerMax;
    if (isD) targetSteer -= steerMax;

    this.carSteer = THREE.MathUtils.damp(this.carSteer, targetSteer, steerSpeed, dt);

    // Drifting logic
    this.isDrifting = isHandbrake && Math.abs(this.carSpeed) > 10;
    if (this.isDrifting) {
      this.carSlip = THREE.MathUtils.damp(this.carSlip, (isA ? 1 : isD ? -1 : 0) * 0.85, 4.0, dt);
      soundEngine.setTireScreech(0.85);

      // Emit tire smoke
      this.playerVehicle.wheels.slice(2).forEach((w) => {
        _v1.set(0, 0, 0).applyMatrix4(w.matrixWorld);
        this.emitSmoke(_v1);
      });
    } else {
      this.carSlip = THREE.MathUtils.damp(this.carSlip, 0, 6.0, dt);
      soundEngine.setTireScreech(this.isBraking && this.carSpeed > 20 ? 0.45 : 0);
    }

    // Turn car heading based on speed and steering
    if (Math.abs(this.carSpeed) > 0.5) {
      const turnFactor = (this.carSpeed > 0 ? 1 : -1) * (this.isDrifting ? 1.6 : 1.0);
      this.playerVehicle.rotation.y += this.carSteer * turnFactor * (Math.min(Math.abs(this.carSpeed), 30) / 25) * dt;
    }

    // Move forward with slip angle
    _forward.set(0, 0, 1).applyQuaternion(this.playerVehicle.quaternion);
    const slipVec = new THREE.Vector3(1, 0, 0).applyQuaternion(this.playerVehicle.quaternion).multiplyScalar(this.carSlip * this.carSpeed * 0.4);
    const moveStep = _forward.clone().multiplyScalar(this.carSpeed * dt).add(slipVec.multiplyScalar(dt));

    const nextPos = this.playerVehicle.position.clone().add(moveStep);

    // Collision check against city buildings
    let collision = false;
    for (const b of this.cityData.colliders) {
      if (nextPos.x >= b.minX && nextPos.x <= b.maxX && nextPos.z >= b.minZ && nextPos.z <= b.maxZ) {
        collision = true;
        break;
      }
    }

    if (collision) {
      // Rebound & damage
      this.carSpeed = -this.carSpeed * 0.4;
      this.stats.vehicleHealth = Math.max(0, this.stats.vehicleHealth - Math.abs(this.carSpeed) * 0.8);
      this.cameraShake = 0.5;
      this.emitSparks(this.playerVehicle.position.clone().add(new THREE.Vector3(0, 0.5, 1)), 15);

      if (this.stats.vehicleHealth <= 0) {
        this.triggerWasted('Vehicle Destroyed');
      }
    } else {
      this.playerVehicle.position.copy(nextPos);
    }

    // Animate wheels
    const wheelRotSpeed = (this.carSpeed / 0.38) * dt;
    this.playerVehicle.wheels.forEach((w, idx) => {
      w.rotation.x += wheelRotSpeed;
      if (idx < 2) {
        // Front wheels turn with steer
        w.rotation.y = this.carSteer * 0.75;
      }
    });

    // Unreal Engine Chaos Suspension Physics (Pitch & Roll)
    let targetPitch = 0;
    if (isW && this.carSpeed >= 0) {
      targetPitch = -0.065 * Math.min(1.0, 15 / (Math.abs(this.carSpeed) + 10)); // Squat on acceleration
    } else if (this.isBraking) {
      targetPitch = 0.075; // Dive on hard braking
    }
    this.chassisPitch = THREE.MathUtils.damp(this.chassisPitch, targetPitch, 8.5, dt);

    const speedRatio = Math.min(Math.abs(this.carSpeed) / 28, 1.2);
    const targetRoll = -0.15 * this.carSteer * speedRatio;
    this.chassisRoll = THREE.MathUtils.damp(this.chassisRoll, targetRoll, 7.5, dt);

    if (this.playerVehicle.chassisGroup) {
      this.playerVehicle.chassisGroup.rotation.x = this.chassisPitch;
      this.playerVehicle.chassisGroup.rotation.z = this.chassisRoll;
    }

    // Audio update
    soundEngine.updateEngine(this.carSpeed * 3.6, isW, true);
    this.stats.vehicleSpeed = Math.round(Math.abs(this.carSpeed) * 3.6);
  }

  private updateOnFootPhysics(dt: number) {
    const isW = this.keys['w'] || this.keys['arrowup'];
    const isS = this.keys['s'] || this.keys['arrowdown'];
    const isA = this.keys['a'] || this.keys['arrowleft'];
    const isD = this.keys['d'] || this.keys['arrowright'];
    const isSprint = this.keys['shift'];

    const moveSpeed = isSprint ? 9.5 : 4.5;
    this.isRunningOnFoot = isSprint && (isW || isS || isA || isD);

    // Movement vector relative to camera
    const camDir = new THREE.Vector3();
    this.camera.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    const camRight = new THREE.Vector3(-camDir.z, 0, camDir.x);

    const inputDir = new THREE.Vector3();
    if (isW) inputDir.add(camDir);
    if (isS) inputDir.sub(camDir);
    if (isD) inputDir.add(camRight);
    if (isA) inputDir.sub(camRight);

    if (inputDir.lengthSq() > 0.01) {
      inputDir.normalize();
      const targetAngle = Math.atan2(inputDir.x, inputDir.z);
      this.playerChar.rotation.y = THREE.MathUtils.damp(this.playerChar.rotation.y, targetAngle, 10, dt);

      const moveStep = inputDir.multiplyScalar(moveSpeed * dt);
      const nextPos = this.playerChar.position.clone().add(moveStep);

      // Simple collision
      let hit = false;
      for (const b of this.cityData.colliders) {
        if (nextPos.x >= b.minX && nextPos.x <= b.maxX && nextPos.z >= b.minZ && nextPos.z <= b.maxZ) {
          hit = true;
          break;
        }
      }
      if (!hit) {
        this.playerChar.position.copy(nextPos);
      }

      // Animate walking legs/arms
      const runCycle = Date.now() * 0.012;
      this.playerChar.leftLeg.rotation.x = Math.sin(runCycle) * 0.7;
      this.playerChar.rightLeg.rotation.x = -Math.sin(runCycle) * 0.7;
      this.playerChar.leftArm.rotation.x = -Math.sin(runCycle) * 0.6;
    } else {
      this.playerChar.leftLeg.rotation.x = 0;
      this.playerChar.rightLeg.rotation.x = 0;
      this.playerChar.leftArm.rotation.x = 0;
    }
  }

  private updateMiaAI(dt: number) {
    if (this.stats.isInVehicle) {
      // Mia is in car passenger seat: occasionally shoots pursuing police cars if wanted
      if (this.stats.wantedLevel > 0 && Math.random() < 0.02) {
        // Target nearest police car
        const nearestCop = this.policeCars.find((p) => p.active && p.car.position.distanceTo(this.playerVehicle.position) < 40);
        if (nearestCop) {
          soundEngine.playGunshot();
          this.emitSparks(nearestCop.car.position.clone().add(new THREE.Vector3(0, 1, 0)), 6);
        }
      }
    } else {
      // Mia on foot: follow Leo
      const distToLeo = this.miaChar.position.distanceTo(this.playerChar.position);
      if (distToLeo > 2.5) {
        _v1.subVectors(this.playerChar.position, this.miaChar.position).normalize();
        this.miaChar.rotation.y = Math.atan2(_v1.x, _v1.z);
        this.miaChar.position.add(_v1.multiplyScalar(5.5 * dt));

        // Walking cycle
        const runCycle = Date.now() * 0.012;
        this.miaChar.leftLeg.rotation.x = Math.sin(runCycle) * 0.6;
        this.miaChar.rightLeg.rotation.x = -Math.sin(runCycle) * 0.6;
      }
    }
  }

  private updatePoliceAI(dt: number) {
    if (this.stats.wantedLevel === 0) return;

    // Toggle police lightbars
    const flashPhase = Math.floor(Date.now() / 150) % 2 === 0;

    this.policeCars.forEach((p, idx) => {
      if (!p.active) return;

      // Animate emergency lightbar
      if (p.car.lightbar) {
        p.car.lightbar.children[1].visible = flashPhase; // Red
        p.car.lightbar.children[2].visible = !flashPhase; // Blue
      }

      // Police steering towards player
      const target = this.stats.isInVehicle ? this.playerVehicle.position : this.playerChar.position;
      const dist = p.car.position.distanceTo(target);

      _v1.subVectors(target, p.car.position);
      const targetAngle = Math.atan2(_v1.x, _v1.z);

      p.car.rotation.y = THREE.MathUtils.damp(p.car.rotation.y, targetAngle, 2.5, dt);

      // Police drive speed
      const copSpeed = (dist > 15 ? 32 : 18) * dt;
      _forward.set(0, 0, 1).applyQuaternion(p.car.quaternion);
      p.car.position.add(_forward.multiplyScalar(copSpeed));

      // Ramming / collision with player car
      if (this.stats.isInVehicle && dist < 4.2) {
        this.cameraShake = 0.4;
        this.stats.vehicleHealth = Math.max(0, this.stats.vehicleHealth - 5 * dt);
        this.carSpeed *= 0.85;
        this.emitSparks(p.car.position.clone().add(new THREE.Vector3(0, 0.5, 0)), 8);
      }

      // Police shooting at player
      p.aiTimer += dt;
      if (p.aiTimer > 2.5 && dist < 35) {
        p.aiTimer = 0;
        soundEngine.playGunshot();
        if (this.stats.armor > 0) {
          this.stats.armor = Math.max(0, this.stats.armor - 8);
        } else {
          this.stats.health = Math.max(0, this.stats.health - 6);
        }
        this.cameraShake = 0.25;

        if (this.stats.health <= 0) {
          this.triggerWasted('Busted by LSPD');
        }
      }
    });

    // Wanted cooldown if player is distant from all police
    let closestCopDist = 999;
    this.policeCars.forEach((p) => {
      if (!p.active) return;
      const d = p.car.position.distanceTo(this.playerVehicle.position);
      if (d < closestCopDist) closestCopDist = d;
    });

    if (closestCopDist > 85) {
      this.stats.wantedFlashing = true;
      this.wantedCooldownTimer += dt;
      if (this.wantedCooldownTimer > 8.0) {
        // Evaded!
        this.setWantedLevel(0);
        this.wantedCooldownTimer = 0;
        this.stats.loveMeter = Math.min(100, this.stats.loveMeter + 10);
        this.callbacks.onDialogue({
          id: 'evaded-' + Date.now(),
          speaker: 'Mia',
          text: 'We lost them, Leo! You are incredible behind the wheel.',
          duration: 4,
          color: '#f43f5e',
        });
      }
    } else {
      this.stats.wantedFlashing = false;
      this.wantedCooldownTimer = 0;
    }
  }

  private updateMissionProgress(dt: number) {
    if (!this.currentMission) return;
    const step = this.currentMission.steps[this.currentStepIndex];
    if (!step) return;

    const playerPos = this.stats.isInVehicle ? this.playerVehicle.position : this.playerChar.position;
    const targetVec = new THREE.Vector3(step.targetPos.x, 0, step.targetPos.z);
    const dist = playerPos.distanceTo(targetVec);

    if (dist <= step.targetPos.radius) {
      // Step complete!
      this.currentStepIndex++;
      soundEngine.playCash();

      if (this.currentStepIndex >= this.currentMission.steps.length) {
        // Mission Passed!
        this.completeMission();
      } else {
        this.updateMissionTarget();
      }
    }
  }

  private completeMission() {
    if (!this.currentMission) return;
    const m = this.currentMission;
    this.stats.cash += m.rewardCash;
    this.stats.loveMeter = Math.min(100, this.stats.loveMeter + m.rewardLove);

    soundEngine.playMissionPassed();
    this.callbacks.onMissionPassed(m, this.stats);

    if (m.successDialogue && m.successDialogue.length > 0) {
      m.successDialogue.forEach((d) => this.callbacks.onDialogue(d));
    }
    this.currentMission = null;
    this.missionTargetPos = null;
    this.setWantedLevel(0);
  }

  public triggerWasted(reason: string) {
    soundEngine.playWasted();
    this.callbacks.onWasted(reason);
  }

  public respawn() {
    this.stats.health = 100;
    this.stats.armor = 100;
    this.stats.vehicleHealth = 100;
    this.stats.wantedLevel = 0;
    this.setWantedLevel(0);

    // Respawn at safehouse
    this.playerVehicle.position.set(-35, 0, 50);
    this.playerVehicle.rotation.set(0, Math.PI, 0);
    this.carSpeed = 0;
    this.stats.isInVehicle = true;
    this.playerChar.visible = false;
    this.miaChar.position.copy(this.playerVehicle.passengerSeatPos);
    this.miaChar.rotation.set(0, 0, 0);
    this.playerVehicle.add(this.miaChar);
  }

  // ---- PARTICLES ----
  public emitSparks(pos: THREE.Vector3, count = 5) {
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * this.maxSparks);
      this.sparkPositions[idx * 3] = pos.x + (Math.random() - 0.5) * 0.4;
      this.sparkPositions[idx * 3 + 1] = pos.y + (Math.random() - 0.5) * 0.4;
      this.sparkPositions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.4;
      this.sparkLifetimes[idx] = 0.25;
    }
    this.sparkGeo.attributes.position.needsUpdate = true;
  }

  public emitSmoke(pos: THREE.Vector3) {
    const idx = Math.floor(Math.random() * this.maxSmokes);
    this.smokePositions[idx * 3] = pos.x + (Math.random() - 0.5) * 0.6;
    this.smokePositions[idx * 3 + 1] = pos.y + 0.2;
    this.smokePositions[idx * 3 + 2] = pos.z + (Math.random() - 0.5) * 0.6;
    this.smokeLifetimes[idx] = 0.6;
    this.smokeGeo.attributes.position.needsUpdate = true;
  }

  private updateParticles(dt: number) {
    for (let i = 0; i < this.maxSparks; i++) {
      if (this.sparkLifetimes[i] > 0) {
        this.sparkLifetimes[i] -= dt;
        this.sparkPositions[i * 3 + 1] += 2.0 * dt;
      }
    }
    this.sparkGeo.attributes.position.needsUpdate = true;

    for (let i = 0; i < this.maxSmokes; i++) {
      if (this.smokeLifetimes[i] > 0) {
        this.smokeLifetimes[i] -= dt;
        this.smokePositions[i * 3 + 1] += 1.5 * dt;
      }
    }
    this.smokeGeo.attributes.position.needsUpdate = true;
  }

  // ---- CAMERA (Unreal Engine SpringArm with Dynamic Speed FOV) ----
  private updateCamera(dt: number) {
    const targetObj = this.stats.isInVehicle ? this.playerVehicle : this.playerChar;

    // Dynamic Speed FOV expansion (speed sensation)
    const targetFov = 58 + Math.min(this.stats.vehicleSpeed / 180, 1.0) * 16;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 5.0, dt);
    this.camera.updateProjectionMatrix();

    if (this.cameraMode === 'chase') {
      const speedRatio = Math.min(this.stats.vehicleSpeed / 180, 1.0);
      const distBack = -9.2 - speedRatio * 3.8;
      const heightUp = 4.2 + speedRatio * 0.9;

      const idealOffset = new THREE.Vector3(0, heightUp, distBack).applyQuaternion(targetObj.quaternion).add(targetObj.position);
      const idealLook = this.cameraLookOffset.clone().applyQuaternion(targetObj.quaternion).add(targetObj.position);

      this.camera.position.lerp(idealOffset, 9 * dt);
      this.camera.lookAt(idealLook);

      // Subtle camera tilt bank during drift
      if (this.isDrifting) {
        this.camera.rotation.z = -this.carSlip * 0.055;
      }
    } else if (this.cameraMode === 'hood') {
      const hoodPos = new THREE.Vector3(0, 1.25, 0.9).applyQuaternion(targetObj.quaternion).add(targetObj.position);
      const hoodLook = new THREE.Vector3(0, 1.25, 25).applyQuaternion(targetObj.quaternion).add(targetObj.position);
      this.camera.position.copy(hoodPos);
      this.camera.lookAt(hoodLook);
    } else if (this.cameraMode === 'topdown') {
      this.camera.position.set(targetObj.position.x, targetObj.position.y + 38, targetObj.position.z - 6);
      this.camera.lookAt(targetObj.position);
    } else if (this.cameraMode === 'cinematic') {
      const time = Date.now() * 0.0006;
      const r = 13;
      this.camera.position.set(
        targetObj.position.x + Math.sin(time) * r,
        targetObj.position.y + 3.2,
        targetObj.position.z + Math.cos(time) * r
      );
      this.camera.lookAt(targetObj.position);
    }

    // Apply Camera Shake
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - 2 * dt);
    }
  }

  // ---- DYNAMIC WEATHER SYSTEM & STREET REFLECTIONS ----
  private updateWeather(dt: number) {
    // 1. Automatic weather cycle timer
    this.weatherTimer += dt;
    if (this.weatherTimer > this.weatherCycleDuration) {
      this.weatherTimer = 0;
      if (this.weather === 'clear') {
        this.weather = 'overcast';
      } else if (this.weather === 'overcast') {
        this.weather = 'light_rain';
      } else {
        this.weather = 'clear';
      }
      this.stats.weather = this.weather;
    }

    // 2. Weather targets for street reflections and atmosphere
    let targetWetness = 0;
    let targetRoughness = 0.72;
    let targetMetalness = 0.15;
    let targetClearcoat = 0.12;
    let targetClearcoatRoughness = 0.38;
    let targetEnvMapIntensity = 0.8;
    let targetRainAlpha = 0;
    let targetKeyIntensity = 2.2;
    let targetSunOpacity = 0.95;
    let targetFogDensity = 0.0035;

    if (this.weather === 'overcast') {
      targetWetness = 0.45;
      targetRoughness = 0.42;
      targetMetalness = 0.38;
      targetClearcoat = 0.55;
      targetClearcoatRoughness = 0.22;
      targetEnvMapIntensity = 1.6;
      targetRainAlpha = 0;
      targetKeyIntensity = 0.85;
      targetSunOpacity = 0.2;
      targetFogDensity = 0.0055;
    } else if (this.weather === 'light_rain') {
      targetWetness = 1.0;
      targetRoughness = 0.06; // Slick wet mirror asphalt catching city lights!
      targetMetalness = 0.85;
      targetClearcoat = 1.0;
      targetClearcoatRoughness = 0.03;
      targetEnvMapIntensity = 2.8;
      targetRainAlpha = 0.75;
      targetKeyIntensity = 0.45;
      targetSunOpacity = 0.0;
      targetFogDensity = 0.0075;
    }

    // 3. Smooth Damping of Road Material Reflectivity
    this.currentWetness = THREE.MathUtils.damp(this.currentWetness, targetWetness, 1.8, dt);

    if (this.cityData.roadMaterial) {
      const rm = this.cityData.roadMaterial;
      rm.roughness = THREE.MathUtils.damp(rm.roughness, targetRoughness, 1.8, dt);
      rm.metalness = THREE.MathUtils.damp(rm.metalness, targetMetalness, 1.8, dt);
      rm.clearcoat = THREE.MathUtils.damp(rm.clearcoat, targetClearcoat, 1.8, dt);
      rm.clearcoatRoughness = THREE.MathUtils.damp(rm.clearcoatRoughness, targetClearcoatRoughness, 1.8, dt);
      rm.envMapIntensity = THREE.MathUtils.damp(rm.envMapIntensity, targetEnvMapIntensity, 1.8, dt);
    }

    // 4. Smooth Damping of Atmosphere & Sun
    if (this.atmosphere.keyLight) {
      this.atmosphere.keyLight.intensity = THREE.MathUtils.damp(this.atmosphere.keyLight.intensity, targetKeyIntensity, 2.0, dt);
    }
    if (this.atmosphere.sunMesh && (this.atmosphere.sunMesh.material as THREE.Material)) {
      (this.atmosphere.sunMesh.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.damp(
        (this.atmosphere.sunMesh.material as THREE.MeshBasicMaterial).opacity,
        targetSunOpacity,
        2.0,
        dt
      );
    }
    if (this.scene.fog && 'density' in this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).density = THREE.MathUtils.damp(
        (this.scene.fog as THREE.FogExp2).density,
        targetFogDensity,
        1.5,
        dt
      );
    }

    // 5. Rain Audio Sync
    soundEngine.setRainIntensity(this.currentWetness > 0.4 ? (this.currentWetness - 0.4) * 1.6 : 0);

    // 6. Rain Particle System Update (Drifting down around player)
    if (this.rainMat) {
      this.rainMat.opacity = THREE.MathUtils.damp(this.rainMat.opacity, targetRainAlpha, 2.5, dt);
    }

    if (this.rainParticles && this.rainMat && this.rainMat.opacity > 0.01) {
      const camPos = this.camera.position;
      const count = this.maxRain;
      const pos = this.rainPositions;

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= 72 * dt;
        pos[i * 3] += 12 * dt;
        pos[i * 3 + 2] += 6 * dt;

        if (pos[i * 3 + 1] <= 0.05) {
          pos[i * 3] = camPos.x + (Math.random() - 0.5) * 85;
          pos[i * 3 + 1] = 30 + Math.random() * 15;
          pos[i * 3 + 2] = camPos.z + (Math.random() - 0.5) * 85;
        }
      }
      this.rainGeo.attributes.position.needsUpdate = true;
    }
  }

  private updateHUDStats() {
    // Update relationship title
    if (this.stats.loveMeter > 85) {
      this.stats.loveTitle = 'Soulmates for Life ❤️';
    } else if (this.stats.loveMeter > 60) {
      this.stats.loveTitle = 'Ride or Die';
    } else {
      this.stats.loveTitle = 'Partners in Crime';
    }

    this.callbacks.onStatsUpdate({ ...this.stats });

    const playerPos = this.stats.isInVehicle ? this.playerVehicle.position : this.playerChar.position;
    const playerHeading = this.stats.isInVehicle ? this.playerVehicle.rotation.y : this.playerChar.rotation.y;

    const policePosList = this.policeCars
      .filter((p) => p.active)
      .map((p) => ({
        x: p.car.position.x,
        z: p.car.position.z,
        heading: p.car.rotation.y,
      }));

    this.callbacks.onMinimapUpdate({
      playerPos: { x: playerPos.x, z: playerPos.z, heading: playerHeading },
      miaPos: this.stats.isInVehicle ? undefined : { x: this.miaChar.position.x, z: this.miaChar.position.z },
      policePositions: policePosList,
      targetPos: this.missionTargetPos ? {
        x: this.missionTargetPos.x,
        z: this.missionTargetPos.z,
        radius: this.currentMission?.steps[this.currentStepIndex]?.targetPos.radius || 15,
      } : undefined,
    });
  }

  public dispose() {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
