# Grand Theft Valentine: A Los Santos Love Story

> **High-Fidelity 3D Action-Adventure Romance** in the spirit of GTA V, crafted with **Three.js**, **React 19**, and **Tailwind CSS**. 

Experience the gritty romance of outlaw soulmates **Leo & Mia** on adrenaline-fueled escapades across a cinematic, sunset-drenched Los Santos. Built with an **Unreal Engine-inspired aesthetic**, high-performance PBR materials, dynamic suspension physics, real-time weather reflections, and zero immersion-breaking text during gameplay.

---

## 🌟 Key Features

### 🎮 Unreal Engine-Style Immersion & Realism
- **PBR Rendering Pipeline**: ACES Filmic tone mapping, PCF soft shadows, multi-layer clearcoat vehicle finishes (`MeshPhysicalMaterial`), metallic alloy wheels, and glowing Xenon optics.
- **Physical Vehicle Dynamics**: Dynamic spring-arm chase camera, sprung-mass body tilt/roll physics during aggressive cornering, drifting, and high-speed braking.
- **Zero In-Game Text Immersion**: Clean, diegetic graphical HUD featuring an automotive-style tachometer/speedometer, glowing arc meters for Health, Armor, Nitro, and Love Meter, and world-space 3D holographic beacons.

### 🌧️ Dynamic Weather & Wet Street Reflections
- **Real-Time Weather System**: Smoothly cycles between **Clear Golden Hour**, **Overcast Twilight**, and **Light Rain**.
- **Dynamic Wetness & Puddle Reflections**: Rain causes asphalt roughness to drop and metalness/reflectivity to surge, creating mirror-like street reflections of skyscrapers, neon signs, and glowing car taillights.
- **Particle Systems**: High-density rain streaks with physics-driven ground splashes, tire smoke during burnouts, and exhaust flame sparks.

### ❤️ GTA V-Style Narrative & Companion AI
- **Bonnie & Clyde Romance**: Mia rides shotgun, reacting dynamically with voice lines, warning of incoming cruisers, and providing covering fire during police pursuits.
- **Police Pursuit & Wanted System**: Evade 1-to-5 star LSPD cruisers equipped with flashing emergency lightbars, aggressive pit-maneuvers, and tactical AI.
- **Full Story Campaign**:
  1. *First Sparks & Fast Wheels* — Scenic sunset getaway cruise.
  2. *Vangelico Diamonds* — High-stakes jewelry heist and getaway pursuit.
  3. *Freeway Standoff* — High-speed evasive maneuver along the coast.
  4. *Sunset at Galileo Observatory* — Grand cinematic climax with branching romantic endings.

### 🔊 Procedural Web Audio Engine
- 100% self-contained audio synthesis via Web Audio API:
  - Procedural RPM-tuned muscle car engine rumble and throttle harmonics.
  - Screeching tire drift friction and high-pressure nitro purge.
  - Multi-frequency LSPD dual-tone wailing sirens.
  - Gunshot transients, cash register chimes, and bullet-time slow-mo filters.

---

## 🕹️ Controls

| Action | Key / Control |
|---|---|
| **Accelerate / Steer** | `W`, `A`, `S`, `D` or `Arrow Keys` |
| **Handbrake / Drift** | `Spacebar` |
| **Nitro Boost / Sprint** | `Shift` (Hold) |
| **Enter / Exit Vehicle** | `F` or `Enter` |
| **Bullet-Time Focus** | `V` or `Caps Lock` |
| **Cycle Camera (Chase / Hood / Top-down / Cinematic)** | `C` |
| **Fire Sidearm** | `Left Click` |
| **Toggle Interactive Smartphone** | `Up Arrow` or Phone Icon |
| **Toggle HUD Dock** | `H` |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/) (r174+)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Audio**: Web Audio API (Fully procedural synthesizer)
- **Icons & Motion**: Lucide React + Motion

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- Modern WebGL2-compatible browser (Chrome, Edge, Firefox, Safari)

### Installation

```bash
# Clone the repository
git clone https://github.com/shibli1123/Game.git
cd Game

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
├── src/
│   ├── audio/
│   │   └── soundEngine.ts        # Procedural Web Audio synthesizer (engine, sirens, gunshots)
│   ├── data/
│   │   └── missions.ts           # 4-stage romantic heist campaign data & dialogue
│   ├── game/
│   │   ├── engine.ts             # 3D GameEngine, physics loop, weather system, companion AI
│   │   ├── proceduralCity.ts     # Procedural Los Santos (skyscrapers, highways, observatory)
│   │   └── proceduralModels.ts   # PBR vehicle models, characters, palm trees, streetlamps
│   ├── types/
│   │   └── game.ts               # Core game types, stats, weather states
│   ├── ui/
│   │   ├── BottomDock.tsx        # Ergonomic minimal control dock
│   │   ├── EndingModal.tsx       # Romantic finale modal with story branches
│   │   ├── GameHUD.tsx           # Text-free diegetic HUD & speedometer
│   │   ├── MissionPassedModal.tsx# GTA V-style Mission Passed banner
│   │   ├── Smartphone.tsx        # Interactive iFruit phone
│   │   ├── TitleScreen.tsx       # Live cinematic camera title screen
│   │   └── WastedModal.tsx       # Busted / Wasted screen
│   ├── App.tsx                   # Main React orchestrator
│   └── main.tsx                  # App entry point
├── index.html                    # SEO & metadata
├── package.json
└── vite.config.ts
```

---

## 📄 License

Licensed under the Apache-2.0 License.
