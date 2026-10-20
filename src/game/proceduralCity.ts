import * as THREE from 'three';
import {
  getRoadTexture,
  getBuildingWindowTexture,
  getNeonSignTexture,
  createPalmTree,
  createStreetLight
} from './proceduralModels';

export interface CityData {
  rootGroup: THREE.Group;
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[];
  safehousePos: THREE.Vector3;
  bankPos: THREE.Vector3;
  observatoryPos: THREE.Vector3;
  roadNetworkNodes: THREE.Vector3[];
  roadMaterial: THREE.MeshPhysicalMaterial;
}

export function buildProceduralCity(scene: THREE.Scene): CityData {
  const root = new THREE.Group();
  scene.add(root);

  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[] = [];
  const roadNodes: THREE.Vector3[] = [];

  // 1. Terrain & Ocean Floor
  // Ground plane (Asphalt / Concrete base for downtown)
  const groundGeo = new THREE.PlaneGeometry(1200, 1200);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x141820,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // 2. Road Network Grid (Downtown Los Santos)
  const roadTex = getRoadTexture();
  const roadMat = new THREE.MeshPhysicalMaterial({
    map: roadTex,
    roughness: 0.72,
    metalness: 0.15,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.8,
  });

  // Main East-West Boulevards
  const roadWidth = 14;
  const roadLength = 500;
  const zStreets = [-140, -70, 0, 70, 140];
  const xAvenues = [-140, -70, 0, 70, 140];

  zStreets.forEach((z) => {
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, roadWidth), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.position.set(0, 0.02, z);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    // Add nodes for AI / Minimap
    for (let x = -200; x <= 200; x += 50) {
      roadNodes.push(new THREE.Vector3(x, 0, z));
    }
  });

  // North-South Avenues
  xAvenues.forEach((x) => {
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadLength), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = Math.PI / 2;
    roadMesh.position.set(x, 0.02, 0);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    for (let z = -200; z <= 200; z += 50) {
      roadNodes.push(new THREE.Vector3(x, 0, z));
    }
  });

  // Highway Section (South bypass - wide 4-lane stretch)
  const hwyMesh = new THREE.Mesh(new THREE.PlaneGeometry(600, 24), roadMat);
  hwyMesh.rotation.x = -Math.PI / 2;
  hwyMesh.position.set(0, 0.02, 220);
  hwyMesh.receiveShadow = true;
  root.add(hwyMesh);

  // 3. Sidewalks & Curbs
  const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const sidewalkHeight = 0.22;

  // 4. Buildings & Downtown Skyscrapers
  const windowTex = getBuildingWindowTexture();
  const buildingWallMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.2,
  });

  const glassBuildingMat = new THREE.MeshStandardMaterial({
    map: windowTex,
    roughness: 0.3,
    metalness: 0.6,
  });

  // Function to create a skyscraper block
  const placeBuilding = (
    x: number,
    z: number,
    width: number,
    depth: number,
    height: number,
    neonText?: string,
    neonColor?: string
  ) => {
    const bGroup = new THREE.Group();

    // Main tower
    const towerGeo = new THREE.BoxGeometry(width, height, depth);
    const towerMesh = new THREE.Mesh(towerGeo, glassBuildingMat);
    towerMesh.position.y = height / 2;
    towerMesh.castShadow = true;
    towerMesh.receiveShadow = true;
    bGroup.add(towerMesh);

    // Rooftop mechanical / Helipad
    const roofCapGeo = new THREE.BoxGeometry(width * 0.85, 3, depth * 0.85);
    const roofCap = new THREE.Mesh(roofCapGeo, buildingWallMat);
    roofCap.position.y = height + 1.5;
    roofCap.castShadow = true;
    bGroup.add(roofCap);

    // Antenna on tallest towers
    if (height > 60) {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.4, 18, 6),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      antenna.position.set(0, height + 12, 0);
      bGroup.add(antenna);

      // Warning red beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      beacon.position.set(0, height + 21, 0);
      bGroup.add(beacon);
    }

    // Neon sign on front facade
    if (neonText && neonColor) {
      const signTex = getNeonSignTexture(neonText, neonColor);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.7, 4),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
      );
      signMesh.position.set(0, 10, depth / 2 + 0.1);
      bGroup.add(signMesh);
    }

    bGroup.position.set(x, 0, z);
    root.add(bGroup);

    // Register collision box
    colliders.push({
      minX: x - width / 2 - 0.5,
      maxX: x + width / 2 + 0.5,
      minZ: z - depth / 2 - 0.5,
      maxZ: z + depth / 2 + 0.5,
      height,
    });
  };

  // Downtown Grid Blocks (Skyscrapers in between roads)
  // Block 1 (NW)
  placeBuilding(-105, -105, 38, 38, 75, 'MAZE BANK', '#38bdf8');
  placeBuilding(-105, -35, 36, 36, 45, 'VINEWOOD SUITES', '#f43f5e');

  // Block 2 (Center North)
  placeBuilding(-35, -105, 36, 36, 60, 'FIB TOWER', '#eab308');
  placeBuilding(35, -105, 38, 38, 88, 'UNION DEPOSITORY', '#a855f7');

  // Block 3 (NE)
  placeBuilding(105, -105, 36, 36, 50, 'LOM BANK', '#10b981');
  placeBuilding(105, -35, 36, 36, 40, 'PACIFIC BLUFFS', '#06b6d4');

  // Block 4 (SW)
  placeBuilding(-105, 35, 36, 36, 52, 'LEGION SQUARE', '#f97316');
  placeBuilding(-105, 105, 38, 38, 42, 'PILLBOX MEDICAL', '#ef4444');

  // Block 5 (Center South)
  placeBuilding(-35, 105, 36, 36, 48, 'METRO HOTEL', '#ec4899');
  placeBuilding(35, 105, 38, 38, 55, 'LOS SANTOS LIFE', '#e11d48');

  // Block 6 (SE)
  placeBuilding(105, 35, 36, 36, 45, 'ARCADIA TOWER', '#6366f1');
  placeBuilding(105, 105, 36, 36, 38, 'SANTOS HARBOR', '#14b8a6');

  // 5. LANDMARK 1: VINEWOOD SAFEHOUSE (Starting Hideout)
  const safehousePos = new THREE.Vector3(-35, 0, 35);
  {
    const shGroup = new THREE.Group();
    // Modern luxury hideout with garage and balcony
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(26, 7, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    base.position.y = 3.5;
    base.castShadow = true;
    base.receiveShadow = true;

    // Second floor with rooftop terrace
    const topFloor = new THREE.Mesh(
      new THREE.BoxGeometry(20, 5, 18),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    topFloor.position.set(0, 9.5, -2);
    topFloor.castShadow = true;

    // Neon love sign: "OUR SANCTUARY"
    const shSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 2.5),
      new THREE.MeshBasicMaterial({ map: getNeonSignTexture('SAFEHOUSE · L & M', '#f43f5e'), transparent: true })
    );
    shSign.position.set(0, 6.2, 12.1);

    shGroup.add(base, topFloor, shSign);
    shGroup.position.copy(safehousePos);
    root.add(shGroup);

    colliders.push({
      minX: safehousePos.x - 14,
      maxX: safehousePos.x + 14,
      minZ: safehousePos.z - 13,
      maxZ: safehousePos.z + 13,
      height: 12,
    });
  }

  // 6. LANDMARK 2: VANGELICO JEWELRY & BANK (Heist Target)
  const bankPos = new THREE.Vector3(35, 0, -35);
  {
    const bankGroup = new THREE.Group();
    // Luxurious marble and gold bank facade
    const bankMain = new THREE.Mesh(
      new THREE.BoxGeometry(28, 12, 26),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.2 })
    );
    bankMain.position.y = 6;
    bankMain.castShadow = true;
    bankMain.receiveShadow = true;

    // Golden cornice columns
    for (let c = -10; c <= 10; c += 5) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 12, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 })
      );
      col.position.set(c, 6, 13.2);
      col.castShadow = true;
      bankGroup.add(col);
    }

    // Neon Diamond Bank Sign
    const bankSign = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 3),
      new THREE.MeshBasicMaterial({ map: getNeonSignTexture('VANGELICO DIAMONDS', '#fbbf24'), transparent: true })
    );
    bankSign.position.set(0, 11, 13.3);
    bankGroup.add(bankMain, bankSign);

    bankGroup.position.copy(bankPos);
    root.add(bankGroup);

    colliders.push({
      minX: bankPos.x - 15,
      maxX: bankPos.x + 15,
      minZ: bankPos.z - 14,
      maxZ: bankPos.z + 14,
      height: 14,
    });
  }

  // 7. LANDMARK 3: VINEWOOD HILLS & GALILEO OBSERVATORY (Romantic Finale Peak)
  // Situated on a scenic mountain in the north
  const observatoryPos = new THREE.Vector3(0, 16, -260);
  {
    const obsGroup = new THREE.Group();

    // Mountain hill base
    const hillGeo = new THREE.ConeGeometry(95, 32, 16);
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x2e3828, roughness: 0.9 });
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.y = 8;
    hill.receiveShadow = true;
    obsGroup.add(hill);

    // Plaza platform
    const plaza = new THREE.Mesh(
      new THREE.CylinderGeometry(28, 30, 2, 24),
      new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.5 })
    );
    plaza.position.y = 17;
    plaza.receiveShadow = true;
    obsGroup.add(plaza);

    // Observatory Main Dome Building
    const obsBuilding = new THREE.Mesh(
      new THREE.CylinderGeometry(14, 15, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 })
    );
    obsBuilding.position.y = 21;
    obsBuilding.castShadow = true;

    // Copper telescope dome
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(10, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 })
    );
    dome.position.y = 25;
    dome.castShadow = true;

    // Romantic Lookout Railing
    const railing = new THREE.Mesh(
      new THREE.TorusGeometry(26, 0.2, 8, 32),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    railing.rotation.x = Math.PI / 2;
    railing.position.y = 18.2;

    // Giant "VINEWOOD" Hollywood Sign on the hillside
    const vinewoodLetters = ['V', 'I', 'N', 'E', 'W', 'O', 'O', 'D'];
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    vinewoodLetters.forEach((letter, idx) => {
      const letterCanvas = document.createElement('canvas');
      letterCanvas.width = 128;
      letterCanvas.height = 128;
      const lCtx = letterCanvas.getContext('2d')!;
      lCtx.fillStyle = '#ffffff';
      lCtx.font = 'bold 96px "Bebas Neue", sans-serif';
      lCtx.textAlign = 'center';
      lCtx.textBaseline = 'middle';
      lCtx.fillText(letter, 64, 64);
      const lTex = new THREE.CanvasTexture(letterCanvas);

      const letterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 9),
        new THREE.MeshBasicMaterial({ map: lTex, transparent: true, side: THREE.DoubleSide })
      );
      letterMesh.position.set(-28 + idx * 8, 14, 30);
      letterMesh.castShadow = true;
      obsGroup.add(letterMesh);
    });

    obsGroup.add(obsBuilding, dome, railing);
    obsGroup.position.set(observatoryPos.x, 0, observatoryPos.z);
    root.add(obsGroup);

    colliders.push({
      minX: observatoryPos.x - 18,
      maxX: observatoryPos.x + 18,
      minZ: observatoryPos.z - 18,
      maxZ: observatoryPos.z + 18,
      height: 35,
    });

    // Mountain road connecting downtown to observatory
    const mountainRoad = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 120),
      roadMat
    );
    mountainRoad.rotation.x = -Math.PI / 2;
    mountainRoad.position.set(0, 0.03, -200);
    mountainRoad.receiveShadow = true;
    root.add(mountainRoad);
  }

  // 8. Palm Trees along streets
  for (let z = -140; z <= 140; z += 35) {
    [-150, -80, -10, 10, 80, 150].forEach((x) => {
      const tree = createPalmTree();
      tree.position.set(x + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2);
      root.add(tree);
    });
  }

  // 9. Street Lights at intersections
  [-140, -70, 0, 70, 140].forEach((x) => {
    [-140, -70, 0, 70, 140].forEach((z) => {
      const lamp = createStreetLight();
      lamp.position.set(x + 8, 0, z + 8);
      root.add(lamp);
    });
  });

  return {
    rootGroup: root,
    colliders,
    safehousePos,
    bankPos,
    observatoryPos,
    roadNetworkNodes: roadNodes,
    roadMaterial: roadMat,
  };
}

