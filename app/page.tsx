"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  PointerEvent,
} from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  animate,
} from "framer-motion";
import { useRouter } from "next/navigation";

/* ─── Emotion orb blob config ─────────────────────────────────────── */
const ORB_BLOBS = [
  { color: "#FF2200", w: 60, h: 54, dur: 9.2,  dx: 24,  dy: 14,  delay: 0   },
  { color: "#2255FF", w: 52, h: 62, dur: 11.5, dx: -20, dy: 22,  delay: 0.8 },
  { color: "#FFE000", w: 46, h: 46, dur: 7.8,  dx: 18,  dy: -24, delay: 1.6 },
  { color: "#9900CC", w: 57, h: 50, dur: 13.1, dx: -26, dy: -14, delay: 2.2 },
  { color: "#22CC66", w: 44, h: 52, dur: 10.4, dx: 22,  dy: 20,  delay: 3.1 },
  { color: "#FF7700", w: 50, h: 44, dur: 8.6,  dx: -16, dy: 26,  delay: 1.2 },
  { color: "#0044CC", w: 48, h: 58, dur: 12.3, dx: 28,  dy: -10, delay: 2.8 },
  { color: "#CC44BB", w: 54, h: 48, dur: 9.9,  dx: -22, dy: -22, delay: 0.4 },
];

/* ─── Orbital letter config ───────────────────────────────────────── */
const ORBIT_CFG = [
  { char: "E", rx: 162, ry: 55, period: 8600,  phase: 0.1,           tilt: -0.18, condenseDelay: 0    },
  { char: "M", rx: 130, ry: 76, period: 11400, phase: Math.PI * 0.55, tilt: 0.22,  condenseDelay: 0.09 },
  { char: "I", rx: 178, ry: 46, period: 7100,  phase: Math.PI * 1.05, tilt: -0.12, condenseDelay: 0.18 },
  { char: "T", rx: 148, ry: 72, period: 13200, phase: Math.PI * 1.62, tilt: 0.26,  condenseDelay: 0.27 },
];

/* ─── Starfield ───────────────────────────────────────────────────── */
function useStars(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4,
        base: Math.random() * 0.5 + 0.1,
        dur: Math.random() * 3.5 + 2,
        delay: Math.random() * 6,
      })),
    [count]
  );
}

/* ─── Orbiting letter ─────────────────────────────────────────────── */
function OrbitalLetter({
  char, rx, ry, period, phase, tilt, condensed, condenseDelay,
}: (typeof ORBIT_CFG)[0] & { condensed: boolean }) {
  const xMV      = useMotionValue(rx * Math.cos(phase));
  const yMV      = useMotionValue(ry * Math.sin(phase));
  const scaleMV  = useMotionValue(1);
  const opacityMV = useMotionValue(0.9);

  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (condensed) {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      animate(xMV,       0, { duration: 0.34, ease: [0.65, 0, 1, 1], delay: condenseDelay });
      animate(yMV,       0, { duration: 0.34, ease: [0.65, 0, 1, 1], delay: condenseDelay });
      animate(scaleMV,   0, { duration: 0.28, ease: "easeIn",         delay: condenseDelay });
      animate(opacityMV, 0, { duration: 0.22,                         delay: condenseDelay });
      return;
    }
    animate(scaleMV,   1,    { duration: 0.45 });
    animate(opacityMV, 0.9,  { duration: 0.4  });

    const loop = (time: number) => {
      if (startRef.current === null) startRef.current = time;
      const a  = phase + ((time - startRef.current) / period) * Math.PI * 2;
      const xb = rx * Math.cos(a);
      const yb = ry * Math.sin(a);
      xMV.set(xb * Math.cos(tilt) - yb * Math.sin(tilt));
      yMV.set(xb * Math.sin(tilt) + yb * Math.cos(tilt));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condensed]);

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 select-none"
      style={{
        x: xMV, y: yMV, scale: scaleMV, opacity: opacityMV,
        translateX: "-50%", translateY: "-50%",
        fontFamily: "'Cormorant Garamond','Garamond','Georgia',serif",
        fontSize:   "clamp(22px, 4vw, 30px)",
        fontWeight: 200,
        letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.94)",
        textShadow: "0 0 20px rgba(220,190,255,0.95), 0 0 40px rgba(160,120,255,0.5)",
      }}
    >
      {char}
    </motion.div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────── */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ─── Main page ───────────────────────────────────────────────────── */
