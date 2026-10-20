import React from 'react';
import { Heart, DollarSign, Award, ArrowRight } from 'lucide-react';
import { Mission, PlayerStats } from '../types/game';

interface MissionPassedModalProps {
  mission: Mission;
  stats: PlayerStats;
  onContinue: () => void;
}

export const MissionPassedModal: React.FC<MissionPassedModalProps> = ({
  mission,
  stats,
  onContinue,
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-4 select-none animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-zinc-950 border-2 border-amber-500/80 rounded-2xl p-6 md:p-8 shadow-[0_0_80px_rgba(245,158,11,0.3)] text-center space-y-6">
        {/* Banner Header */}
        <div>
          <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
            Mission 0{mission.number} Complete
          </div>
          <h1 className="font-gta text-5xl md:text-6xl text-amber-400 tracking-wider drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]">
            MISSION PASSED
          </h1>
          <p className="font-gta text-2xl text-white tracking-wide">{mission.title}</p>
          <p className="font-romance text-sm text-rose-300 italic">"Ride or Die in Los Santos"</p>
        </div>

        {/* Rewards Breakdown */}
        <div className="grid grid-cols-2 gap-3 py-2">
          {/* Cash Reward */}
          <div className="bg-zinc-900/90 p-4 rounded-xl border border-emerald-500/40">
            <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 uppercase tracking-wider mb-1 font-bold">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Cash Earned
            </div>
            <div className="font-gta text-3xl text-emerald-400 tabular-nums">
              +${mission.rewardCash.toLocaleString()}
            </div>
          </div>

          {/* Love / Romance Boost */}
          <div className="bg-zinc-900/90 p-4 rounded-xl border border-rose-500/40">
            <div className="flex items-center justify-center gap-1 text-xs text-zinc-400 uppercase tracking-wider mb-1 font-bold">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              Bond Boost
            </div>
            <div className="font-gta text-3xl text-rose-400 tabular-nums">
              +{mission.rewardLove}%
            </div>
          </div>
        </div>

        {/* Current Total Stats */}
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs flex justify-between text-zinc-300 font-mono">
          <span>Total Vault: ${stats.cash.toLocaleString()}</span>
          <span>Status: {stats.loveTitle}</span>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-4 bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 hover:from-amber-400 hover:to-rose-400 text-white font-gta text-2xl tracking-wider rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
        >
          CONTINUE STORY
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
