import * as THREE from 'three';

// Shared procedural textures
let cachedRoadTexture: THREE.CanvasTexture | null = null;
let cachedBuildingTexture: THREE.CanvasTexture | null = null;
let cachedCarbonTexture: THREE.CanvasTexture | null = null;

export function getRoadTexture(): THREE.CanvasTexture {
  if (cachedRoadTexture) return cachedRoadTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Realistic wet dark asphalt base
  ctx.fillStyle = '#111317';
  ctx.fillRect(0, 0, 1024, 1024);

  // High-frequency asphalt grain
  for (let i = 0; i < 8000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const shade = Math.floor(Math.random() * 18 + 14);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Realistic wet puddles that catch reflections
  ctx.fillStyle = '#0a0c10';
  for (let p = 0; p < 8; p++) {
    const px = Math.random() * 900 + 50;
    const py = Math.random() * 900 + 50;
    const rx = Math.random() * 60 + 30;
    const ry = Math.random() * 40 + 20;
    ctx.beginPath();
    ctx.ellipse(px, py, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Yellow double center line with realistic road paint wear
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(502, 0);
  ctx.lineTo(502, 1024);
  ctx.moveTo(522, 0);
  ctx.lineTo(522, 1024);
  ctx.stroke();

  // White lane dashes
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 8;
  ctx.setLineDash([48, 36]);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 1024);
  ctx.moveTo(768, 0);
  ctx.lineTo(768, 1024);
  ctx.stroke();

  // White solid edge lines
  ctx.setLineDash([]);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(16, 1024);
  ctx.moveTo(1008, 0);
  ctx.lineTo(1008, 1024);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedRoadTexture = texture;
  return texture;
}

export function getCarbonFiberTexture(): THREE.CanvasTexture {
  if (cachedCarbonTexture) return cachedCarbonTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 0, 64, 64);

  // Carbon weave pattern
  ctx.fillStyle = '#222226';
  for (let y = 0; y < 64; y += 8) {
    for (let x = 0; x < 64; x += 8) {
      if ((x / 8 + y / 8) % 2 === 0) {
        ctx.fillRect(x, y, 8, 8);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  cachedCarbonTexture = texture;
  return texture;
}

export function getBuildingWindowTexture(): THREE.CanvasTexture {
  if (cachedBuildingTexture) return cachedBuildingTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep dark glass facade with subtle blue reflections
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 0, 512, 1024);

  const cols = 10;
  const rows = 24;
  const padX = 8;
  const padY = 10;
  const w = (512 - (cols + 1) * padX) / cols;
  const h = (1024 - (rows + 1) * padY) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.42;
      const x = padX + c * (w + padX);
      const y = padY + r * (h + padY);

      if (isLit) {
        const isWarm = Math.random() > 0.35;
        ctx.fillStyle = isWarm ? '#fed7aa' : '#bae6fd';
        ctx.shadowColor = isWarm ? '#f97316' : '#38bdf8';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#111827';
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  cachedBuildingTexture = texture;
  return texture;
}

export function getNeonSignTexture(text: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#080a10';
  ctx.fillRect(0, 0, 512, 128);

  ctx.font = 'bold 58px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 256, 64);

  ctx.shadowBlur = 8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, 488, 104);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * 3D Vehicle with Unreal Engine PBR materials, sprung chassis, working headlights and interior
 */
export interface VehicleObject extends THREE.Group {
  chassisGroup: THREE.Group;
  wheels: THREE.Group[];
  spotlights: THREE.SpotLight[];
  volumetricBeams: THREE.Mesh[];
  lightbar?: THREE.Group;
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  exhaustPipes: THREE.Mesh[];
  passengerSeatPos: THREE.Vector3;
  driverSeatPos: THREE.Vector3;
}

export function createCarModel(type: 'muscle' | 'supercar' | 'police' = 'muscle', bodyColorHex: number = 0xd90429): VehicleObject {
  const car = new THREE.Group() as VehicleObject;
  car.wheels = [];
  car.spotlights = [];
  car.volumetricBeams = [];
  car.headlights = [];
  car.taillights = [];
  car.exhaustPipes = [];

  // Sprung Chassis Group for realistic physics suspension (tilt, roll, pitch)
  const chassis = new THREE.Group();
  car.add(chassis);
  car.chassisGroup = chassis;

  // 1. Unreal Engine Clearcoat Car Paint Material
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: bodyColorHex,
    metalness: 0.92,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
  });

  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x1f242d,
    roughness: 0.35,
    metalness: 0.5,
  });

  const policeWhiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    metalness: 0.6,
    roughness: 0.2,
    clearcoat: 0.8,
  });

  const tintedGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x050914,
    transmission: 0.75,
    roughness: 0.06,
    metalness: 0.2,
    transparent: true,
    opacity: 0.88,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    metalness: 0.98,
    roughness: 0.08,
  });

  const rubberTireMat = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.85,
    metalness: 0.05,
  });

  const alloyRimMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.95,
    roughness: 0.15,
  });

  const brakeCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Red Brembo caliper
    metalness: 0.7,
    roughness: 0.2,
  });

  // 2. Lower Chassis Body (Main Sculpted Bodywork)
  const bodyWidth = 2.15;
  const bodyLength = 4.65;
  const bodyHeight = 0.58;
  const lowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength),
    type === 'police' ? bodyMat : bodyMat
  );
  lowerBody.position.y = 0.55;
  lowerBody.castShadow = true;
  lowerBody.receiveShadow = true;
  chassis.add(lowerBody);

  // Carbon Front Splitter
  const frontSplitter = new THREE.Mesh(
    new THREE.BoxGeometry(2.18, 0.08, 0.4),
    carbonMat
  );
  frontSplitter.position.set(0, 0.3, 2.35);
  frontSplitter.castShadow = true;
  chassis.add(frontSplitter);

  // Carbon Side Skirts
  const skirtL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.2), carbonMat);
  skirtL.position.set(-1.1, 0.32, 0);
  const skirtR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 3.2), carbonMat);
  skirtR.position.set(1.1, 0.32, 0);
  chassis.add(skirtL, skirtR);

  // Carbon Rear Aerodynamic Diffuser
  const rearDiffuser = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 0.35), carbonMat);
  rearDiffuser.position.set(0, 0.32, -2.32);
  chassis.add(rearDiffuser);

  // 3. Hood with Twin Heat Vents
  const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.14, 1.45),
    type === 'police' ? policeWhiteMat : carbonMat
  );
  hood.position.set(0, 0.86, 1.25);
  hood.castShadow = true;
  chassis.add(hood);

  // 4. Cabin Roof & Pillars
  const cabinWidth = 1.68;
  const cabinLength = 2.25;
  const cabinHeight = 0.65;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength),
    type === 'police' ? policeWhiteMat : bodyMat
  );
  cabin.position.set(0, 1.15, -0.2);
  cabin.castShadow = true;
  chassis.add(cabin);

  // Curvature Windshield & Windows
  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.64, 0.58, 2.22),
    tintedGlassMat
  );
  windshield.position.set(0, 1.15, -0.2);
  chassis.add(windshield);

  // Interior: Dashboard, Steering Wheel, Bucket Seats
  const dash = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.35, 0.4),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
  );
  dash.position.set(0, 0.95, 0.6);
  chassis.add(dash);

  const wheelGeo = new THREE.TorusGeometry(0.16, 0.03, 8, 16);
  const steerWheel = new THREE.Mesh(wheelGeo, chromeMat);
  steerWheel.position.set(-0.45, 1.05, 0.42);
  steerWheel.rotation.x = 0.4;
  chassis.add(steerWheel);

  // Driver & Passenger Sport Seats
  const seatL = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.5), carbonMat);
  seatL.position.set(-0.45, 0.85, -0.2);
  const seatR = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.55, 0.5), carbonMat);
  seatR.position.set(0.45, 0.85, -0.2);
  chassis.add(seatL, seatR);

  // 5. Rear GT Wing Spoiler
  if (type === 'muscle' || type === 'supercar') {
    const spoilerBlade = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 0.35), carbonMat);
    spoilerBlade.position.set(0, 1.15, -2.15);
    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32), chromeMat);
    postL.position.set(-0.75, 1.0, -2.15);
    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.32), chromeMat);
    postR.position.set(0.75, 1.0, -2.15);
    chassis.add(spoilerBlade, postL, postR);
  }

  // 6. Realistic Headlights + Real Three.js Spotlights Casting Cones on the Road
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffedd5,
    emissiveIntensity: 3.5,
    roughness: 0.05,
  });

  const hlGeo = new THREE.BoxGeometry(0.36, 0.16, 0.1);
  const hlLeft = new THREE.Mesh(hlGeo, headlightMat);
  hlLeft.position.set(-0.78, 0.62, 2.34);
  const hlRight = new THREE.Mesh(hlGeo, headlightMat);
  hlRight.position.set(0.78, 0.62, 2.34);
  chassis.add(hlLeft, hlRight);
  car.headlights.push(hlLeft, hlRight);

  // Unreal Engine High-Beam Spotlights (Front Illumination)
  const spotL = new THREE.SpotLight(0xfff5eb, 3.5, 65, Math.PI / 5.5, 0.55, 1.5);
  spotL.position.set(-0.78, 0.62, 2.35);
  const targetL = new THREE.Object3D();
  targetL.position.set(-0.78, 0, 35);
  car.add(targetL);
  spotL.target = targetL;
  car.add(spotL);
  car.spotlights.push(spotL);

  const spotR = new THREE.SpotLight(0xfff5eb, 3.5, 65, Math.PI / 5.5, 0.55, 1.5);
  spotR.position.set(0.78, 0.62, 2.35);
  const targetR = new THREE.Object3D();
  targetR.position.set(0.78, 0, 35);
  car.add(targetR);
  spotR.target = targetR;
  car.add(spotR);
  car.spotlights.push(spotR);

  // Volumetric Headlight Beams (Semi-transparent additive cones)
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffedd5,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const beamGeo = new THREE.ConeGeometry(3.5, 24, 16, 1, true);
  beamGeo.rotateX(-Math.PI / 2);
  beamGeo.translate(0, 0, 12);

  const beamL = new THREE.Mesh(beamGeo, beamMat);
  beamL.position.set(-0.78, 0.62, 2.35);
  const beamR = new THREE.Mesh(beamGeo, beamMat);
  beamR.position.set(0.78, 0.62, 2.35);
  car.add(beamL, beamR);
  car.volumetricBeams.push(beamL, beamR);

  // 7. Taillights (Glowing Red LED Bar & Ground Illumination)
  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0033,
    emissiveIntensity: 2.8,
    roughness: 0.1,
  });
  const tlGeo = new THREE.BoxGeometry(0.42, 0.14, 0.1);
  const tlL = new THREE.Mesh(tlGeo, taillightMat);
  tlL.position.set(-0.78, 0.64, -2.33);
  const tlR = new THREE.Mesh(tlGeo, taillightMat);
  tlR.position.set(0.78, 0.64, -2.33);
  chassis.add(tlL, tlR);
  car.taillights.push(tlL, tlR);

  // Red Taillight Ambient Ground Glow
  const tailGlow = new THREE.PointLight(0xff0033, 1.2, 8, 2);
  tailGlow.position.set(0, 0.6, -2.5);
  car.add(tailGlow);

  // 8. Quad Chrome Exhaust Tips
  const exhGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.35, 12);
  exhGeo.rotateX(Math.PI / 2);
  const exhL1 = new THREE.Mesh(exhGeo, chromeMat);
  exhL1.position.set(-0.6, 0.35, -2.34);
  const exhL2 = new THREE.Mesh(exhGeo, chromeMat);
  exhL2.position.set(-0.46, 0.35, -2.34);
  const exhR1 = new THREE.Mesh(exhGeo, chromeMat);
  exhR1.position.set(0.46, 0.35, -2.34);
  const exhR2 = new THREE.Mesh(exhGeo, chromeMat);
  exhR2.position.set(0.6, 0.35, -2.34);
  chassis.add(exhL1, exhL2, exhR1, exhR2);
  car.exhaustPipes.push(exhL1, exhR1);

  // 9. Police Emergency Lightbar (if police cruiser)
  if (type === 'police') {
    const lightbarGroup = new THREE.Group();
    const baseBar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.25), chromeMat);
    const redLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.14, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3.5 })
    );
    redLight.position.x = -0.32;
    const blueLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.14, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 3.5 })
    );
    blueLight.position.x = 0.32;

    lightbarGroup.add(baseBar, redLight, blueLight);
    lightbarGroup.position.set(0, 1.52, -0.2);
    chassis.add(lightbarGroup);
    car.lightbar = lightbarGroup;

    // Heavy duty push bar
    const pushBar = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.48, 0.15), chromeMat);
    pushBar.position.set(0, 0.46, 2.42);
    chassis.add(pushBar);
  }

  // 10. High-Fidelity Wheels (Rubber Tire, 5-Spoke Alloy Rim & Red Caliper)
  const wheelPositions = [
    { x: -1.06, y: 0.38, z: 1.42 },  // Front Left
    { x: 1.06, y: 0.38, z: 1.42 },   // Front Right
    { x: -1.06, y: 0.38, z: -1.42 }, // Rear Left
    { x: 1.06, y: 0.38, z: -1.42 }   // Rear Right
  ];

  wheelPositions.forEach((pos, idx) => {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, rubberTireMat);
    tireMesh.castShadow = true;

    // Rim Outer Lip
    const rimLip = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.04, 8, 18),
      alloyRimMat
    );
    rimLip.rotation.y = Math.PI / 2;

    // 5 Rim Spokes
    const spokeGroup = new THREE.Group();
    for (let s = 0; s < 5; s++) {
      const angle = (s / 5) * Math.PI * 2;
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.04), alloyRimMat);
      spoke.position.set(0, Math.sin(angle) * 0.11, Math.cos(angle) * 0.11);
      spoke.rotation.x = angle;
      spokeGroup.add(spoke);
    }
    spokeGroup.position.x = idx % 2 === 0 ? -0.06 : 0.06;

    // Red Brake Caliper
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.1), brakeCaliperMat);
    caliper.position.set(0, 0.16, 0);

    wheelGroup.add(tireMesh, rimLip, spokeGroup, caliper);
    wheelGroup.position.set(pos.x, pos.y, pos.z);
    car.add(wheelGroup);
    car.wheels.push(wheelGroup);
  });

  // 11. Soft Radial Contact Shadow Plane
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d')!;
  const grad = sCtx.createRadialGradient(64, 64, 12, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.85)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 5.4),
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.65,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.025;
  car.add(shadowPlane);

  car.driverSeatPos = new THREE.Vector3(-0.45, 0.95, -0.2);
  car.passengerSeatPos = new THREE.Vector3(0.45, 0.95, -0.2);

  return car;
}

