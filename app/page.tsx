"use client";

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

/* ─── Emotion orb colors ──────────────────────────────────────────── */
const ORB_BLOBS = [
  { color: "#FF2200", w: 58, h: 52, dur: 9.2, dx: 22, dy: 14, delay: 0 },
  { color: "#2255FF", w: 50, h: 60, dur: 11.5, dx: -18, dy: 20, delay: 0.8 },
  { color: "#FFE000", w: 44, h: 44, dur: 7.8, dx: 16, dy: -22, delay: 1.6 },
  { color: "#9900CC", w: 55, h: 48, dur: 13.1, dx: -24, dy: -12, delay: 2.2 },
  { color: "#22CC66", w: 42, h: 50, dur: 10.4, dx: 20, dy: 18, delay: 3.1 },
  { color: "#FF7700", w: 48, h: 42, dur: 8.6, dx: -14, dy: 24, delay: 1.2 },
  { color: "#0044CC", w: 46, h: 56, dur: 12.3, dx: 26, dy: -8, delay: 2.8 },
  { color: "#CC44BB", w: 52, h: 46, dur: 9.9, dx: -20, dy: -20, delay: 0.4 },
];

/* ─── Orbital letter config ───────────────────────────────────────── */
const ORBIT_CFG = [
  { char: "E", rx: 152, ry: 50, period: 8600, phase: 0.1, tilt: -0.18 },
  { char: "M", rx: 122, ry: 70, period: 11400, phase: Math.PI * 0.55, tilt: 0.22 },
  { char: "I", rx: 168, ry: 42, period: 7100, phase: Math.PI * 1.05, tilt: -0.12 },
  { char: "T", rx: 138, ry: 66, period: 13200, phase: Math.PI * 1.62, tilt: 0.26 },
];

/* ─── Stars ───────────────────────────────────────────────────────── */
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

/* ─── Single orbiting letter ──────────────────────────────────────── */
function OrbitalLetter({
  char,
  rx,
  ry,
  period,
  phase,
  tilt,
  condensed,
}: (typeof ORBIT_CFG)[0] & { condensed: boolean }) {
  const xMV = useMotionValue(rx * Math.cos(phase));
  const yMV = useMotionValue(ry * Math.sin(phase));
  const scaleMV = useMotionValue(1);
  const opacityMV = useMotionValue(0.88);

  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (condensed) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      animate(xMV, 0, { duration: 0.42, ease: [0.4, 0, 1, 1] });
      animate(yMV, 0, { duration: 0.42, ease: [0.4, 0, 1, 1] });
      animate(scaleMV, 0, { duration: 0.35, ease: "easeIn" });
      animate(opacityMV, 0, { duration: 0.28 });
      return;
    }

    animate(scaleMV, 1, { duration: 0.45 });
    animate(opacityMV, 0.88, { duration: 0.4 });

    const loop = (time: number) => {
      if (startRef.current === null) startRef.current = time;
      const a = phase + ((time - startRef.current) / period) * Math.PI * 2;
      const xb = rx * Math.cos(a);
      const yb = ry * Math.sin(a);
      xMV.set(xb * Math.cos(tilt) - yb * Math.sin(tilt));
      yMV.set(xb * Math.sin(tilt) + yb * Math.cos(tilt));
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condensed]);

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 select-none"
      style={{
        x: xMV,
        y: yMV,
        scale: scaleMV,
        opacity: opacityMV,
        translateX: "-50%",
        translateY: "-50%",
        fontFamily: "'Cormorant Garamond','Garamond','Georgia',serif",
        fontSize: "clamp(20px,3.8vw,28px)",
        fontWeight: 200,
        letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.92)",
        textShadow:
          "0 0 18px rgba(210,185,255,0.9), 0 0 36px rgba(160,120,255,0.45)",
      }}
    >
      {char}
    </motion.div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────── */
