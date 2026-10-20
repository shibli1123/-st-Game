import React, { useRef, useEffect } from 'react';
import { Heart, Shield, Zap, Star } from 'lucide-react';
import { PlayerStats } from '../types/game';

interface GameHUDProps {
  stats: PlayerStats;
  minimapData: {
    playerPos: { x: number; z: number; heading: number };
    miaPos?: { x: number; z: number };
    policePositions: { x: number; z: number; heading: number }[];
    targetPos?: { x: number; z: number; radius: number };
  } | null;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  stats,
  minimapData,
}) => {
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render Minimap Radar on 2D Canvas (100% Graphical - Zero Text)
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas || !minimapData) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radarRadius = 78;
    const scale = 0.55;

    ctx.clearRect(0, 0, w, h);

    // Circular Clip
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
    ctx.clip();

    // Dark glass radar background
    ctx.fillStyle = '#080a10';
    ctx.fillRect(0, 0, w, h);

    // Rotating road grid relative to player heading
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(minimapData.playerPos.heading);

    ctx.strokeStyle = '#1e2638';
    ctx.lineWidth = 11;
    [-140, -70, 0, 70, 140].forEach((z) => {
      const screenZ = (z - minimapData.playerPos.z) * scale;
      ctx.beginPath();
      ctx.moveTo(-200, screenZ);
      ctx.lineTo(200, screenZ);
      ctx.stroke();
    });

    [-140, -70, 0, 70, 140].forEach((x) => {
      const screenX = (x - minimapData.playerPos.x) * scale;
      ctx.beginPath();
      ctx.moveTo(screenX, -200);
      ctx.lineTo(screenX, 200);
      ctx.stroke();
    });

    // Destination Waypoint (Golden Pulsing Diamond)
    if (minimapData.targetPos) {
      const tx = (minimapData.targetPos.x - minimapData.playerPos.x) * scale;
      const tz = (minimapData.targetPos.z - minimapData.playerPos.z) * scale;

      ctx.fillStyle = '#fbbf24';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(tx, tz - 8);
      ctx.lineTo(tx + 8, tz);
      ctx.lineTo(tx, tz + 8);
      ctx.lineTo(tx - 8, tz);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Police Blips (Flashing Red / Blue)
    const isRedFlash = Math.floor(Date.now() / 180) % 2 === 0;
    minimapData.policePositions.forEach((cop) => {
      const px = (cop.x - minimapData.playerPos.x) * scale;
      const pz = (cop.z - minimapData.playerPos.z) * scale;

      ctx.fillStyle = isRedFlash ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, pz, 5.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Mia Blip (Glowing Pink Heart Icon)
    if (minimapData.miaPos) {
      const mx = (minimapData.miaPos.x - minimapData.playerPos.x) * scale;
      const mz = (minimapData.miaPos.z - minimapData.playerPos.z) * scale;

      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(mx, mz, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Radar Center: Player Pointer (Cyan Arrow)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9);
    ctx.lineTo(cx + 6, cy + 6);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx - 6, cy + 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    // Radar Glass Outer Ring
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, radarRadius, 0, Math.PI * 2);
    ctx.stroke();
  }, [minimapData]);

  // Speedometer Needle Angle calculation (from -135deg to +135deg)
  const speedRatio = Math.min(stats.vehicleSpeed / 200, 1.0);
  const needleAngle = -135 + speedRatio * 270;

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 flex flex-col justify-between overflow-hidden">
      {/* 1. Cinematic 21:9 Letterbox Bars (Top and Bottom) */}
      <div className="w-full h-8 md:h-12 bg-black/95 border-b border-white/5 shadow-2xl flex items-center justify-between px-6 md:px-10 z-20">
        {/* Top-Left: Pure Graphical Romance Heart Fill */}
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          <div className="w-28 md:w-36 h-2 bg-zinc-900 rounded-full overflow-hidden border border-rose-950">
            <div
              className="h-full bg-gradient-to-r from-rose-600 via-pink-500 to-amber-400 transition-all duration-300"
              style={{ width: `${stats.loveMeter}%` }}
            />
          </div>
        </div>

        {/* Top-Right: 5 Golden Wanted Stars (Pure Graphical) */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((starIdx) => {
            const isEarned = starIdx <= stats.wantedLevel;
            const isFlashing = isEarned && stats.wantedFlashing;
            return (
              <Star
                key={starIdx}
                className={`w-5 h-5 transition-all ${
                  isEarned
                    ? isFlashing
                      ? 'text-zinc-500 fill-zinc-500 animate-pulse'
                      : 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                    : 'text-zinc-800 fill-zinc-950'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Center Cinematic Viewport: 100% Free of Text */}
      <div className="flex-1 relative" />

      {/* Bottom Cinematic Letterbox & Diegetic Instrument Clusters */}
      <div className="w-full h-auto min-h-[52px] bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-6 flex items-end justify-between z-20">
        {/* BOTTOM-LEFT: Radar Minimap + Curved Health/Armor/Focus Arcs */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">
            <canvas
              ref={radarCanvasRef}
              width={160}
              height={160}
              className="w-full h-full drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
            />
          </div>

          {/* Graphical Status Gauges (Zero Text) */}
          <div className="w-40 mt-1.5 flex flex-col gap-1.5 bg-zinc-950/90 p-2 rounded-lg border border-zinc-800 shadow-xl">
            {/* Health (Emerald Arc) */}
            <div className="flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/40" />
              <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                />
              </div>
            </div>

            {/* Armor (Electric Cyan Arc) */}
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-sky-400 fill-sky-400/40" />
              <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-200"
                  style={{ width: `${(stats.armor / stats.maxArmor) * 100}%` }}
                />
              </div>
            </div>

            {/* Special Focus (Amber Arc) */}
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/40" />
              <div className="flex-1 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${stats.specialAbility}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM-RIGHT: Diegetic Automotive Tachometer Gauge (Zero Text) */}
        {stats.isInVehicle && (
          <div className="relative w-36 h-36 md:w-44 md:h-44 flex items-center justify-center">
            {/* Circular Gauge Background SVG */}
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-2xl">
              {/* Outer Dial Track */}
              <circle
                cx="80"
                cy="80"
                r="64"
                fill="#080a10"
                stroke="#1e293b"
                strokeWidth="4"
              />

              {/* Speedometer Arc Ticks */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="#334155"
                strokeWidth="3"
                strokeDasharray="4 8"
              />

              {/* Speed Fill Arc (Glowing Amber / Red) */}
              <circle
                cx="80"
                cy="80"
                r="56"
                fill="none"
                stroke="url(#speedGrad)"
                strokeWidth="5"
                strokeDasharray={`${speedRatio * 260} 400`}
                strokeLinecap="round"
                transform="rotate(135 80 80)"
              />

              {/* Nitro Inner Arc (Glowing Cyan) */}
              <circle
                cx="80"
                cy="80"
                r="44"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="4"
                strokeDasharray={`${(stats.nitro / 100) * 180} 400`}
                strokeLinecap="round"
                transform="rotate(135 80 80)"
              />

              {/* Center Hub */}
              <circle cx="80" cy="80" r="10" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2" />

              {/* Glowing Red Analog Needle */}
              <line
                x1="80"
                y1="80"
                x2="80"
                y2="30"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${needleAngle} 80 80)`}
                style={{ transition: 'transform 80ms ease-out' }}
              />

              <defs>
                <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
