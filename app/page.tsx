"use client";

import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState, PointerEvent } from "react";

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

  const logoX = useTransform(mvX, (v) => v * 0.9);
  const logoY = useTransform(mvY, (v) => v * 0.6);

  const bgX = useTransform(mvX, (v) => v * -0.2);
  const bgY = useTransform(mvY, (v) => v * -0.2);

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

      mvX.set(xNorm * 18);
      mvY.set(yNorm * 12);
    };

    window.addEventListener("deviceorientation", handler);
    return () => window.removeEventListener("deviceorientation", handler);
  }, [mvX, mvY]);

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const strengthX = 24;
    const strengthY = 18;
    mvX.set(x * strengthX);
    mvY.set(y * strengthY);
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
      {/* Cosmic background */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ x: bgX, y: bgY }}
        aria-hidden="true"
      >
        <Image
          src="/01.back_img.png"
          alt="E.M.I.T cosmic background"
          fill
          priority
          className="object-cover"
        />
        {/* 멘토 실루엣: 살짝 아래쪽에 배치 */}
        <div className="absolute inset-0">
          <Image
            src="/02.mentor_shadow.png"
            alt="Mentor silhouette"
            fill
            className="object-contain object-bottom mix-blend-screen opacity-50"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(147,51,234,0.45),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.3),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,black_80%)] mix-blend-multiply" />
      </motion.div>

      {/* Foreground content (no scroll layout) */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-between px-4 py-4 sm:py-8">
        {/* 상단 로고 (중앙보다 위, 약간 더 크게) */}
        <div className="flex w-full justify-center pt-4 sm:pt-6">
          <motion.div
            className="relative"
            style={{ x: logoX, y: logoY }}
          >
            <div className="relative h-36 w-36 overflow-hidden rounded-full shadow-[0_18px_40px_rgba(0,0,0,0.85)] sm:h-48 sm:w-48">
              <Image
                src="/00.logo.png"
                alt="E.M.I.T Logo"
                fill
                priority
                className="object-cover"
              />
            </div>
          </motion.div>
        </div>

        {/* 중앙 메인 카피 + 진입 박스 */}
        <div className="flex flex-1 flex-col items-center justify-center space-y-5 sm:space-y-8">
          <div className="relative h-20 w-full max-w-xl text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={mainIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="px-4 text-sm leading-relaxed text-white/90 drop-shadow-[0_0_14px_rgba(0,0,0,0.9)] sm:text-base"
              >
                {mainPhrases[mainIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* 진입용 글래스 박스 */}
          <div className="w-full max-w-xl rounded-3xl border border-white/15 bg-white/5 p-5 shadow-[0_24px_50px_rgba(0,0,0,0.85)] backdrop-blur-md sm:p-7">
            <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-purple-100/85 sm:text-xs">
              E.M.I.T · EMOTION MENTORING IN TIME
            </p>
            <p className="mb-6 text-[0.8rem] leading-relaxed text-white/85 sm:text-sm">
              당신의 과거, 현재, 미래의 감정을 함께 탐색할 AI 멘토와의 여정을 지금
              시작해 보세요.
            </p>
            <motion.button
              whileHover={{
                scale: 1.03,
                boxShadow: "0 0 24px rgba(167, 139, 250, 0.85)",
              }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-purple-300/70 bg-gradient-to-r from-purple-500/90 via-purple-400/90 to-fuchsia-500/90 px-6 py-3 text-[0.8rem] font-semibold tracking-[0.2em] text-white sm:text-sm"
            >
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(167,139,250,0.35),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10">여정 시작하기</span>
            </motion.button>
          </div>
        </div>

        {/* 하단 티저 텍스트 (위인 멘트) */}
        <div className="mb-2 flex h-8 w-full items-end justify-center text-xs text-white/70 sm:mb-4 sm:h-10">
          <div className="relative h-7 overflow-hidden sm:h-8">
            <AnimatePresence mode="wait">
              <motion.p
                key={teaserIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="px-6 text-center text-[0.7rem]"
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