/**
 * Procedural In-World 3D Objective Beacon
 * A vertical volumetric column of light + pulsing ground rings that allows
 * completely text-free navigation in the 3D world!
 */
export function createObjectiveBeacon(): THREE.Group {
  const beacon = new THREE.Group();

  // Vertical light column soaring into the sky
  const beamGeo = new THREE.CylinderGeometry(1.8, 3.6, 120, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 60;
  beacon.add(beam);

  // Glowing ground rings
  const ringGeo = new THREE.RingGeometry(8, 9, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  beacon.add(ring);

  // Inner pulsing ring
  const innerRingGeo = new THREE.RingGeometry(3, 4, 32);
  const innerRing = new THREE.Mesh(innerRingGeo, ringMat.clone());
  innerRing.rotation.x = -Math.PI / 2;
  innerRing.position.y = 0.07;
  beacon.add(innerRing);

  // Center point light for ground illumination
  const light = new THREE.PointLight(0xfbbf24, 2.5, 28);
  light.position.y = 2.5;
  beacon.add(light);

  return beacon;
}

/**
 * Creates 3D character (Leo, Mia, Cop)
 */
export interface CharacterObject extends THREE.Group {
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  head: THREE.Group;
  weaponMesh?: THREE.Mesh;
  type: 'leo' | 'mia' | 'cop';
}

export function createCharacterModel(type: 'leo' | 'mia' | 'cop'): CharacterObject {
  const char = new THREE.Group() as CharacterObject;
  char.type = type;

  const skinMat = new THREE.MeshStandardMaterial({
    color: type === 'mia' ? 0xffdfd3 : 0xe0ac69,
    roughness: 0.5,
    metalness: 0.05,
  });

  let shirtMat: THREE.Material;
  let pantsMat: THREE.Material;
  let hairMat: THREE.Material;

  if (type === 'mia') {
    shirtMat = new THREE.MeshPhysicalMaterial({ color: 0x9f1239, roughness: 0.35, clearcoat: 0.3 }); // Leather crimson jacket
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7 });
    hairMat = new THREE.MeshStandardMaterial({ color: 0x271911, roughness: 0.8 });
  } else if (type === 'leo') {
    shirtMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.55 });
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.65 });
    hairMat = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.85 });
  } else {
    shirtMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    pantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  }

  const shoesMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 });

  // 1. Torso
  const torsoGeo = new THREE.BoxGeometry(0.52, 0.75, 0.28);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.15;
  torso.castShadow = true;
  char.add(torso);

  // 2. Head & Hair
  const headGroup = new THREE.Group();
  const headGeo = new THREE.BoxGeometry(0.28, 0.32, 0.28);
  const head = new THREE.Mesh(headGeo, skinMat);
  headGroup.add(head);

  if (type === 'mia') {
    const hairBase = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.16, 0.31), hairMat);
    hairBase.position.y = 0.12;
    const ponytail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.4), hairMat);
    ponytail.position.set(0, 0.05, -0.22);
    ponytail.rotation.x = 0.5;
    headGroup.add(hairBase, ponytail);
  } else if (type === 'leo') {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), hairMat);
    hair.position.y = 0.14;
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.08, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.95, roughness: 0.05 })
    );
    glasses.position.set(0, 0.04, 0.15);
    headGroup.add(hair, glasses);
  } else {
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.1, 0.34),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a })
    );
    cap.position.y = 0.18;
    headGroup.add(cap);
  }

  headGroup.position.set(0, 1.7, 0);
  headGroup.castShadow = true;
  char.add(headGroup);
  char.head = headGroup;

  // 3. Arms
  const armGeo = new THREE.BoxGeometry(0.14, 0.65, 0.14);

  const leftArm = new THREE.Group();
  const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
  leftArmMesh.position.y = -0.25;
  leftArmMesh.castShadow = true;
  leftArm.add(leftArmMesh);
  leftArm.position.set(-0.35, 1.45, 0);
  char.add(leftArm);
  char.leftArm = leftArm;

  const rightArm = new THREE.Group();
  const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
  rightArmMesh.position.y = -0.25;
  rightArmMesh.castShadow = true;
  rightArm.add(rightArmMesh);

  // Weapon in hand
  const gunMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.95, roughness: 0.15 });
  const gunMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.26), gunMat);
  gunMesh.position.set(0, -0.55, 0.12);
  rightArm.add(gunMesh);
  char.weaponMesh = gunMesh;

  rightArm.position.set(0.35, 1.45, 0);
  char.add(rightArm);
  char.rightArm = rightArm;

  // 4. Legs
  const legGeo = new THREE.BoxGeometry(0.18, 0.78, 0.18);

  const leftLeg = new THREE.Group();
  const leftLegMesh = new THREE.Mesh(legGeo, pantsMat);
  leftLegMesh.position.y = -0.38;
  leftLegMesh.castShadow = true;
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.28), shoesMat);
  shoeL.position.set(0, -0.72, 0.04);
  leftLeg.add(leftLegMesh, shoeL);
  leftLeg.position.set(-0.16, 0.8, 0);
  char.add(leftLeg);
  char.leftLeg = leftLeg;

  const rightLeg = new THREE.Group();
  const rightLegMesh = new THREE.Mesh(legGeo, pantsMat);
  rightLegMesh.position.y = -0.38;
  rightLegMesh.castShadow = true;
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.28), shoesMat);
  shoeR.position.set(0, -0.72, 0.04);
  rightLeg.add(rightLegMesh, shoeR);
  rightLeg.position.set(0.16, 0.8, 0);
  char.add(rightLeg);
  char.rightLeg = rightLeg;

  return char;
}