export default function Home() {
  const router = useRouter();
  const stars = useStars(85);
  const [condensed, setCondensed] = useState(false);
  const [flashing, setFlashing] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useTransform(mouseX, (v) => v * -0.05);
  const bgY = useTransform(mouseY, (v) => v * -0.05);
  const copyX = useTransform(mouseX, (v) => v * -0.035);
  const copyY = useTransform(mouseY, (v) => v * -0.03);

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - r.left - r.width / 2);
    mouseY.set(e.clientY - r.top - r.height / 2);
  };
  const handlePointerLeave = () => {
    animate(mouseX, 0, { duration: 1.4, ease: "easeOut" });
    animate(mouseY, 0, { duration: 1.4, ease: "easeOut" });
  };

  const handleBegin = async () => {
    if (flashing) return;
    setFlashing(true);
    await new Promise((r) => setTimeout(r, 720));
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
            animate={{ opacity: [s.base, s.base * 0.15, s.base] }}
            transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── Background nebula (parallax) ── */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ x: bgX, y: bgY }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_68%_18%,rgba(88,20,235,0.18),transparent_52%),radial-gradient(ellipse_at_18%_72%,rgba(6,182,212,0.1),transparent_58%),radial-gradient(ellipse_at_48%_88%,rgba(124,58,237,0.12),transparent_48%)]" />
      </motion.div>

      {/* ── SVG goo filter ── */}
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="goo"
            />
          </filter>
        </defs>
      </svg>

      {/* ── Content ── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">

        {/* Main copy — parallax opposite */}
        <motion.div className="mb-10 text-center" style={{ x: copyX, y: copyY }}>
          <p
            className="text-[0.6rem] tracking-[0.44em] text-white/32 sm:text-[0.68rem]"
            style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
          >
            당신의 시간 속에 머무는 감정의 궤도
          </p>
        </motion.div>

        {/* ── Orbital system ── */}
        <div className="relative flex h-80 w-80 items-center justify-center sm:h-96 sm:w-96">

          {/* Outer ambient glow */}
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full sm:h-80 sm:w-80"
            style={{
              background:
                "radial-gradient(circle, rgba(100,50,220,0.13) 0%, transparent 70%)",
              filter: "blur(28px)",
            }}
          />

          {/* Energy orb — blob layers */}
          <div
            className="relative h-44 w-44 sm:h-52 sm:w-52"
            style={{ filter: "url(#goo)" }}
          >
            {ORB_BLOBS.map((b, i) => (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: `${b.w}%`,
                  height: `${b.h}%`,
                  marginLeft: `-${b.w / 2}%`,
                  marginTop: `-${b.h / 2}%`,
                  background: b.color,
                  filter: "blur(16px)",
                  mixBlendMode: "screen",
                  opacity: 0.7,
                }}
                animate={{
                  x: [0, b.dx, b.dx * 0.4, -b.dx * 0.6, 0],
                  y: [0, b.dy * 0.5, b.dy, b.dy * 0.3, 0],
                  rotate: [0, 90, 200, 300, 360],
                  scale: [1, 1.08, 0.94, 1.05, 1],
                }}
                transition={{
                  duration: b.dur,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: b.delay,
                }}
              />
            ))}

            {/* White core pulse */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(200,170,255,0.12) 45%, transparent 70%)",
              }}
              animate={{ scale: [0.82, 1.06, 0.82] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Orbiting E M I T */}
          {ORBIT_CFG.map((cfg) => (
            <OrbitalLetter key={cfg.char} {...cfg} condensed={condensed} />
          ))}

          {/* Condensation burst — glows when condensed */}
          <AnimatePresence>
            {condensed && (
              <motion.div
                className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 18, 28], opacity: [0, 0.55, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,160,255,0.5) 50%, transparent 80%)",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ── CTA ── */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <motion.button
            onHoverStart={() => setCondensed(true)}
            onHoverEnd={() => setCondensed(false)}
            onFocus={() => setCondensed(true)}
            onBlur={() => setCondensed(false)}
            whileTap={{ scale: 0.96 }}
            onClick={handleBegin}
            disabled={flashing}
            className="relative overflow-hidden rounded-full border border-white/22 bg-white/7 px-11 py-3 backdrop-blur-sm transition-colors hover:border-white/38 hover:bg-white/12 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif",
              fontWeight: 300,
              fontSize: "clamp(0.72rem,2vw,0.82rem)",
              letterSpacing: "0.32em",
              color: "rgba(255,255,255,0.88)",
            }}
          >
            <motion.span
              className="pointer-events-none absolute inset-0 rounded-full"
              animate={{ opacity: condensed ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(200,155,255,0.22), transparent 68%)",
              }}
            />
            <span className="relative z-10">여정 시작하기</span>
          </motion.button>

          <p
            className="text-center text-[0.58rem] tracking-[0.2em] text-white/24"
            style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
          >
            과거의 지혜가 당신의 현재를 비춥니다
          </p>
        </div>

        {/* Copyright */}
        <p
          className="absolute bottom-4 left-0 right-0 text-center text-[0.55rem] tracking-[0.22em] text-white/20"
          style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif" }}
        >
          © {new Date().getFullYear()} E.M.I.T. All rights reserved.
        </p>
      </section>

      {/* ── White flash on navigate ── */}
      <AnimatePresence>
        {flashing && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.72, times: [0, 0.35, 0.6, 1] }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
