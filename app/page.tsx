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

function useFadeInOut(
  progress: ReturnType<typeof useScroll>["scrollYProgress"],
  start: number,
  mid: number,
  end: number
) {
  return useTransform(progress, [start, mid, end], [0, 1, 0]);
}

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.28]);
  const bgBlur = useTransform(scrollYProgress, [0, 1], [0, 10]);
  const bgDim = useTransform(scrollYProgress, [0, 1], [0.15, 0.55]);
  const bgFilter = useMotionTemplate`blur(${bgBlur}px) saturate(1.15)`;

  const logoRotate = useTransform(scrollYProgress, [0, 1], [0, -720]);
  const logoScale = useTransform(scrollYProgress, [0, 0.25, 1], [1, 0.98, 0.92]);

  const hook1Opacity = useFadeInOut(scrollYProgress, 0.05, 0.12, 0.2);
  const hook2Opacity = useFadeInOut(scrollYProgress, 0.18, 0.28, 0.4);

  const mentorOpacity = useFadeInOut(scrollYProgress, 0.38, 0.52, 0.68);
  const mentorScale = useTransform(scrollYProgress, [0.38, 0.52, 0.68], [1.05, 1, 0.98]);

  const mentorTextOpacity = useFadeInOut(scrollYProgress, 0.42, 0.56, 0.7);

  const portalOpacity = useTransform(scrollYProgress, [0.78, 0.92, 1], [0, 0.9, 1]);
  const portalScale = useTransform(scrollYProgress, [0.78, 1], [0.9, 1.3]);
  const portalBlur = useTransform(scrollYProgress, [0.78, 1], [8, 0]);
  const portalFilter = useMotionTemplate`blur(${portalBlur}px)`;

  const ctaOpacity = useTransform(scrollYProgress, [0.84, 0.92], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.84, 0.92], [18, 0]);

  return (
    <main className="relative w-full bg-black text-white">
      <div ref={containerRef} className="relative h-[520vh] overflow-hidden">
        <div className="sticky top-0 h-screen w-full">
          {/* Base background: parallax diving */}
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
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_25%,rgba(147,51,234,0.38),transparent_56%),radial-gradient(circle_at_20%_80%,rgba(96,165,250,0.24),transparent_62%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,black_82%)] mix-blend-multiply" />
          </motion.div>

          {/* Particles depth layer */}
          <ParticleField progress={scrollYProgress} />

          {/* Mentor silhouette emerges (mid-scroll) */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ opacity: mentorOpacity }}
            aria-hidden="true"
          >
            <motion.div
              className="absolute inset-0"
              style={{ scale: mentorScale }}
            >
              <Image
                src="/02.mentor_shadow.png"
                alt="Mentor silhouette"
                fill
                className="object-cover object-center"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/55" />
            </motion.div>
          </motion.div>

          {/* Portal climax (final) */}
          <motion.div
            className="pointer-events-none absolute inset-0"
            style={{ opacity: portalOpacity }}
            aria-hidden="true"
          >
            <motion.div
              className="absolute inset-0"
              style={{
                scale: portalScale,
                filter: portalFilter,
              }}
            >
              <Image
                src="/03.portal_light.png"
                alt="Cosmic portal light"
                fill
                className="object-cover object-center mix-blend-screen"
                priority={false}
              />
              <div className="absolute inset-0 bg-black/25" />
            </motion.div>
          </motion.div>

          {/* Foreground UI (sticky logo + scroll-driven text) */}
          <div className="relative z-10 flex h-full w-full items-center justify-center px-4">
            <div className="flex w-full max-w-3xl flex-col items-center text-center">
              {/* Sticky logo with scroll-driven rotation */}
              <motion.div
                className="relative"
                style={{ rotate: logoRotate, scale: logoScale }}
              >
                <div className="relative h-40 w-40 overflow-hidden rounded-full shadow-[0_0_46px_rgba(147,51,234,0.72)] sm:h-56 sm:w-56">
                  <Image
                    src="/00.logo.png"
                    alt="E.M.I.T Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </motion.div>

              {/* Storytelling hooks (scroll-fade) */}
              <div className="relative mt-6 h-14 w-full sm:mt-8 sm:h-16">
                <motion.p
                  className="absolute inset-x-0 top-0 px-6 text-sm leading-relaxed text-white/90 drop-shadow-[0_0_14px_rgba(0,0,0,0.95)] sm:text-base"
                  style={{ opacity: hook1Opacity }}
                >
                  지금 어떤 감정을 느끼고 계신가요?
                </motion.p>
                <motion.p
                  className="absolute inset-x-0 top-0 px-6 text-sm leading-relaxed text-white/90 drop-shadow-[0_0_14px_rgba(0,0,0,0.95)] sm:text-base"
                  style={{ opacity: hook2Opacity }}
                >
                  시간을 거슬러, 당신을 이해할 멘토를 만나보세요.
                </motion.p>
              </div>

              {/* Mid-scroll mentor text */}
              <motion.div className="mt-10" style={{ opacity: mentorTextOpacity }}>
                <p className="text-xs font-medium uppercase tracking-[0.32em] text-purple-200/75">
                  E.M.I.T · Emotion Mentoring In Time
                </p>
                <p className="mt-3 text-sm text-white/80">
                  때로는 시대를 초월한 지혜가...
                </p>
              </motion.div>

              {/* CTA glass button at the portal center */}
              <motion.div
                className="mt-12"
                style={{ opacity: ctaOpacity, y: ctaY }}
              >
                <motion.button
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 0 26px rgba(167, 139, 250, 0.85)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-9 py-4 text-sm font-semibold tracking-[0.2em] text-white backdrop-blur-md"
                >
                  <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.22),transparent_55%),radial-gradient(circle_at_70%_60%,rgba(167,139,250,0.22),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative z-10">여정 시작하기</span>
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* subtle bottom fade */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
        </div>

        {/* Scroll spacer content (invisible; drives scroll progress) */}
        <div className="absolute left-0 top-0 h-full w-full" aria-hidden="true" />
      </div>
    </main>
  );
}

