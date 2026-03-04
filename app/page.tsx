"use client";

import Image from "next/image";
import {
  motion,
  useTransform,
  useMotionTemplate,
  useScroll,
} from "framer-motion";
import { Asterisk, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ParticleConfig = {
  id: string;
  kind: "dot" | "sparkle" | "asterisk";
  xPct: number;
  yPct: number;
  sizePx: number;
  opacity: number;
  driftPx: number;
  rotateDeg: number;
};

function ParticleItem({
  p,
  progress,
}: {
  p: ParticleConfig;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const y = useTransform(progress, (v) => -v * p.driftPx);
  const r = useTransform(progress, (v) => v * p.rotateDeg);

  const baseStyle = {
    left: `${p.xPct}%`,
    top: `${p.yPct}%`,
    opacity: p.opacity,
  } as const;

  if (p.kind === "dot") {
    return (
      <motion.span
        className="absolute rounded-full bg-white"
        style={{
          ...baseStyle,
          width: p.sizePx,
          height: p.sizePx,
          y,
          rotate: r,
          boxShadow:
            "0 0 10px rgba(167, 139, 250, 0.35), 0 0 18px rgba(255, 255, 255, 0.16)",
        }}
      />
    );
  }

  const Icon = p.kind === "sparkle" ? Sparkles : Asterisk;
  return (
    <motion.span
      className="absolute text-white/70"
      style={{
        ...baseStyle,
        y,
        rotate: r,
        filter: "drop-shadow(0 0 10px rgba(167, 139, 250, 0.35))",
      }}
      aria-hidden="true"
    >
      <Icon size={p.sizePx * 6} strokeWidth={1.4} />
    </motion.span>
  );
}

function ParticleField({
  progress,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const [particles, setParticles] = useState<ParticleConfig[]>([]);

  useEffect(() => {
    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const count = 34;
    const icons = 7;

    const dots: ParticleConfig[] = Array.from({ length: count }, (_, i) => {
      const sizePx = Math.round(rand(1, 3));
      const opacity = Number(rand(0.12, 0.5).toFixed(2));
      return {
        id: `d-${i}-${Math.random().toString(16).slice(2)}`,
        kind: "dot",
        xPct: Number(rand(0, 100).toFixed(2)),
        yPct: Number(rand(0, 100).toFixed(2)),
        sizePx,
        opacity,
        driftPx: Math.round(rand(220, 1200)),
        rotateDeg: Number(rand(-60, 60).toFixed(2)),
      };
    });

    const iconBits: ParticleConfig[] = Array.from({ length: icons }, (_, i) => {
      const kind = Math.random() > 0.5 ? "sparkle" : "asterisk";
      const opacity = Number(rand(0.14, 0.38).toFixed(2));
      return {
        id: `i-${i}-${Math.random().toString(16).slice(2)}`,
        kind,
        xPct: Number(rand(5, 95).toFixed(2)),
        yPct: Number(rand(5, 95).toFixed(2)),
        sizePx: Math.round(rand(2, 4)),
        opacity,
        driftPx: Math.round(rand(180, 900)),
        rotateDeg: Number(rand(-120, 120).toFixed(2)),
      };
    });

    setParticles([...dots, ...iconBits]);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <ParticleItem key={p.id} p={p} progress={progress} />
      ))}
    </div>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();

  // 1. Base background (01.back_img.jpg)
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const bgBlur = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const bgDim = useTransform(scrollYProgress, [0, 1], [0.1, 0.5]);
  const bgFilter = useMotionTemplate`blur(${bgBlur}px) saturate(1.15)`;

  // 2. Mentor silhouette (02.mentor_shadow.png)
  const mentorOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.3, 0.5, 0.7],
    [0, 1, 1, 0]
  );
  const mentorScale = useTransform(scrollYProgress, [0.1, 0.7], [0.9, 1.1]);

  // 3. Portal light (03.portal_light.png)
  const portalOpacity = useTransform(
    scrollYProgress,
    [0.6, 0.85, 1],
    [0, 1, 1]
  );
  const portalScale = useTransform(scrollYProgress, [0.6, 1], [0.8, 1.5]);
  const portalBlur = useTransform(scrollYProgress, [0.6, 1], [10, 0]);
  const portalFilter = useMotionTemplate`blur(${portalBlur}px)`;

  // 4. Central logo (00.logo.jpg)
  const logoRotate = useTransform(scrollYProgress, [0, 1], [0, -720]);
  const logoOpacity = useTransform(scrollYProgress, [0.7, 0.9], [1, 0]);

  // CTA button appearance (tied to end of scroll)
  const ctaOpacity = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.85, 1], [20, 0]);

  return (
    <main className="relative h-[500vh] w-full bg-black text-white">
      {/* FIXED LAYER (all visuals, z-0) */}
      <div className="fixed inset-0 z-0 h-screen w-screen overflow-hidden">
        {/* 1. Base background */}
        <motion.div
          className="absolute inset-0"
          style={{ scale: bgScale, filter: bgFilter }}
          aria-hidden="true"
        >
          <Image
            src="/01.back_img.png"
            alt="Deep space nebula background"
            fill
            priority
            className="object-cover"
          />
          <motion.div
            className="absolute inset-0 bg-black"
            style={{ opacity: bgDim }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(147,51,234,0.42),transparent_58%),radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.28),transparent_64%)]" />
        </motion.div>

        {/* 2. Mentor silhouette */}
        <motion.div
          className="absolute inset-0 z-10"
          style={{ opacity: mentorOpacity, scale: mentorScale }}
          aria-hidden="true"
        >
          <Image
            src="/02.mentor_shadow.png"
            alt="Mentor silhouette"
            fill
            className="object-contain object-center"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />
        </motion.div>

        {/* 3. Portal light */}
        <motion.div
          className="absolute inset-0 z-20 mix-blend-screen"
          style={{ opacity: portalOpacity, scale: portalScale, filter: portalFilter }}
          aria-hidden="true"
        >
          <Image
            src="/03.portal_light.png"
            alt="Cosmic portal light"
            fill
            className="object-cover object-center"
            priority={false}
          />
        </motion.div>

        {/* 4. Central spinning logo */}
        <motion.div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ rotate: logoRotate, opacity: logoOpacity }}
        >
          <div className="relative h-48 w-48 overflow-hidden rounded-full shadow-[0_0_46px_rgba(147,51,234,0.8)] sm:h-56 sm:w-56">
            <Image
              src="/00.logo.png"
              alt="E.M.I.T Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
        </motion.div>

        {/* Stardust particles, tied to scroll */}
        <ParticleField progress={scrollYProgress} />
      </div>

      {/* SCROLL LAYER (all text & CTA, z-50) */}
      <div className="absolute inset-0 z-50">
        <div className="relative h-full w-full">
          {/* Section 1: 0-100vh */}
          <section className="flex min-h-screen items-center justify-center px-6 text-center">
            <div className="max-w-xl space-y-4">
              <p className="text-sm text-purple-100/80">
                지금 어떤 감정을 느끼고 계신가요?
              </p>
              <p className="text-base text-white/90">
                시간을 거슬러, 당신을 이해할 멘토를 만나보세요.
              </p>
            </div>
          </section>

          {/* Section 2: around 250vh */}
          <section className="flex min-h-screen items-center justify-center px-6 pt-[150vh] text-center">
            <div className="max-w-2xl space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-purple-200/80">
                E.M.I.T · Emotion Mentoring In Time
              </p>
              <p className="text-base text-white/85">
                때로는 시대를 초월한 지혜가 가장 날카로운 해답이 됩니다.
              </p>
            </div>
          </section>

          {/* Section 3: bottom (450-500vh) */}
          <section className="flex min-h-screen items-center justify-center px-6 pt-[340vh] pb-[40vh]">
            <motion.div
              className="w-full max-w-md rounded-3xl border border-white/15 bg-white/8 p-6 text-center shadow-[0_32px_80px_rgba(0,0,0,0.8)] backdrop-blur-md"
              style={{ opacity: ctaOpacity, y: ctaY }}
            >
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.3em] text-purple-100/80">
                Portal To Another Era
              </p>
              <p className="mb-6 text-sm text-white/85">
                당신의 멘토가 기다리고 있습니다.
              </p>
              <motion.button
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0 0 26px rgba(167, 139, 250, 0.9)",
                }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-full border border-purple-300/70 bg-gradient-to-r from-purple-500/80 via-purple-400/80 to-fuchsia-500/80 px-6 py-3 text-sm font-semibold tracking-[0.18em] text-white"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.25),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(167,139,250,0.3),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative z-10">여정 시작하기</span>
              </motion.button>
            </motion.div>
          </section>
        </div>
      </div>
    </main>
  );
}