export default function Home() {
  const router   = useRouter();
  const stars    = useStars(85);
  const [condensed,  setCondensed]  = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [orbBurst,   setOrbBurst]   = useState(false);

  /* touch-device detection — hover disabled on mobile */
  const isTouchRef = useRef(false);
  useEffect(() => {
    isTouchRef.current = window.matchMedia("(hover: none)").matches;
  }, []);

  /* parallax */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX    = useTransform(mouseX, (v) => v * -0.05);
  const bgY    = useTransform(mouseY, (v) => v * -0.05);
  const copyX  = useTransform(mouseX, (v) => v * -0.032);
  const copyY  = useTransform(mouseY, (v) => v * -0.028);

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - r.left - r.width  / 2);
    mouseY.set(e.clientY - r.top  - r.height / 2);
  };
  const handlePointerLeave = () => {
    animate(mouseX, 0, { duration: 1.4, ease: "easeOut" });
    animate(mouseY, 0, { duration: 1.4, ease: "easeOut" });
  };

  /* ── The Singularity sequence ── */
  const handleBegin = async () => {
    if (isStarting) return;

    /* haptic (mobile) */
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 15, 80]);
    }

    setCondensed(true);
    setIsStarting(true);

    await sleep(640);        // E→M→I→T sequential condensation complete (last at 0.27s + 0.34s ≈ 620ms)
    setOrbBurst(true);       // orb shrinks + supernova

    await sleep(460);        // supernova peak
    router.push("/emotion");
  };

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-[#020108] text-white"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {/* ── Starfield ── */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((s) => (
          <motion.div
            key={s.id}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ opacity: [s.base, s.base * 0.12, s.base] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── Background nebula (parallax) ── */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ x: bgX, y: bgY }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_18%,rgba(88,20,235,0.18),transparent_52%),radial-gradient(ellipse_at_18%_72%,rgba(6,182,212,0.1),transparent_58%),radial-gradient(ellipse_at_48%_88%,rgba(124,58,237,0.12),transparent_48%)]" />
      </motion.div>

      {/* ── SVG goo filter ── */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
          </filter>
        </defs>
      </svg>

      {/* ── Top-left logo header ── */}
      <header className="absolute left-0 top-0 z-20 flex items-center gap-2 px-5 py-4 sm:px-8 sm:py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-7 w-7 overflow-hidden rounded-full shadow-[0_0_14px_rgba(147,51,234,0.65)] sm:h-8 sm:w-8">
            <Image src="/00.logo.png" alt="E.M.I.T logo" fill className="object-cover" />
          </div>
          <span
            className="text-xs tracking-[0.28em] text-white/75"
            style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
          >
            E.M.I.T
          </span>
        </Link>
      </header>

      {/* ── Main content ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">

        {/* Title — parallax, more visible */}
        <motion.div className="mb-2 text-center" style={{ x: copyX, y: copyY }}>
          <p
            className="text-[0.7rem] tracking-[0.48em] text-white/60 sm:text-[0.78rem]"
            style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
          >
            Emotion · Moment · In · Time
          </p>
        </motion.div>
        <motion.div className="mb-10 text-center" style={{ x: copyX, y: copyY }}>
          <p
            className="text-[0.58rem] tracking-[0.36em] text-white/38 sm:text-[0.64rem]"
            style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
          >
            당신의 시간 속에 머무는 감정의 궤도
          </p>
        </motion.div>

        {/* ── Orbital system ── */}
        <div className="relative flex h-[340px] w-[340px] items-center justify-center sm:h-[400px] sm:w-[400px]">

          {/* Ambient glow ring */}
          <div
            className="pointer-events-none absolute h-80 w-80 rounded-full sm:h-96 sm:w-96"
            style={{
              background: "radial-gradient(circle, rgba(100,50,220,0.15) 0%, transparent 68%)",
              filter: "blur(30px)",
            }}
          />

          {/* Energy orb — bigger blobs */}
          <motion.div
            className="relative h-52 w-52 sm:h-60 sm:w-60"
            style={{ filter: "url(#goo)" }}
            animate={orbBurst ? { scale: [1, 0.25, 0] } : { scale: 1 }}
            transition={orbBurst ? { duration: 0.36, ease: [0.6, 0, 1, 1] } : {}}
          >
            {ORB_BLOBS.map((b, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: `${b.w}%`, height: `${b.h}%`,
                  marginLeft: `-${b.w / 2}%`, marginTop: `-${b.h / 2}%`,
                  background: b.color,
                  filter: "blur(14px)",
                  mixBlendMode: "screen",
                  opacity: 0.9,
                }}
                animate={orbBurst
                  ? { scale: 2.5, opacity: 0 }
                  : {
                      x: [0, b.dx, b.dx * 0.4, -b.dx * 0.6, 0],
                      y: [0, b.dy * 0.5, b.dy, b.dy * 0.3, 0],
                      rotate: [0, 90, 200, 300, 360],
                      scale: [1, 1.1, 0.92, 1.06, 1],
                    }
                }
                transition={orbBurst
                  ? { duration: 0.3, ease: "easeOut" }
                  : { duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }
                }
              />
            ))}

            {/* Tiny center glint — very small so it doesn't wash out colors */}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[18%] w-[18%] rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(220,200,255,0.18) 55%, transparent 100%)",
              }}
              animate={orbBurst ? { scale: 5, opacity: 0 } : { scale: [0.85, 1.15, 0.85] }}
              transition={orbBurst
                ? { duration: 0.28, ease: "easeOut" }
                : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
              }
            />
          </motion.div>

          {/* Orbiting E M I T */}
          {ORBIT_CFG.map((cfg) => (
            <OrbitalLetter key={cfg.char} {...cfg} condensed={condensed} />
          ))}

          {/* Hover condensation burst (desktop only) */}
          <AnimatePresence>
            {condensed && !isStarting && (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 16, 26], opacity: [0, 0.5, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(200,160,255,0.45) 55%, transparent 80%)",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── CTA ── */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <motion.button
            onHoverStart={() => { if (!isTouchRef.current && !isStarting) setCondensed(true); }}
            onHoverEnd={()  => { if (!isTouchRef.current && !isStarting) setCondensed(false); }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBegin}
            disabled={isStarting}
            className="relative overflow-hidden rounded-full border border-white/28 bg-white/8 px-12 py-[13px] backdrop-blur-sm transition-colors hover:border-white/45 hover:bg-white/14 disabled:cursor-not-allowed"
            style={{ fontWeight: 300 }}
          >
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full"
              animate={{ opacity: condensed ? 1 : 0 }}
              transition={{ duration: 0.22 }}
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(200,155,255,0.24), transparent 70%)",
              }}
            />
            <span
              className="relative z-10 text-sm tracking-[0.3em] text-white/90"
              style={{ fontFamily: "system-ui, 'Noto Sans KR', sans-serif", fontWeight: 300 }}
            >
              여정 시작하기
            </span>
          </motion.button>

          <p
            className="text-center text-[0.6rem] tracking-[0.22em] text-white/42"
            style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
          >
            과거의 지혜가 당신의 현재를 비춥니다
          </p>
        </div>

        {/* Copyright */}
        <p
          className="absolute bottom-4 left-0 right-0 text-center text-[0.54rem] tracking-[0.22em] text-white/22"
          style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif" }}
        >
          © {new Date().getFullYear()} E.M.I.T. All rights reserved.
        </p>
      </section>

      {/* ── Supernova flash ── */}
      <AnimatePresence>
        {orbBurst && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Expanding ring */}
            <motion.div
              className="absolute h-6 w-6 rounded-full bg-white"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 50, opacity: [1, 0.7, 0] }}
              transition={{ duration: 0.52, ease: [0.1, 0, 0.6, 1] }}
            />
            {/* White fill */}
            <motion.div
              className="absolute inset-0 bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.88, 0.6, 0] }}
              transition={{ duration: 0.52, times: [0, 0.3, 0.6, 1] }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
