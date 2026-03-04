"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useAnimation } from "framer-motion";

/* ── Blend two hex colours 50/50 ─────────────────────────────────── */
function mixHex(hex1: string, hex2: string): string {
  const clean = (h: string) => h.replace("#", "").padEnd(6, "0");
  const parse = (h: string, o: number) => parseInt(h.slice(o, o + 2), 16);
  const a = clean(hex1);
  const b = clean(hex2);
  const r = Math.round((parse(a, 0) + parse(b, 0)) / 2);
  const g = Math.round((parse(a, 2) + parse(b, 2)) / 2);
  const bv = Math.round((parse(a, 4) + parse(b, 4)) / 2);
  return `#${[r, g, bv].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function AlchemyInner() {
  const router = useRouter();
  const search = useSearchParams();

  const c1 = search.get("c1") ?? "#FF6B9A";
  const c2 = search.get("c2") ?? "#7C3AED";
  const n1 = search.get("n1") ?? "감정 A";
  const n2 = search.get("n2") ?? "감정 B";
  const m1 = search.get("m1") ?? "Purple";
  const m2 = search.get("m2") ?? "Blue";

  const mixedColor = useMemo(() => mixHex(c1, c2), [c1, c2]);

  const blob1 = useAnimation();
  const blob2 = useAnimation();
  const flash = useAnimation();

  const [showFill, setShowFill] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);

  const MESSAGES = useMemo(
    () => [
      `${n1}과 ${n2}이 서로를 끌어당기고 있습니다...`,
      "두 감정이 하나의 빛으로 충돌합니다...",
      "곧 당신의 멘토가 도착합니다...",
    ],
    [n1, n2]
  );

  useEffect(() => {
    /* ── Phase 1: Rush (0 → 1000ms) ──────────────────────────────── */
    blob1.start({
      x: 0,
      y: [0, -28, 16, -8, 2, 0],
      opacity: 0.94,
      transition: { duration: 1.0, ease: [0.1, 0, 0.4, 1] },
    });
    blob2.start({
      x: 0,
      y: [0, 22, -18, 10, -4, 0],
      opacity: 0.94,
      transition: { duration: 1.0, ease: [0.1, 0, 0.4, 1] },
    });

    /* ── Phase 2: Collision (1000ms) ──────────────────────────────── */
    const tCollide = setTimeout(() => {
      setMsgIndex(1);
      blob1.start({ scale: 2.8, opacity: 0, transition: { duration: 0.32, ease: "easeIn" } });
      blob2.start({ scale: 2.8, opacity: 0, transition: { duration: 0.32, ease: "easeIn" } });
      flash.start({
        scale: [0, 7, 14],
        opacity: [1, 0.85, 0],
        transition: { duration: 0.52, ease: "easeOut" },
      });
    }, 1000);

    /* ── Phase 3: Mixed fill expands (1400ms) ─────────────────────── */
    const tFill = setTimeout(() => setShowFill(true), 1400);
    const tMsg2 = setTimeout(() => setMsgIndex(2), 2000);

    /* ── Navigate ─────────────────────────────────────────────────── */
    const tNav = setTimeout(() => {
      router.push(
        `/mentor?${new URLSearchParams({ c1, c2, n1, n2, m1, m2 }).toString()}`
      );
    }, 3200);

    return () => [tCollide, tFill, tMsg2, tNav].forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* Label */}
      <p className="font-display relative z-50 mb-6 text-[0.65rem] font-light uppercase tracking-[0.42em] text-purple-100/65 sm:text-[0.7rem]">
        Emotion Alchemy
      </p>

      {/* Collision arena */}
      <div className="relative z-10 flex h-72 w-full max-w-[320px] items-center justify-center sm:max-w-sm">

        {/* Emotion label left */}
        <motion.span
          className="absolute left-0 text-[0.65rem] tracking-[0.1em] text-white/50"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {n1}
        </motion.span>

        {/* Emotion label right */}
        <motion.span
          className="absolute right-0 text-[0.65rem] tracking-[0.1em] text-white/50"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 0.7, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {n2}
        </motion.span>

        {/* Blob 1 — c1 rushes from left */}
        <motion.div
          className="absolute rounded-full"
          initial={{ x: -290, opacity: 0, scale: 1 }}
          animate={blob1}
          style={{
            width: 160, height: 160,
            background: `radial-gradient(circle, ${c1} 5%, ${c1}bb 40%, transparent 72%)`,
            filter: "blur(22px)",
          }}
        />

        {/* Blob 2 — c2 rushes from right */}
        <motion.div
          className="absolute rounded-full"
          initial={{ x: 290, opacity: 0, scale: 1 }}
          animate={blob2}
          style={{
            width: 160, height: 160,
            background: `radial-gradient(circle, ${c2} 5%, ${c2}bb 40%, transparent 72%)`,
            filter: "blur(22px)",
          }}
        />

        {/* Collision flash */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          animate={flash}
          style={{
            width: 70, height: 70,
            background: `radial-gradient(circle, #fff 0%, ${c1} 28%, ${c2} 58%, transparent 82%)`,
          }}
        />

        {/* Mixed-colour orb — fills arena center, not the whole screen */}
        <AnimatePresence>
          {showFill && (
            <motion.div
              className="pointer-events-none absolute rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.85, ease: [0.34, 1.2, 0.64, 1] }}
              style={{
                width: 230, height: 230,
                background: `radial-gradient(circle, #fff 0%, ${mixedColor} 22%, ${mixedColor}cc 55%, ${mixedColor}44 80%, transparent 100%)`,
                filter: "blur(10px)",
                boxShadow: `0 0 60px ${mixedColor}99, 0 0 120px ${mixedColor}44`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Message */}
      <div className="relative z-50 mt-8 h-12 w-full max-w-sm text-center sm:max-w-md">
        <AnimatePresence mode="wait">
          <motion.p
            key={msgIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="px-4 text-sm text-white/85 drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)]"
          >
            {MESSAGES[msgIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </>
  );
}

export default function EmotionAlchemyPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#020108] text-white">
      {/* background — CSS nebula only */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 60% 15%, rgba(147,51,234,0.16) 0%, transparent 55%), radial-gradient(ellipse at 20% 85%, rgba(56,189,248,0.1) 0%, transparent 55%)",
        }}
      />

      <Suspense>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pb-8 pt-8 sm:px-10">
          <AlchemyInner />
        </div>
      </Suspense>
    </main>
  );
}