export function createPalmTree(): THREE.Group {
  const tree = new THREE.Group();

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const trunkGeo = new THREE.CylinderGeometry(0.2, 0.35, 7.5, 8);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 3.75;
  trunk.rotation.z = (Math.random() - 0.5) * 0.15;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x2e7d32,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });

  const leafCount = 8;
  for (let i = 0; i < leafCount; i++) {
    const angle = (i / leafCount) * Math.PI * 2;
    const leafGeo = new THREE.PlaneGeometry(1.2, 3.2);
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.position.set(0, 7.4, 0);
    leaf.rotation.y = angle;
    leaf.rotation.x = 0.65;
    leaf.castShadow = true;
    tree.add(leaf);
  }

  return tree;
}

export function createStreetLight(): THREE.Group {
  const lightGroup = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x22262e, metalness: 0.85, roughness: 0.2 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6.5, 8), metalMat);
  pole.position.y = 3.25;
  pole.castShadow = true;

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.5), metalMat);
  arm.position.set(0, 6.4, 0.75);

  const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.5), metalMat);
  lampHead.position.set(0, 6.35, 1.4);

  const bulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.04, 0.4),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe89e, emissiveIntensity: 2.5 })
  );
  bulb.position.set(0, 6.28, 1.4);

  // Actual downward streetlight pool
  const downLight = new THREE.SpotLight(0xfff3c4, 2.0, 22, Math.PI / 4, 0.5, 1.5);
  downLight.position.set(0, 6.2, 1.4);
  const target = new THREE.Object3D();
  target.position.set(0, 0, 1.4);
  lightGroup.add(target);
  downLight.target = target;

  lightGroup.add(pole, arm, lampHead, bulb, downLight);
  return lightGroup;
}