import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

/**
 * Procedural Dynamic Skybox & Lighting Rig (Unreal Engine Golden Hour Los Santos)
 */
export function setupAtmosphere(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // 1. Mandatory Studio Environment Reflection (RoomEnvironment) per Three.js skill
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Horizon fog to blend distant city into sunset glow
  scene.fog = new THREE.FogExp2(0x1a1226, 0.0035);
  scene.background = new THREE.Color(0x130d22);

  // Procedural gradient sky dome
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const sCtx = skyCanvas.getContext('2d')!;

  const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, '#09081a');    // Deep zenith night
  skyGrad.addColorStop(0.35, '#3b124d'); // Sunset violet
  skyGrad.addColorStop(0.65, '#c2410c'); // Deep amber
  skyGrad.addColorStop(0.85, '#ea580c'); // Bright warm sunset
  skyGrad.addColorStop(1, '#fde047');    // Golden horizon glow
  sCtx.fillStyle = skyGrad;
  sCtx.fillRect(0, 0, 512, 512);

  const skyTex = new THREE.CanvasTexture(skyCanvas);
  const skyGeo = new THREE.SphereGeometry(650, 32, 16);
  const skyMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  // Sunset Sun Disc with subtle lens flare halo
  const sunMesh = new THREE.Mesh(
    new THREE.CircleGeometry(32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.95 })
  );
  sunMesh.position.set(90, 58, -480);
  scene.add(sunMesh);

  // Sun Glow Halo
  const haloMesh = new THREE.Mesh(
    new THREE.CircleGeometry(65, 32),
    new THREE.MeshBasicMaterial({
      color: 0xf97316,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  haloMesh.position.set(90, 58, -478);
  scene.add(haloMesh);

  // Key Light (Warm low sunset sun with castShadow)
  const keyLight = new THREE.DirectionalLight(0xffedd5, 2.2);
  keyLight.position.set(130, 95, -230);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 600;
  keyLight.shadow.camera.left = -160;
  keyLight.shadow.camera.right = 160;
  keyLight.shadow.camera.top = 160;
  keyLight.shadow.camera.bottom = -160;
  keyLight.shadow.bias = -0.0004;
  keyLight.shadow.normalBias = 0.02;
  scene.add(keyLight);

  // Hemisphere Light (Cool sky violet + warm road ground reflection)
  const hemiLight = new THREE.HemisphereLight(0x818cf8, 0x1e1b4b, 0.9);
  scene.add(hemiLight);

  // Soft ambient fill
  const ambLight = new THREE.AmbientLight(0xffedd5, 0.35);
  scene.add(ambLight);

  return { keyLight, hemiLight, ambLight, skyMesh, sunMesh, haloMesh, scene };
}
