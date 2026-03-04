"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { PointerEvent, useEffect } from "react";

interface LiquidOrbProps {
  colors: string[];
}

function hexToRgb(hex: string): [number, number, number] | null {
  const normalized = hex.replace("#", "");
  if (![3, 6].includes(normalized.length)) return null;
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b];
}

function softenColor(hex: string, mixWithWhiteRatio = 0.55) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb;
  const mix = mixWithWhiteRatio;
  const nr = Math.round(r * (1 - mix) + 255 * mix);
  const ng = Math.round(g * (1 - mix) + 255 * mix);
  const nb = Math.round(b * (1 - mix) + 255 * mix);
  return `rgba(${nr}, ${ng}, ${nb}, 0.9)`;
}

export function LiquidOrb({ colors }: LiquidOrbProps) {
  const level =
    colors.length === 0 ? "10%" : colors.length === 1 ? "40%" : "80%";

  const base = colors[0] ?? "#5b21ff";
  const secondary = colors[1] ?? colors[0] ?? "#22d3ee";

  const baseSoft = softenColor(base);
  const secondarySoft = softenColor(secondary);

  const gradient = `linear-gradient(135deg, ${baseSoft} 0%, ${secondarySoft} 35%, ${baseSoft} 70%, ${secondarySoft} 100%)`;

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  const rotate = useTransform(tiltX, (v) => v * 0.35);
  const translateY = useTransform(tiltY, (v) => v * 0.45);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceOrientationEvent" in window)) return;

    const handler = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0; // 좌우
      const beta = event.beta ?? 0; // 앞뒤
      const maxTilt = 18;
      const xNorm = Math.max(-maxTilt, Math.min(maxTilt, gamma)) / maxTilt;
      const yNorm = Math.max(-maxTilt, Math.min(maxTilt, beta)) / maxTilt;
      tiltX.set(xNorm * 10);
      tiltY.set(yNorm * 8);
    };

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [tiltX, tiltY]);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const strengthX = 16;
    const strengthY = 12;
    tiltX.set(x * strengthX);
    tiltY.set(y * strengthY);
  };

  const handlePointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      className="relative mx-auto flex h-[260px] w-[260px] items-center justify-center sm:h-[300px] sm:w-[300px]"
      style={{ rotate, y: translateY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* back glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_30%_0%,rgba(147,51,234,0.6),transparent_60%),radial-gradient(circle_at_70%_100%,rgba(56,189,248,0.55),transparent_60%)] blur-3xl opacity-70" />

      {/* outer ring */}
      <div className="relative h-full w-full rounded-full bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.35),transparent_55%),radial-gradient(circle_at_100%_100%,rgba(147,51,234,0.6),transparent_55%)] p-[2px] shadow-[0_0_40px_rgba(147,51,234,0.7)]">
        {/* inner orb */}
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-black/70 backdrop-blur-xl overflow-hidden">
          {/* liquid fill */}
          <motion.div
            className="liquid-orb-fill absolute inset-x-0 bottom-0 overflow-hidden"
            initial={{ height: "10%" }}
            animate={{ height: level }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 18,
              mass: 0.7,
            }}
          >
            <div
              className="liquid-orb-wave"
              style={{
                backgroundImage: gradient,
              }}
            />
            <div
              className="liquid-orb-wave liquid-orb-wave--delay"
              style={{
                backgroundImage: gradient,
                opacity: 0.7,
              }}
            />

            {/* bubbles */}
            <div className="liquid-orb-bubbles pointer-events-none">
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className="liquid-orb-bubble"
                  style={{
                    left: `${10 + i * 12}%`,
                    animationDelay: `${i * 0.6}s`,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* subtle inner glow */}
          <div className="pointer-events-none absolute inset-6 rounded-full bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_55%)] opacity-60" />
        </div>
      </div>
    </motion.div>
  );
}

