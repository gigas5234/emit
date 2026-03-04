"use client";

import Image from "next/image";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useEffect, useState, MouseEvent } from "react";

const mainPhrases = [
  "지금 어떤 감정을 느끼고 계신가요?",
  "시간을 거슬러, 당신을 이해할 멘토를 만나보세요.",
];

const teaserPhrases = [
  "소크라테스가 누군가의 깊은 우울에 답하고 있습니다...",
  "스티브 잡스가 새로운 영감을 불어넣고 있습니다...",
];

export default function Home() {
  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);

  const bgX = useTransform(mvX, (v) => v * -0.35);
  const bgY = useTransform(mvY, (v) => v * -0.35);
  const logoX = useTransform(mvX, (v) => v * 0.8);
  const logoY = useTransform(mvY, (v) => v * 0.8);

  const [mainIndex, setMainIndex] = useState(0);
  const [teaserIndex, setTeaserIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMainIndex((prev) => (prev + 1) % mainPhrases.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTeaserIndex((prev) => (prev + 1) % teaserPhrases.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceOrientationEvent" in window)) return;

    const handler = (event: DeviceOrientationEvent) => {
      const gamma = event.gamma ?? 0;
      const beta = event.beta ?? 0;
      const maxTilt = 15;

      const xNorm = Math.max(-maxTilt, Math.min(maxTilt, gamma)) / maxTilt;
      const yNorm = Math.max(-maxTilt, Math.min(maxTilt, beta)) / maxTilt;

      mvX.set(xNorm * 15);
      mvY.set(yNorm * 15);
    };

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [mvX, mvY]);

  const handlePointerMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const strength = 22;
    mvX.set(x * strength);
    mvY.set(y * strength);
  };

  const handlePointerLeave = () => {
    mvX.set(0);
    mvY.set(0);
  };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-black text-white"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ x: bgX, y: bgY }}
      >
        <Image
          src="/01.back_img.png"
          alt="Cosmic background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,black_80%)] mix-blend-multiply" />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(147,51,234,0.45),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.35),transparent_60%)]" />

      <section className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-6">
        <div className="h-10 sm:h-12" />

        <div className="flex flex-1 flex-col items-center justify-center space-y-6 text-center">
          <motion.div
            className="relative"
            style={{ x: logoX, y: logoY }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 1.2, ease: "easeOut" },
            }}
          >
            <div className="relative h-40 w-40 rounded-full bg-gradient-to-b from-white/40 to-white/5 p-[2px] shadow-[0_0_40px_rgba(147,51,234,0.75)] sm:h-52 sm:w-52">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-black/60">
                <Image
                  src="/00.logo.png"
                  alt="E.M.I.T Logo"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </motion.div>

          <div className="relative h-16 overflow-hidden sm:h-20">
            <AnimatePresence mode="wait">
              <motion.p
                key={mainIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="px-6 text-sm leading-relaxed text-white/90 drop-shadow-[0_0_12px_rgba(0,0,0,0.9)] sm:text-base"
              >
                {mainPhrases[mainIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="mb-16 flex w-full items-center justify-center sm:mb-20">
          <motion.div
            className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_32px_80px_rgba(0,0,0,0.8)] backdrop-blur-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.9, ease: "easeOut" }}
          >
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.3em] text-purple-200/70">
              E.M.I.T · Emotion Mentoring In Time
            </div>
            <p className="mb-6 text-sm text-white/80">
              당신의 과거, 현재, 미래의 감정을 함께 탐색할 AI 멘토와의 여정을
              지금 시작해 보세요.
            </p>

            <motion.button
              whileHover={{
                scale: 1.04,
                boxShadow: "0 0 24px rgba(167, 139, 250, 0.8)",
              }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-purple-300/60 bg-gradient-to-r from-purple-500/70 via-purple-400/80 to-fuchsia-500/80 px-6 py-3 text-sm font-semibold tracking-[0.18em] text-white shadow-[0_16px_40px_rgba(0,0,0,0.9)]"
              onClick={() => {
                // TODO: use router.push("/login") when login page is ready
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10">여정 시작하기</span>
            </motion.button>
          </motion.div>
        </div>

        <div className="pointer-events-none relative mb-1 flex h-10 w-full items-end justify-center text-xs text-white/60">
          <div className="relative h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={teaserIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.6, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="px-6 text-center text-[0.65rem] sm:text-[0.7rem]"
              >
                {teaserPhrases[teaserIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </main>
  );
}

