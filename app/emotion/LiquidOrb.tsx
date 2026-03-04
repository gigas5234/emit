"use client";

import { motion } from "framer-motion";

interface LiquidOrbProps {
  colors: string[];
}

export function LiquidOrb({ colors }: LiquidOrbProps) {
  const level =
    colors.length === 0 ? "10%" : colors.length === 1 ? "40%" : "80%";

  const base = colors[0] ?? "#5b21ff";
  const secondary = colors[1] ?? colors[0] ?? "#22d3ee";

  const gradient = `linear-gradient(135deg, ${base} 0%, ${secondary} 45%, ${base} 80%, ${secondary} 100%)`;

  return (
    <div className="relative mx-auto flex h-[260px] w-[260px] items-center justify-center sm:h-[300px] sm:w-[300px]">
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
            transition={{ duration: 0.9, ease: "easeOut" }}
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
    </div>
  );
}

