import React, { useState } from 'react';
import { X, MessageSquare, Music, Shield, Heart, MapPin, DollarSign, Camera } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface SmartphoneProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
  onSelectRadio: (idx: number) => void;
  currentRadioIdx: number;
}

export const Smartphone: React.FC<SmartphoneProps> = ({
  stats,
  isOpen,
  onClose,
  onSelectRadio,
  currentRadioIdx,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'music' | 'bank'>('home');

  if (!isOpen) return null;

  const messages = [
    {
      id: 'm1',
      sender: 'Mia ❤️',
      text: 'Remember when we met in Little Seoul? You stole my car, and I stole your heart.',
      time: '18:42',
      isLove: true,
    },
    {
      id: 'm2',
      sender: 'Mia ❤️',
      text: 'Keep that pedal down, Leo. Once we hit $2M we are buying that villa in Vice City.',
      time: '18:50',
      isLove: true,
    },
    {
      id: 'm3',
      sender: 'Lester (Fixer)',
      text: 'Police scanner is active on channel 4. Keep your heads low near downtown.',
      time: '19:04',
      isLove: false,
    },
  ];

  const radioStations = [
    { id: 0, name: 'Los Santos Synthwave', genre: '80s Electro / Outrun' },
    { id: 1, name: 'West Coast Nights', genre: 'G-Funk / Hip Hop' },
    { id: 2, name: 'Sunset Romance', genre: 'Lofi Chords & Chill' },
    { id: 3, name: 'Radio Mirror Park', genre: 'Indie Electro Dance' },
    { id: 4, name: 'Radio OFF', genre: 'Engine Only' },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-30 pointer-events-auto w-80 h-[520px] bg-zinc-950 rounded-[40px] border-4 border-zinc-700 shadow-2xl flex flex-col overflow-hidden text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-8 duration-300">
      {/* Phone Notch & Status Bar */}
      <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[10px] text-zinc-400 bg-zinc-900 border-b border-zinc-800">
        <span className="font-mono font-bold">19:42</span>
        <div className="w-20 h-4 bg-black rounded-full" />
        <div className="flex items-center gap-1 font-mono">
          <span>5G</span>
          <span>100%</span>
        </div>
      </div>

      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Lockscreen Wallpaper: Leo & Mia Selfie Lockup */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/60 to-purple-950/60 border border-rose-500/30 text-center">
              <Heart className="w-8 h-8 text-rose-500 mx-auto fill-rose-500 mb-1" />
              <p className="font-gta text-2xl tracking-wider text-rose-300">LEO &amp; MIA</p>
              <p className="text-xs text-rose-200/80 font-romance">Partners for Life</p>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button
                onClick={() => setActiveTab('messages')}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 transition-all cursor-pointer"
              >
                <MessageSquare className="w-6 h-6 text-rose-400" />
                <span className="text-[11px] font-semibold">Messages</span>
              </button>

              <button
                onClick={() => setActiveTab('music')}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Music className="w-6 h-6 text-amber-400" />
                <span className="text-[11px] font-semibold">Radio</span>
              </button>

              <button
                onClick={() => setActiveTab('bank')}
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all cursor-pointer"
              >
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span className="text-[11px] font-semibold">Maze Bank</span>
              </button>
            </div>

            {/* Quick Stats Pill */}
            <div className="mt-4 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between text-zinc-400">
                <span>Wanted Level</span>
                <span className="font-bold text-amber-400">{stats.wantedLevel} / 5 Stars</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Vehicle Health</span>
                <span className="font-bold text-emerald-400">{Math.round(stats.vehicleHealth)}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-gta text-lg text-rose-400">iFruit Messages</h3>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
            </div>
            <div className="space-y-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs space-y-1 ${
                    m.isLove
                      ? 'bg-rose-950/40 border border-rose-500/30 text-rose-100'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
                  }`}
                >
                  <div className="flex justify-between font-bold">
                    <span>{m.sender}</span>
                    <span className="text-[10px] text-zinc-400">{m.time}</span>
                  </div>
                  <p className="leading-relaxed">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'music' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-gta text-lg text-amber-400">Radio Stations</h3>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
            </div>
            <div className="space-y-2">
              {radioStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => onSelectRadio(station.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                    currentRadioIdx === station.id
                      ? 'bg-amber-500/20 border border-amber-500 text-amber-200'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <div>
                    <div className="font-bold">{station.name}</div>
                    <div className="text-[10px] text-zinc-400">{station.genre}</div>
                  </div>
                  {currentRadioIdx === station.id && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                      PLAYING
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-gta text-lg text-emerald-400">Maze Bank Mobile</h3>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-center">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">Available Balance</span>
              <div className="font-gta text-3xl text-emerald-400 tabular-nums mt-1">
                ${stats.cash.toLocaleString()}
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Joint Account: Leo &amp; Mia</p>
            </div>
          </div>
        )}
      </div>

      {/* Home Button & Close */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-center">
        <button
          onClick={onClose}
          className="w-12 h-1 bg-zinc-600 hover:bg-zinc-400 rounded-full cursor-pointer"
        />
      </div>
    </div>
  );
};
