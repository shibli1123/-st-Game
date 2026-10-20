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
  const [chosenEnding, setChosenEnding] = useState<'proposal' | 'airport' | null>(null);

  return (
    <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8 select-none animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-2xl w-full bg-zinc-950 border-2 border-rose-500/80 rounded-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(244,63,94,0.4)] text-center space-y-6 my-auto">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold uppercase tracking-widest">
          <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
          The Grand Finale · Lalbagh Fort Ramparts (লালবাগ কেল্লা)
        </div>

        <div>
          <h1 className="font-gta text-5xl md:text-6xl text-white tracking-wide">
            DHAKA IS OURS
          </h1>
          <p className="font-romance text-xl md:text-2xl text-rose-300 italic mt-1">
            "ঢাকা লাভ স্টোরি · A Romance Written Across the Skyline"
          </p>
        </div>

        {!chosenEnding ? (
          <div className="space-y-6">
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed max-w-lg mx-auto">
              Standing together on the ancient Mughal ramparts of Lalbagh Fort with millions in diamonds from Bangladesh
              Bank and the setting sun illuminating Dhaka in warm purple and amber, Mia turns to Leo. It is time to decide
              your destiny.
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
                  Leo pulls out the rare diamond from the Motijheel vault, drops to one knee beneath the Mughal domes, and
                  asks Mia to be his wife forever.
                </p>
              </button>

              {/* Option B: Private Jet from HSIA */}
              <button
                onClick={() => setChosenEnding('airport')}
                className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/50 to-orange-950/40 hover:from-amber-950/80 hover:to-orange-950/70 border-2 border-amber-500/40 hover:border-amber-400 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plane className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="font-gta text-2xl text-white">FOREVER OUTLAWS</h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  Strap the duffels of Taka and diamonds into the trunk, floor it down the Elevated Expressway to HSIA, and
                  disappear into the clouds together.
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
                  Tears well up in Mia's eyes as she leaps into Leo's arms, the lights of Dhaka and the Buriganga River
                  glistening below. The most notorious duo in Bangladesh now wears gold and vows to ride together through
                  every chase.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-950/50 border border-amber-500/50 space-y-4">
                <Plane className="w-10 h-10 text-amber-400 mx-auto" />
                <h2 className="font-gta text-4xl text-amber-300">NEXT STOP: TROPICAL PARADISE</h2>
                <p className="text-zinc-200 text-sm leading-relaxed max-w-md mx-auto italic font-romance">
                  The twin turbos roar down the expressway as the private Gulfstream accelerates into the sunset. Leo and
                  Mia clink glasses overlooking the Bengal delta from above the clouds. Outlaws forever.
                </p>
              </div>
            )}

            {/* Final Stats */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex justify-around text-xs font-mono">
              <div>
                <span className="text-zinc-400">Total Vault:</span>{' '}
                <strong className="text-emerald-400">৳ {stats.cash.toLocaleString()} BDT</strong>
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
                FREE ROAM DHAKA
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
