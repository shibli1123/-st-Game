import React, { useState } from 'react';
import {
  MessageSquare,
  Music,
  Heart,
  DollarSign,
  Compass,
  Search,
  Loader2,
  Navigation,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PlayerStats } from '../types/game';

interface SmartphoneProps {
  stats: PlayerStats;
  isOpen: boolean;
  onClose: () => void;
  onSelectRadio: (idx: number) => void;
  currentRadioIdx: number;
  onSetWaypoint?: (x: number, z: number, label: string) => void;
}

interface GroundingChunk {
  web?: { uri?: string; title?: string };
  maps?: { placeId?: string; title?: string };
}

export const Smartphone: React.FC<SmartphoneProps> = ({
  stats,
  isOpen,
  onClose,
  onSelectRadio,
  currentRadioIdx,
  onSetWaypoint,
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'messages' | 'music' | 'bank' | 'gps'>('home');

  // Dhaka Maps Grounding State (gemini-3.8-flash + googleMaps)
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingGps, setIsLoadingGps] = useState(false);
  const [gpsIntel, setGpsIntel] = useState<string | null>(null);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);
  const [activeWaypoint, setActiveWaypoint] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset Dhaka Map Grounded Locations
  const dhakaHotspots = [
    { name: 'Gulshan-2 Circle', bangla: 'গুলশান-২ সার্কেল', coords: { x: -35, z: 35 }, type: 'Safehouse' },
    { name: 'Hatirjheel Bridge', bangla: 'হাতিরঝিল ব্রিজ', coords: { x: 0, z: 0 }, type: 'Expressway' },
    { name: 'Bangladesh Bank', bangla: 'মতিঝিল / ব্যাংক', coords: { x: 35, z: -35 }, type: 'Vault' },
    { name: 'Lalbagh Fort', bangla: 'লালবাগ কেল্লা', coords: { x: 0, z: -250 }, type: 'Mughal Citadel' },
    { name: 'Dhanmondi Lake', bangla: 'ধানমন্ডি লেক', coords: { x: -140, z: 70 }, type: 'Romantic Overlook' },
    { name: 'Shapla Chattar', bangla: 'শাপলা চত্বর', coords: { x: 0, z: -70 }, type: 'Monument' },
  ];

  // Query Google Maps Grounding via backend /api/dhaka-intel
  const handleQueryDhakaIntel = async (queryText?: string) => {
    const q = queryText || searchQuery;
    setIsLoadingGps(true);
    setGpsIntel(null);
    setGroundingSources([]);

    try {
      const res = await fetch('/api/dhaka-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (data.text) {
        setGpsIntel(data.text);
        if (data.groundingChunks) {
          setGroundingSources(data.groundingChunks);
        }
      } else {
        setGpsIntel('Failed to load satellite map data.');
      }
    } catch (err) {
      console.error('Failed to query Dhaka Maps Intel:', err);
      setGpsIntel(
        '📍 Hatirjheel Expressway & Gulshan-2: Connecting Tejgaon, Rampura, and Diplomatic Quarter. Heavy evening traffic; ideal for high-speed escape through elevated link bridges.'
      );
    } finally {
      setIsLoadingGps(false);
    }
  };

  const messages = [
    {
      id: 'm1',
      sender: 'Mia ❤️',
      text: 'Remember when we first met at Dhanmondi Lake? You ordered two plates of spicy fuchka and promised we would run Dhaka together.',
      time: '18:42',
      isLove: true,
    },
    {
      id: 'm2',
      sender: 'Mia ❤️',
      text: 'The Dominator GT handles like a dream over the Hatirjheel bridge. Keep the pedal down, Leo!',
      time: '18:50',
      isLove: true,
    },
    {
      id: 'm3',
      sender: 'Kallu (Dhaka Fixer)',
      text: 'DMP police cruisers are setting up speed traps near Motijheel C/A. Take the back alleys through Puran Dhaka.',
      time: '19:04',
      isLove: false,
    },
  ];

  const radioStations = [
    { id: 0, name: 'Dhaka FM 90.4', genre: 'Bengali Lo-Fi & Beats' },
    { id: 1, name: 'Radio Foorti 88.0', genre: 'High-Octane Pop / Rock' },
    { id: 2, name: 'Hatirjheel Synthwave', genre: 'Outrun Night Drive' },
    { id: 3, name: 'Puran Dhaka Nights', genre: 'Mellow Acoustic & Retro' },
    { id: 4, name: 'Radio OFF', genre: 'Engine Audio Only' },
  ];

  return (
    <div className="fixed bottom-24 right-8 z-30 pointer-events-auto w-84 h-[560px] bg-zinc-950 rounded-[40px] border-4 border-zinc-700 shadow-2xl flex flex-col overflow-hidden text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] animate-in slide-in-from-bottom-8 duration-300">
      {/* Phone Notch & Status Bar */}
      <div className="pt-3 px-6 pb-2 flex justify-between items-center text-[10px] text-zinc-400 bg-zinc-900 border-b border-zinc-800">
        <span className="font-mono font-bold">19:42 · ঢাকা</span>
        <div className="w-20 h-4 bg-black rounded-full" />
        <div className="flex items-center gap-1 font-mono">
          <span>5G Teletalk</span>
          <span>100%</span>
        </div>
      </div>

      {/* Screen Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Lockscreen Wallpaper: Leo & Mia Dhaka Lockup */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/70 via-purple-950/60 to-emerald-950/50 border border-rose-500/30 text-center">
              <Heart className="w-8 h-8 text-rose-500 mx-auto fill-rose-500 mb-1" />
              <p className="font-gta text-2xl tracking-wider text-rose-300">LEO &amp; MIA</p>
              <p className="text-xs text-rose-200/80 font-romance">ঢাকা লাভ স্টোরি · Dhaka Outlaws</p>
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('gps');
                  if (!gpsIntel) handleQueryDhakaIntel('Dhaka Bangladesh iconic landmarks and getaway routes');
                }}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 transition-all cursor-pointer"
              >
                <Compass className="w-6 h-6 text-cyan-400" />
                <span className="text-[10px] font-semibold text-center leading-tight">Dhaka GPS</span>
              </button>

              <button
                onClick={() => setActiveTab('messages')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 transition-all cursor-pointer"
              >
                <MessageSquare className="w-6 h-6 text-rose-400" />
                <span className="text-[10px] font-semibold text-center leading-tight">Messages</span>
              </button>

              <button
                onClick={() => setActiveTab('music')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Music className="w-6 h-6 text-amber-400" />
                <span className="text-[10px] font-semibold text-center leading-tight">FM Radio</span>
              </button>

              <button
                onClick={() => setActiveTab('bank')}
                className="flex flex-col items-center gap-1 p-2.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 transition-all cursor-pointer"
              >
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span className="text-[10px] font-semibold text-center leading-tight">BB Vault</span>
              </button>
            </div>

            {/* Dhaka City Status Banner */}
            <div className="mt-3 p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active City Zone
                </span>
                <span className="font-bold text-cyan-300">Gulshan · Hatirjheel</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>DMP Wanted Dragnet</span>
                <span className="font-bold text-amber-400">{stats.wantedLevel} / 5 Stars</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Vehicle Health</span>
                <span className="font-bold text-emerald-400">{Math.round(stats.vehicleHealth)}%</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Weather</span>
                <span className="font-bold capitalize text-sky-300">{stats.weather.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        )}

        {/* DHAKA GOOGLE MAPS GPS NAVIGATOR TAB */}
        {activeTab === 'gps' && (
          <div className="space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h3 className="font-gta text-lg text-cyan-400">Dhaka Google Maps</h3>
              </div>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
            </div>

            {/* Search Input for Dhaka Map Grounding */}
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQueryDhakaIntel()}
                  placeholder="Search Dhaka place or road..."
                  className="w-full pl-8 pr-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                onClick={() => handleQueryDhakaIntel()}
                disabled={isLoadingGps}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
              >
                {isLoadingGps ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Intel'}
              </button>
            </div>

            {/* Quick Dhaka Landmarks Grid */}
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                Quick Waypoints (ঢাকা ল্যান্ডমার্ক):
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {dhakaHotspots.map((spot) => (
                  <button
                    key={spot.name}
                    onClick={() => {
                      if (onSetWaypoint) {
                        onSetWaypoint(spot.coords.x, spot.coords.z, spot.name);
                        setActiveWaypoint(spot.name);
                      }
                      handleQueryDhakaIntel(`${spot.name} Dhaka Bangladesh`);
                    }}
                    className={`p-1.5 rounded-lg text-left text-[11px] border transition-all cursor-pointer ${
                      activeWaypoint === spot.name
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:border-zinc-600'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span className="truncate">{spot.name}</span>
                      <Navigation className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                    </div>
                    <div className="text-[9px] text-zinc-400 truncate">{spot.bangla}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Google Maps Grounded Intelligence Display */}
            <div className="flex-1 overflow-y-auto p-2.5 rounded-xl bg-zinc-900/90 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Live Maps Grounding (Gemini 3.8 Flash)
                </span>
                {isLoadingGps && <span className="animate-pulse text-amber-400">Scanning Satellite...</span>}
              </div>

              {isLoadingGps ? (
                <div className="py-6 flex flex-col items-center justify-center text-zinc-400 text-xs gap-2">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span>Grounding with Google Maps satellite data...</span>
                </div>
              ) : (
                <div className="text-xs text-zinc-200 whitespace-pre-line leading-relaxed font-sans">
                  {gpsIntel || 'Select a Dhaka location or search above to receive real-time Google Maps grounded intelligence.'}
                </div>
              )}

              {/* Grounding Sources */}
              {groundingSources.length > 0 && (
                <div className="pt-2 border-t border-zinc-800 space-y-1">
                  <span className="text-[9px] text-zinc-400 uppercase">Google Maps Grounded References:</span>
                  <div className="flex flex-wrap gap-1">
                    {groundingSources.map((chunk, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-300"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        {chunk.maps?.title || chunk.web?.title || 'Dhaka Map Grounding'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-gta text-lg text-rose-400">iFruit Messages</h3>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
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

        {/* RADIO TAB */}
        {activeTab === 'music' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-gta text-lg text-amber-400">Dhaka FM Stations</h3>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
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

        {/* BANK TAB */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="font-gta text-lg text-emerald-400">Bangladesh Bank Mobile</h3>
              <button
                onClick={() => setActiveTab('home')}
                className="text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Back
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 text-center">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                Joint Vault Cache (মতিঝিল অ্যাকাউন্ট)
              </span>
              <div className="font-gta text-3xl text-emerald-400 tabular-nums mt-1">
                ৳ {stats.cash.toLocaleString()} BDT
              </div>
              <p className="text-[11px] text-zinc-400 mt-2">Leo &amp; Mia · Untraceable Crypto Bonds</p>
            </div>
          </div>
        )}
      </div>

      {/* Home Bar */}
      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex justify-center">
        <button
          onClick={onClose}
          className="w-12 h-1 bg-zinc-600 hover:bg-zinc-400 rounded-full cursor-pointer"
        />
      </div>
    </div>
  );
};
