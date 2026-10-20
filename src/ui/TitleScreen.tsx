import React, { useEffect } from 'react';
import { Play, Sparkles, Heart, Compass, MapPin } from 'lucide-react';
import { CAMPAIGN_MISSIONS } from '../data/missions';
import { Mission } from '../types/game';

interface TitleScreenProps {
  onStartGame: (mission?: Mission) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onStartGame(CAMPAIGN_MISSIONS[0]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame]);

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-12 z-20 pointer-events-auto select-none overflow-hidden bg-gradient-to-t from-black/85 via-black/25 to-black/50">
      {/* Top Bar / Rating / Studio Tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-xs font-black tracking-widest bg-red-600 text-white rounded uppercase shadow-lg">
            M 17+
          </span>
          <span className="text-xs uppercase tracking-widest text-zinc-300 font-semibold flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            Dhaka Outlaw Romance · ঢাকা লাভ স্টোরি
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs tracking-wider uppercase text-zinc-300 font-bold flex items-center gap-1 justify-end">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Dhaka, Bangladesh Map
          </p>
          <p className="text-xs tracking-wider text-rose-400 font-romance">Leo &amp; Mia</p>
        </div>
      </div>

      {/* Center Hero Title Lockup */}
      <div className="max-w-2xl my-auto">
        <div className="mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          A 3D Bonnie &amp; Clyde Action Saga in Dhaka
        </div>

        {/* Bespoke Title SVG Lockup */}
        <div className="relative py-2">
          <svg viewBox="0 0 740 180" className="w-full max-w-xl h-auto drop-shadow-[0_8px_24px_rgba(244,63,94,0.35)]">
            <defs>
              <linearGradient id="gtaTitleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="60%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
              <linearGradient id="neonPinkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="50%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {/* Bold GTA Condensed Lettering */}
            <text
              x="0"
              y="60"
              fill="url(#gtaTitleGrad)"
              fontFamily="'Bebas Neue', sans-serif"
              fontSize="68"
              fontWeight="900"
              letterSpacing="3"
            >
              GRAND THEFT
            </text>
            <text
              x="2"
              y="135"
              fill="#fbbf24"
              fontFamily="'Bebas Neue', sans-serif"
              fontSize="78"
              fontWeight="900"
              letterSpacing="4"
            >
              DHAKA
            </text>
            {/* Cursive Romantic Subtitle overlay */}
            <text
              x="200"
              y="155"
              fill="url(#neonPinkGrad)"
              fontFamily="'Playfair Display', serif"
              fontStyle="italic"
              fontSize="34"
              fontWeight="700"
            >
              A Dhaka Love Story
            </text>
          </svg>
        </div>

        <p className="text-sm md:text-base text-zinc-300 max-w-lg mb-8 leading-relaxed font-normal">
          High speeds, monsoon rains, and vault heists across Dhaka, Bangladesh. Cruise the illuminated Hatirjheel
          expressway with your soulmate Mia, pull off daring scores at Bangladesh Bank, and evade DMP cruiser pursuits.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => onStartGame(CAMPAIGN_MISSIONS[0])}
            className="px-8 py-4 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-gta text-2xl tracking-wider rounded-lg shadow-xl shadow-rose-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white" />
            START DHAKA LOVE STORY
            <span className="text-xs px-2 py-0.5 rounded bg-black/30 font-sans tracking-normal font-semibold">ENTER / SPACE</span>
          </button>

          <button
            onClick={() => onStartGame(undefined)}
            className="px-6 py-4 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-gta text-xl tracking-wider rounded-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-5 h-5 text-amber-400" />
            FREE ROAM DHAKA
          </button>
        </div>
      </div>

      {/* Mission Select Drawer & Control Hints Footer */}
      <div className="space-y-4">
        {/* Quick Mission Select Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-zinc-400 font-semibold uppercase tracking-wider text-[11px] whitespace-nowrap">
            Dhaka Missions:
          </span>
          {CAMPAIGN_MISSIONS.map((m) => (
            <button
              key={m.id}
              onClick={() => onStartGame(m)}
              className="px-3 py-1.5 rounded-md bg-zinc-900/80 hover:bg-rose-950/80 border border-zinc-700 hover:border-rose-500 text-zinc-300 hover:text-white transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
            >
              <span className="font-gta text-rose-400">0{m.number}</span>
              <span className="font-medium">{m.title}</span>
            </button>
          ))}
        </div>

        {/* Flat single control-hint line */}
        <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-6 font-mono">
            <span><strong className="text-zinc-200">WASD / Arrows</strong> Drive &amp; Move</span>
            <span><strong className="text-zinc-200">Space</strong> Handbrake Drift / Jump</span>
            <span><strong className="text-zinc-200">Shift</strong> Nitro / Sprint</span>
            <span><strong className="text-zinc-200">F / Enter</strong> Enter / Exit Vehicle</span>
            <span><strong className="text-zinc-200">Click</strong> Shoot &amp; Cover Fire</span>
            <span><strong className="text-zinc-200">V / Caps</strong> Bullet-Time Focus</span>
            <span><strong className="text-zinc-200">C</strong> Camera</span>
          </div>
          <div className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            Dhaka Map • Google Maps Grounded (Gemini 3.8 Flash) • Unreal Engine PBR
          </div>
        </div>
      </div>
    </div>
  );
};
