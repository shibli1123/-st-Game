import React from 'react';
import { RotateCcw } from 'lucide-react';

interface WastedModalProps {
  reason: string;
  onRespawn: () => void;
}

export const WastedModal: React.FC<WastedModalProps> = ({ reason, onRespawn }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-grayscale flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-700">
      <div className="text-center space-y-6">
        <h1 className="font-gta text-7xl md:text-9xl text-red-600 tracking-widest drop-shadow-[0_8px_32px_rgba(220,38,38,0.8)] animate-pulse">
          WASTED
        </h1>
        <p className="font-sans text-sm md:text-base uppercase tracking-widest text-zinc-400 font-bold">
          {reason}
        </p>
        <p className="font-romance text-rose-300 italic text-base">
          "Don't leave me behind, Leo..." — Mia
        </p>

        <div className="pt-6">
          <button
            onClick={onRespawn}
            className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 border-2 border-red-600/80 hover:border-red-500 text-white font-gta text-2xl tracking-wider rounded-xl transition-all hover:scale-105 flex items-center gap-3 mx-auto cursor-pointer shadow-2xl"
          >
            <RotateCcw className="w-5 h-5 text-red-500" />
            TRY AGAIN (SAFEHOUSE CHECKPOINT)
          </button>
        </div>
      </div>
    </div>
  );
};
