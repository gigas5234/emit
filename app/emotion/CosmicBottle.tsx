"use client";

import { motion } from "framer-motion";

interface CosmicBottleProps {
  colors: string[];
}

export function CosmicBottle({ colors }: CosmicBottleProps) {
  const hasColors = colors.length > 0;

  const base = colors[0] ?? "rgba(255,255,255,0.05)";
  const secondary = colors[1] ?? colors[0] ?? "rgba(120,120,150,0.3)";

  const gradient = hasColors
    ? `radial-gradient(circle at 20% 0%, ${base}aa, transparent 55%), radial-gradient(circle at 80% 100%, ${secondary}aa, transparent 55%)`
    : "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.12), transparent 55%)";

  return (
    <div className="relative mx-auto flex h-64 w-40 items-center justify-center sm:h-80 sm:w-52">
      {/* Colored fill masked by bottle shape */}
      <motion.div
        className="absolute inset-4 rounded-[40%] bg-gradient-to-b from-transparent to-transparent"
        style={{
          backgroundImage: gradient,
          WebkitMaskImage: 'url("/04.bottle.png")',
          maskImage: 'url("/04.bottle.png")',
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
        animate={{
          backgroundPosition: ["0% 0%", "0% 20%", "0% 0%"],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Bottle outline */}
      <img
        src="/04.bottle.png"
        alt="Cosmic bottle"
        className="pointer-events-none relative z-10 h-full w-auto object-contain"
      />
    </div>
  );
}

