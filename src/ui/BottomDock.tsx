import React, { useState, useEffect } from 'react';
import {
  Camera,
  Radio,
  Zap,
  Smartphone as PhoneIcon,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Car,
  User,
  Crosshair,
  Sun,
  Cloud,
  CloudRain
} from 'lucide-react';
import { CameraMode, PlayerStats } from '../types/game';

interface BottomDockProps {
  stats: PlayerStats;
  cameraMode: CameraMode;
  onSelectCamera: (mode: CameraMode) => void;
  currentRadioIdx: number;
  onSelectRadio: (idx: number) => void;
  onToggleSpecial: () => void;
  onTogglePhone: () => void;
  isPhoneOpen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleVehicle: () => void;
  onShoot: () => void;
  onCycleWeather?: () => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  stats,
  cameraMode,
  onSelectCamera,
  currentRadioIdx,
  onSelectRadio,
  onToggleSpecial,
  onTogglePhone,
  isPhoneOpen,
  isMuted,
  onToggleMute,
  onToggleVehicle,
  onShoot,
  onCycleWeather,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setIsCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const radioStations = [
    { id: 0, label: '1' },
    { id: 1, label: '2' },
    { id: 2, label: '3' },
    { id: 3, label: '4' },
    { id: 4, label: '0' },
  ];

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-20 pointer-events-auto transition-transform duration-300 flex flex-col items-center"
      style={{
        bottom: '12px',
        maxWidth: 'min(800px, 92vw)',
        transform: isCollapsed ? 'translate(-50%, calc(100% - 20px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Sleek Minimal Collapse/Expand Toggle Tab */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-3 py-0.5 mb-0.5 rounded-t-md bg-zinc-950/80 hover:bg-zinc-900 border-t border-x border-white/10 text-zinc-400 hover:text-white cursor-pointer shadow-lg transition-colors"
      >
        {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Main Unified Horizontal Dock Container (Clean Icon-Based) */}
      <div className="w-full bg-zinc-950/90 border border-white/10 rounded-xl p-2 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 text-xs text-white">
        {/* GROUP 1: Camera Modes */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-white/5">
          <Camera className="w-3.5 h-3.5 text-zinc-400 mx-1" />
          {(['chase', 'hood', 'topdown', 'cinematic'] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onSelectCamera(mode)}
              className={`px-2 py-0.5 rounded uppercase text-[10px] font-semibold transition-all cursor-pointer ${
                cameraMode === mode
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {mode[0].toUpperCase()}
            </button>
          ))}
        </div>

        {/* GROUP 2: Radio Station Selector */}
        <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-white/5">
          <Radio className="w-3.5 h-3.5 text-amber-400 mx-1" />
          {radioStations.map((st) => (
            <button
              key={st.id}
              onClick={() => onSelectRadio(st.id)}
              className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                currentRadioIdx === st.id
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* GROUP 3: Quick Action Buttons (Special Ability, Vehicle, Phone, Audio) */}
        <div className="flex items-center gap-1.5">
          {/* Special Focus Ability */}
          <button
            onClick={onToggleSpecial}
            className={`px-3 py-1.5 rounded-xl font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              stats.isSpecialActive
                ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/40'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Focus (V)</span>
          </button>

          {/* Enter/Exit Vehicle */}
          <button
            onClick={onToggleVehicle}
            className="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {stats.isInVehicle ? <Car className="w-3.5 h-3.5 text-rose-400" /> : <User className="w-3.5 h-3.5 text-sky-400" />}
            <span>{stats.isInVehicle ? 'Exit (F)' : 'Enter (F)'}</span>
          </button>

          {/* Cover Fire / Shoot */}
          <button
            onClick={onShoot}
            className="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-red-400 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Fire (Click)</span>
          </button>

          {/* iFruit Smartphone */}
          <button
            onClick={onTogglePhone}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isPhoneOpen
                ? 'bg-rose-600 border-rose-500 text-white'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
            }`}
            title="Toggle Smartphone"
          >
            <PhoneIcon className="w-4 h-4" />
          </button>

          {/* Dynamic Weather Cycle Button */}
          {onCycleWeather && (
            <button
              onClick={onCycleWeather}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-sky-400 hover:text-white transition-all cursor-pointer"
              title="Cycle Weather (T)"
            >
              {stats.weather === 'light_rain' ? (
                <CloudRain className="w-4 h-4 text-cyan-400" />
              ) : stats.weather === 'overcast' ? (
                <Cloud className="w-4 h-4 text-slate-300" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>
          )}

          {/* Mute Audio */}
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
            title="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
