import React, { useState } from 'react';
import { Heart, Sparkles, Plane, Gem, ArrowRight, RotateCcw } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface EndingModalProps {
  stats: PlayerStats;
  onContinueFreeRoam: () => void;
  onRestartStory: () => void;
}

export const EndingModal: React.FC<EndingModalProps> = ({
  stats,
  onContinueFreeRoam,
  onRestartStory,
}) => {
  const [chosenEnding, setChosenEnding] = useState<'proposal' | 'vice_city' | null>(null);

  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 select-none animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-2xl w-full bg-zinc-950 border-2 border-rose-500/80 rounded-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(244,63,94,0.4)] text-center space-y-6 my-auto">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-widest">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          The Grand Finale · Galileo Observatory Summit
        </div>

        <div>
          <h1 className="font-gta text-5xl md:text-6xl text-white tracking-wide">
            LOS SANTOS IS OURS
          </h1>
          <p className="font-romance text-xl md:text-2xl text-rose-300 italic mt-1">
            "A Love Story Written in Rubber &amp; Gunsmoke"
          </p>
        </div>

        {!chosenEnding ? (
          <div className="space-y-6">
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              Standing together at the peak of Vinewood Hills with millions in diamonds and the setting sun washing Los
              Santos in warm purple and gold, Mia turns to Leo. It is time to decide your future together.
            </p>

            <div className="grid md:grid-cols-2 gap-4 text-left">
              {/* Option A: Diamond Proposal */}
              <button
                onClick={() => setChosenEnding('proposal')}
                className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/50 to-purple-950/40 hover:from-rose-950/80 hover:to-purple-950/70 border-2 border-rose-500/40 hover:border-rose-400 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Gem className="w-7 h-7 text-rose-400" />
                </div>
                <h3 className="font-gta text-2xl text-white">THE DIAMOND PROPOSAL</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Leo pulls out the rare blue diamond from the Vangelico vault, drops to one knee, and asks Mia to be his
                  wife.
                </p>
              </button>

              {/* Option B: Jet to Vice City */}
              <button
                onClick={() => setChosenEnding('vice_city')}
                className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/50 to-orange-950/40 hover:from-amber-950/80 hover:to-orange-950/70 border-2 border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plane className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="font-gta text-2xl text-white">FOREVER OUTLAWS</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Strap the duffel bags of cash in the trunk, speed straight to LSIA private hangar, and disappear into
                  the sunset to conquer Vice City.
                </p>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {chosenEnding === 'proposal' ? (
              <div className="p-6 rounded-2xl bg-rose-950/50 border border-rose-500/50 space-y-4">
                <Sparkles className="w-10 h-10 text-rose-400 mx-auto" />
                <h2 className="font-gta text-4xl text-rose-300">"YES, A THOUSAND TIMES YES!"</h2>
                <p className="text-zinc-200 text-sm leading-relaxed max-w-md mx-auto italic font-romance">
                  Tears well up in Mia's eyes as she leaps into Leo's arms, the city lights reflecting off the diamond ring.
                  The most feared duo in San Andreas now wears gold and vows to love each other through every chase.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-950/50 border border-amber-500/50 space-y-4">
                <Plane className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="font-gta text-4xl text-amber-300">NEXT STOP: VICE CITY</h2>
                <p className="text-zinc-200 text-sm leading-relaxed max-w-md mx-auto italic font-romance">
                  The twin turbos scream as the Dominator blasts onto the runway just as the private Learjet fires its engines.
                  Leo and Mia clink champagne glasses overlooking the clouds. Outlaws forever.
                </p>
              </div>
            )}

            {/* Final Stats */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-around text-xs font-mono">
              <div>
                <span className="text-zinc-400">Total Haul:</span>{' '}
                <strong className="text-emerald-400">${stats.cash.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-zinc-400">Bond Level:</span>{' '}
                <strong className="text-rose-400">100% Soulmates</strong>
              </div>
            </div>

            {/* End Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={onContinueFreeRoam}
                className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-gta text-xl rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                FREE ROAM LOS SANTOS
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onRestartStory}
                className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-gta text-xl rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-5 h-5 text-zinc-400" />
                REPLAY STORY
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
