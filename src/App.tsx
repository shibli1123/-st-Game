/**
 * Grand Theft Valentine: A Los Santos Love Story
 * Interactive 3D Action-Adventure Romance in the spirit of GTA V.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { soundEngine } from './audio/soundEngine';
import { CAMPAIGN_MISSIONS } from './data/missions';
import {
  GameScreen,
  CameraMode,
  PlayerStats,
  DialogueItem,
  Mission
} from './types/game';

import { TitleScreen } from './ui/TitleScreen';
import { GameHUD } from './ui/GameHUD';
import { BottomDock } from './ui/BottomDock';
import { Smartphone } from './ui/Smartphone';
import { MissionPassedModal } from './ui/MissionPassedModal';
import { WastedModal } from './ui/WastedModal';
import { EndingModal } from './ui/EndingModal';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High-Level Game State
  const [screen, setScreen] = useState<GameScreen>('title');
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [currentRadioIdx, setCurrentRadioIdx] = useState<number>(0);
  const [isPhoneOpen, setIsPhoneOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [wastedReason, setWastedReason] = useState<string>('Busted by LSPD');

  // Dynamic Gameplay State
  const [stats, setStats] = useState<PlayerStats>({
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
  });

  const [activeDialogue, setActiveDialogue] = useState<DialogueItem | null>(null);
  const dialogueTimerRef = useRef<number | null>(null);

  const [lastPassedMission, setLastPassedMission] = useState<Mission | null>(null);
  const [minimapData, setMinimapData] = useState<{
    playerPos: { x: number; z: number; heading: number };
    miaPos?: { x: number; z: number };
    policePositions: { x: number; z: number; heading: number }[];
    targetPos?: { x: number; z: number; radius: number };
  } | null>(null);

  // Initialize 3D Three.js Game Engine once inside ref container
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new GameEngine(containerRef.current, {
      onStatsUpdate: (newStats) => {
        setStats(newStats);
      },
      onDialogue: (dialogue) => {
        setActiveDialogue(dialogue);
        if (dialogueTimerRef.current) {
          clearTimeout(dialogueTimerRef.current);
        }
        dialogueTimerRef.current = window.setTimeout(() => {
          setActiveDialogue(null);
        }, dialogue.duration * 1000);
      },
      onMissionPassed: (mission, passedStats) => {
        setLastPassedMission(mission);
        if (mission.number === 4) {
          setScreen('ending');
        } else {
          setScreen('mission_passed');
        }
      },
      onWasted: (reason) => {
        setWastedReason(reason);
        setScreen('wasted');
      },
      onMinimapUpdate: (data) => {
        setMinimapData(data);
      },
    });

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Handle Audio Context & Sound Engine Initialization
  const handleUserGestureAudio = useCallback(() => {
    soundEngine.init();
    soundEngine.resume();
  }, []);

  // Start Game / Mission
  const handleStartGame = (mission?: Mission) => {
    handleUserGestureAudio();
    if (engineRef.current) {
      if (mission) {
        engineRef.current.setMission(mission);
      }
      setScreen('playing');
    }
  };

  // Continue to next mission from Mission Passed modal
  const handleContinueNextMission = () => {
    if (!lastPassedMission) {
      setScreen('playing');
      return;
    }
    const nextMissionNum = lastPassedMission.number + 1;
    const nextMission = CAMPAIGN_MISSIONS.find((m) => m.number === nextMissionNum);

    if (nextMission && engineRef.current) {
      engineRef.current.setMission(nextMission);
      setScreen('playing');
    } else {
      // Free roam after campaign
      setScreen('playing');
    }
  };

  // Respawn from Wasted
  const handleRespawn = () => {
    if (engineRef.current) {
      engineRef.current.respawn();
      setScreen('playing');
    }
  };

  // Camera Mode Select
  const handleSelectCamera = (mode: CameraMode) => {
    setCameraMode(mode);
    if (engineRef.current) {
      engineRef.current.cameraMode = mode;
    }
  };

  // Radio Station Select
  const handleSelectRadio = (idx: number) => {
    handleUserGestureAudio();
    setCurrentRadioIdx(idx);
    soundEngine.setStation(idx);
  };

  // Toggle Special Ability
  const handleToggleSpecial = () => {
    if (engineRef.current) {
      engineRef.current.toggleSpecialAbility();
    }
  };

  // Toggle Enter/Exit Vehicle
  const handleToggleVehicle = () => {
    if (engineRef.current) {
      engineRef.current.toggleVehicleEnterExit();
    }
  };

  // Shoot Weapon
  const handleShoot = () => {
    if (engineRef.current) {
      engineRef.current.playerShoot();
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Cycle Dynamic Weather
  const handleCycleWeather = () => {
    if (engineRef.current) {
      engineRef.current.cycleWeather();
    }
  };

  // Set Custom GPS Waypoint from Dhaka Google Maps
  const handleSetWaypoint = (x: number, z: number, label: string) => {
    if (engineRef.current) {
      engineRef.current.setCustomWaypoint(x, z, label);
    }
  };

  return (
    <div
      onClick={handleUserGestureAudio}
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans"
    >
      {/* Isolated WebGL Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Cinematic Scanlines & Vignette */}
      <div className="absolute inset-0 scanlines z-[1]" />
      <div className="absolute inset-0 vignette z-[1]" />

      {/* TITLE SCREEN */}
      {screen === 'title' && (
        <TitleScreen onStartGame={handleStartGame} />
      )}

      {/* PLAYING HUD & CONTROLS (100% Text-Free Unreal Experience) */}
      {screen === 'playing' && (
        <>
          <GameHUD
            stats={stats}
            minimapData={minimapData}
          />

          <BottomDock
            stats={stats}
            cameraMode={cameraMode}
            onSelectCamera={handleSelectCamera}
            currentRadioIdx={currentRadioIdx}
            onSelectRadio={handleSelectRadio}
            onToggleSpecial={handleToggleSpecial}
            onTogglePhone={() => setIsPhoneOpen((prev) => !prev)}
            isPhoneOpen={isPhoneOpen}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onToggleVehicle={handleToggleVehicle}
            onShoot={handleShoot}
            onCycleWeather={handleCycleWeather}
          />

          {/* iFruit Smartphone with Dhaka Google Maps Grounding */}
          <Smartphone
            stats={stats}
            isOpen={isPhoneOpen}
            onClose={() => setIsPhoneOpen(false)}
            onSelectRadio={handleSelectRadio}
            currentRadioIdx={currentRadioIdx}
            onSetWaypoint={handleSetWaypoint}
          />
        </>
      )}

      {/* MISSION PASSED MODAL */}
      {screen === 'mission_passed' && lastPassedMission && (
        <MissionPassedModal
          mission={lastPassedMission}
          stats={stats}
          onContinue={handleContinueNextMission}
        />
      )}

      {/* WASTED MODAL */}
      {screen === 'wasted' && (
        <WastedModal
          reason={wastedReason}
          onRespawn={handleRespawn}
        />
      )}

      {/* GRAND FINALE ENDING MODAL */}
      {screen === 'ending' && (
        <EndingModal
          stats={stats}
          onContinueFreeRoam={() => setScreen('playing')}
          onRestartStory={() => handleStartGame(CAMPAIGN_MISSIONS[0])}
        />
      )}
    </div>
  );
}
