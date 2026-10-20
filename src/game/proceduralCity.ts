import * as THREE from 'three';
import {
  getRoadTexture,
  getBuildingWindowTexture,
  getNeonSignTexture,
  createPalmTree,
  createStreetLight,
  createCNGAutoRickshaw,
  createDhakaRickshaw,
  createDhakaSignage,
  createShaplaSculpture,
  createLalbaghFortTomb,
  createHatirjheelBridge
} from './proceduralModels';

export interface CityData {
  rootGroup: THREE.Group;
  colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[];
  safehousePos: THREE.Vector3;
  bankPos: THREE.Vector3;
  observatoryPos: THREE.Vector3; // Mapped to Lalbagh Fort landmark for engine compatibility
  roadNetworkNodes: THREE.Vector3[];
  roadMaterial: THREE.MeshPhysicalMaterial;
}

/**
 * Builds the 3D Procedural Dhaka City Map (ঢাকা মানচিত্র)
 * Incorporating Gulshan, Hatirjheel, Motijheel (Shapla Chattar), Lalbagh Fort & Dhanmondi Lake.
 */
export function buildProceduralCity(scene: THREE.Scene): CityData {
  const root = new THREE.Group();
  scene.add(root);

  const colliders: { minX: number; maxX: number; minZ: number; maxZ: number; height: number }[] = [];
  const roadNodes: THREE.Vector3[] = [];

  // 1. Terrain Base (Dhaka urban basin)
  const groundGeo = new THREE.PlaneGeometry(1400, 1400);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x12171f,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // 2. Hatirjheel Lake (Central Waterway in Dhaka)
  const lakeGeo = new THREE.PlaneGeometry(160, 360);
  const lakeMat = new THREE.MeshPhysicalMaterial({
    color: 0x0369a1,
    roughness: 0.12,
    metalness: 0.25,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    transmission: 0.6,
    transparent: true,
    opacity: 0.92,
  });
  const lakeMesh = new THREE.Mesh(lakeGeo, lakeMat);
  lakeMesh.rotation.x = -Math.PI / 2;
  lakeMesh.position.set(0, 0.01, 15);
  root.add(lakeMesh);

  // Lake embankment concrete borders
  const bankBorderMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 360), bankBorderMat);
  curbLeft.position.set(-81, 0.3, 15);
  const curbRight = curbLeft.clone();
  curbRight.position.x = 81;
  root.add(curbLeft, curbRight);

  // 3. Hatirjheel Iconic Cable-Stayed Arched Bridge (Spanning across the lake)
  const hatirjheelBridge = createHatirjheelBridge(140);
  hatirjheelBridge.position.set(0, 0, 0);
  root.add(hatirjheelBridge);

  // 4. Dhaka Road Network Grid
  const roadTex = getRoadTexture();
  const roadMat = new THREE.MeshPhysicalMaterial({
    map: roadTex,
    roughness: 0.7,
    metalness: 0.15,
    clearcoat: 0.15,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.8,
  });

  const roadWidth = 14;
  const roadLength = 520;

  // East-West Expressways & Connectors (Hatirjheel Link Road, Tejgaon, Gulshan Ave connector)
  const zStreets = [-140, -70, 0, 70, 140];
  const xAvenues = [-140, -70, 0, 70, 140];

  zStreets.forEach((z) => {
    // Skip z=0 over lake since bridge covers it
    if (z === 0) {
      // East approach
      const eastApproach = new THREE.Mesh(new THREE.PlaneGeometry(180, roadWidth), roadMat);
      eastApproach.rotation.x = -Math.PI / 2;
      eastApproach.position.set(160, 0.02, 0);
      eastApproach.receiveShadow = true;
      root.add(eastApproach);

      // West approach
      const westApproach = new THREE.Mesh(new THREE.PlaneGeometry(180, roadWidth), roadMat);
      westApproach.rotation.x = -Math.PI / 2;
      westApproach.position.set(-160, 0.02, 0);
      westApproach.receiveShadow = true;
      root.add(westApproach);
    } else {
      const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadLength, roadWidth), roadMat);
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.position.set(0, 0.02, z);
      roadMesh.receiveShadow = true;
      root.add(roadMesh);
    }

    for (let x = -220; x <= 220; x += 45) {
      roadNodes.push(new THREE.Vector3(x, 0, z));
    }
  });

  // North-South Arteries (Gulshan Avenue, Mirpur Road, Kazi Nazrul Islam Ave)
  xAvenues.forEach((x) => {
    const roadMesh = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth, roadLength), roadMat);
    roadMesh.rotation.x = -Math.PI / 2;
    roadMesh.rotation.z = Math.PI / 2;
    roadMesh.position.set(x, 0.02, 0);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    for (let z = -220; z <= 220; z += 45) {
      roadNodes.push(new THREE.Vector3(x, 0, z));
    }
  });

  // Southern Expressway (Dhaka Elevated Expressway stretch)
  const hwyMesh = new THREE.Mesh(new THREE.PlaneGeometry(620, 24), roadMat);
  hwyMesh.rotation.x = -Math.PI / 2;
  hwyMesh.position.set(0, 0.02, 220);
  hwyMesh.receiveShadow = true;
  root.add(hwyMesh);

  // 5. Dhaka Commercial & High-Rise Towers (Gulshan, Banani, Motijheel)
  const windowTex = getBuildingWindowTexture();
  const buildingWallMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.7,
    metalness: 0.2,
  });

  const glassBuildingMat = new THREE.MeshStandardMaterial({
    map: windowTex,
    roughness: 0.28,
    metalness: 0.65,
  });

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

    // Rooftop parapet / helipad structure
    const roofCapGeo = new THREE.BoxGeometry(width * 0.88, 3, depth * 0.88);
    const roofCap = new THREE.Mesh(roofCapGeo, buildingWallMat);
    roofCap.position.y = height + 1.5;
    roofCap.castShadow = true;
    bGroup.add(roofCap);

    // Antenna on taller towers
    if (height > 55) {
      const antenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.4, 20, 6),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
      );
      antenna.position.set(0, height + 12, 0);
      bGroup.add(antenna);

      // Warning aviation red beacon
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      beacon.position.set(0, height + 22, 0);
      bGroup.add(beacon);
    }

    // Front facade Dhaka neon billboard
    if (neonText && neonColor) {
      const signTex = getNeonSignTexture(neonText, neonColor);
      const signMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 0.75, 4.5),
        new THREE.MeshBasicMaterial({ map: signTex, transparent: true })
      );
      signMesh.position.set(0, 10, depth / 2 + 0.15);
      bGroup.add(signMesh);
    }

    bGroup.position.set(x, 0, z);
    root.add(bGroup);

    colliders.push({
      minX: x - width / 2 - 0.5,
      maxX: x + width / 2 + 0.5,
      minZ: z - depth / 2 - 0.5,
      maxZ: z + depth / 2 + 0.5,
      height,
    });
  };

  // Dhaka Skyline Towers with authentic commercial branding
  // Gulshan & Banani Zone (NW / Center-North)
  placeBuilding(-105, -105, 38, 38, 78, 'স্বপ্ন সুপারশপ · SHWAPNO', '#10b981');
  placeBuilding(-105, -35, 36, 36, 50, 'গুলশান টাওয়ার · GULSHAN TOWER', '#38bdf8');
  placeBuilding(-35, -105, 36, 36, 65, 'বসুন্ধরা সিটি · BASHUNDHARA', '#f43f5e');

  // Motijheel Financial District (NE)
  placeBuilding(35, -105, 38, 38, 92, 'সোনালী ব্যাংক · SONALI BANK', '#eab308');
  placeBuilding(105, -105, 36, 36, 58, 'যমুনা ফিউচার · JAMUNA TOWER', '#a855f7');
  placeBuilding(105, -35, 36, 36, 46, 'পদ্মা ওয়েল · PADMA TOWER', '#06b6d4');

  // Dhanmondi & Shahbagh Zone (SW)
  placeBuilding(-105, 35, 36, 36, 48, 'ধানমন্ডি প্লাজা · DHANMONDI', '#f97316');
  placeBuilding(-105, 105, 38, 38, 42, 'ঢাকা মেডিকেল · DHAKA MED', '#ef4444');

  // Tejgaon & Karwan Bazar Zone (Center South & SE)
  placeBuilding(-35, 105, 36, 36, 52, 'মেঘনা পেট্রোলিয়াম · MEGHNA', '#ec4899');
  placeBuilding(35, 105, 38, 38, 60, 'কারওয়ান বাজার · BAZAR TOWER', '#e11d48');
  placeBuilding(105, 35, 36, 36, 48, 'ঢাকা রিজেন্সি · REGENCY', '#6366f1');
  placeBuilding(105, 105, 36, 36, 40, 'সায়েন্স ল্যাব · SCIENCE LAB', '#14b8a6');

  // 6. LANDMARK 1: GULSHAN-2 DIPLOMATIC SAFEHOUSE (Starting Hideout)
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

    // Neon Gulshan Safehouse Sign
    const shSign = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 2.8),
      new THREE.MeshBasicMaterial({
        map: getNeonSignTexture('গুলশান সেফহাউস · LEO & MIA', '#f43f5e'),
        transparent: true,
      })
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

  // 7. LANDMARK 2: MOTIJHEEL BANGLADESH BANK & SHAPLA CHATTAR (The Heist Target)
  const bankPos = new THREE.Vector3(35, 0, -35);
  {
    const bankGroup = new THREE.Group();
    // Massive Bangladesh Bank Treasury Facade
    const bankMain = new THREE.Mesh(
      new THREE.BoxGeometry(30, 14, 28),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.25 })
    );
    bankMain.position.y = 7;
    bankMain.castShadow = true;
    bankMain.receiveShadow = true;

    // Golden fluted columns
    for (let c = -12; c <= 12; c += 4.8) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.65, 14, 12),
        new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 })
      );
      col.position.set(c, 7, 14.2);
      col.castShadow = true;
      bankGroup.add(col);
    }

    // Bangladesh Bank Signboard (বাংলাদেশ ব্যাংক)
    const bankSign = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 3.2),
      new THREE.MeshBasicMaterial({
        map: getNeonSignTexture('বাংলাদেশ ব্যাংক · BANGLADESH BANK', '#fbbf24'),
        transparent: true,
      })
    );
    bankSign.position.set(0, 13, 14.3);
    bankGroup.add(bankMain, bankSign);

    bankGroup.position.copy(bankPos);
    root.add(bankGroup);

    colliders.push({
      minX: bankPos.x - 16,
      maxX: bankPos.x + 16,
      minZ: bankPos.z - 15,
      maxZ: bankPos.z + 15,
      height: 16,
    });

    // Shapla Chattar (Water Lily Monument) right in front of Motijheel intersection
    const shapla = createShaplaSculpture();
    shapla.position.set(0, 0, -70);
    root.add(shapla);
  }

  // 8. LANDMARK 3: LALBAGH FORT (লালবাগ কেল্লা, পুরান ঢাকা) - Grand Climax Summit
  // (Mapped to observatoryPos for seamless engine compatibility)
  const observatoryPos = new THREE.Vector3(0, 6, -260);
  {
    const fortGroup = new THREE.Group();

    // Historic red brick defensive bastion
    const hillGeo = new THREE.BoxGeometry(110, 8, 80);
    const hillMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.9 }); // Terracotta
    const hill = new THREE.Mesh(hillGeo, hillMat);
    hill.position.y = 4;
    hill.receiveShadow = true;
    hill.castShadow = true;
    fortGroup.add(hill);

    // Historic Tomb of Pari Bibi & Minarets
    const tomb = createLalbaghFortTomb();
    tomb.position.set(0, 8, 0);
    fortGroup.add(tomb);

    // Giant hillside letters: "DHAKA"
    const dhakaLetters = ['D', 'H', 'A', 'K', 'A'];
    dhakaLetters.forEach((letter, idx) => {
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
        new THREE.PlaneGeometry(7, 10),
        new THREE.MeshBasicMaterial({ map: lTex, transparent: true, side: THREE.DoubleSide })
      );
      letterMesh.position.set(-20 + idx * 10, 16, 42);
      letterMesh.castShadow = true;
      fortGroup.add(letterMesh);
    });

    fortGroup.position.set(observatoryPos.x, 0, observatoryPos.z);
    root.add(fortGroup);

    colliders.push({
      minX: observatoryPos.x - 45,
      maxX: observatoryPos.x + 45,
      minZ: observatoryPos.z - 35,
      maxZ: observatoryPos.z + 35,
      height: 25,
    });

    // Connecting historic avenue road
    const fortRoad = new THREE.Mesh(new THREE.PlaneGeometry(16, 120), roadMat);
    fortRoad.rotation.x = -Math.PI / 2;
    fortRoad.position.set(0, 0.03, -200);
    fortRoad.receiveShadow = true;
    root.add(fortRoad);
  }

  // 9. Overhead Bilingual Dhaka Highway Gantry Signs
  const signGulshan = createDhakaSignage('গুলশান এভিনিউ', 'GULSHAN AVENUE');
  signGulshan.position.set(-70, 0, 50);
  root.add(signGulshan);

  const signHatirjheel = createDhakaSignage('হাতিরঝিল এক্সপ্রেসওয়ে', 'HATIRJHEEL EXPRESSWAY');
  signHatirjheel.position.set(0, 0, 85);
  root.add(signHatirjheel);

  const signMotijheel = createDhakaSignage('মতিঝিল বাণিজ্যিক এলাকা', 'MOTIJHEEL C/A');
  signMotijheel.position.set(70, 0, -50);
  root.add(signMotijheel);

  const signLalbagh = createDhakaSignage('লালবাগ কেল্লা সড়ক', 'LALBAGH FORT RD');
  signLalbagh.position.set(0, 0, -170);
  root.add(signLalbagh);

  // 10. Authentic Dhaka Vehicles on Streets (Green CNGs and Cycle Rickshaws)
  const cngSpots = [
    { pos: [-38, 0, 48], rot: 0.4 },
    { pos: [68, 0, -42], rot: -1.2 },
    { pos: [-62, 0, -65], rot: 2.1 },
    { pos: [12, 0, 145], rot: -0.5 },
    { pos: [-135, 0, 35], rot: 1.5 },
  ];

  cngSpots.forEach((spot) => {
    const cng = createCNGAutoRickshaw();
    cng.position.set(spot.pos[0], spot.pos[1], spot.pos[2]);
    cng.rotation.y = spot.rot;
    root.add(cng);
  });

  const rickshawSpots = [
    { pos: [-42, 0, 30], rot: 0.8 },
    { pos: [45, 0, -60], rot: -0.9 },
    { pos: [-130, 0, -75], rot: 1.6 },
    { pos: [75, 0, 75], rot: 2.7 },
  ];

  rickshawSpots.forEach((spot) => {
    const rickshaw = createDhakaRickshaw();
    rickshaw.position.set(spot.pos[0], spot.pos[1], spot.pos[2]);
    rickshaw.rotation.y = spot.rot;
    root.add(rickshaw);
  });

  // 11. Tropical Dhaka Trees along streets
  for (let z = -140; z <= 140; z += 35) {
    [-150, -80, -10, 10, 80, 150].forEach((x) => {
      // Don't place tree inside water
      if (Math.abs(x) < 80 && Math.abs(z - 15) < 170) return;

      const tree = createPalmTree();
      tree.position.set(x + (Math.random() - 0.5) * 2, 0, z + (Math.random() - 0.5) * 2);
      root.add(tree);
    });
  }

  // 12. Street Lights at road intersections
  [-140, -70, 0, 70, 140].forEach((x) => {
    [-140, -70, 0, 70, 140].forEach((z) => {
      // Skip in water
      if (Math.abs(x) < 80 && Math.abs(z - 15) < 170) return;

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
 * Procedural Dynamic Skybox & Lighting Rig for Dhaka (Golden Hour & Tropical Twilight)
 */
export function setupAtmosphere(scene: THREE.Scene, renderer: THREE.WebGLRenderer) {
  // 1. Mandatory Studio Environment Reflection (RoomEnvironment) per Three.js skill
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const roomEnv = new RoomEnvironment();
  scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
  roomEnv.dispose();
  pmremGenerator.dispose();

  // Tropical Dhaka atmospheric fog
  scene.fog = new THREE.FogExp2(0x1a1226, 0.0035);
  scene.background = new THREE.Color(0x130d22);

  // Procedural gradient sky dome
  const skyCanvas = document.createElement('canvas');
  skyCanvas.width = 512;
  skyCanvas.height = 512;
  const sCtx = skyCanvas.getContext('2d')!;

  const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, '#09081a');    // Zenith tropical night
  skyGrad.addColorStop(0.35, '#3b124d'); // Twilight violet
  skyGrad.addColorStop(0.65, '#c2410c'); // Deep amber
  skyGrad.addColorStop(0.85, '#ea580c'); // Warm Bengal sunset
  skyGrad.addColorStop(1, '#fde047');    // Golden horizon
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
