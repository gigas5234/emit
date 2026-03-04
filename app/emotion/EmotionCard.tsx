"use client";

import { motion } from "framer-motion";
import clsx from "clsx";

type EmotionKey =
  | "anger"
  | "sadness"
  | "calm"
  | "anxiety"
  | "apathy"
  | "comparison"
  | "overwhelm"
  | "isolation";

export type Emotion = {
  key: EmotionKey;
  label: string;
  color: string;
  description: string;
};

interface EmotionCardProps {
  emotion: Emotion;
  selected: boolean;
  onToggle: () => void;
}

const variants = {
  initial: { opacity: 0, y: 20, scale: 0.96 },
  enter: { opacity: 1, y: 0, scale: 1 },
};

function hexToRgba(hex: string, alpha: number) {
  const raw = hex.replace("#", "");
  const normalized =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function EmotionCard({ emotion, selected, onToggle }: EmotionCardProps) {
  const strong = hexToRgba(emotion.color, selected ? 0.75 : 0.42);
  const soft = hexToRgba(emotion.color, selected ? 0.45 : 0.24);

  return (
    <motion.button
      type="button"
      variants={variants}
      whileHover={{ scale: selected ? 1.05 : 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className={clsx(
        "relative flex flex-col items-start justify-between overflow-hidden rounded-2xl border px-3 py-3 text-left shadow-[0_16px_40px_rgba(0,0,0,0.85)] transition-colors sm:px-4 sm:py-4",
        selected
          ? "border-purple-300/90 bg-white/10"
          : "border-white/10 bg-black/40 hover:border-purple-200/40 hover:bg-white/5"
      )}
    >
      {/* 기본 은은한 컬러 오버레이 */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          opacity: selected ? 0.9 : 0.62,
          background: `
            radial-gradient(circle at 10% 12%, ${strong} 0%, ${soft} 48%, transparent 90%),
            linear-gradient(115deg, ${soft} 0%, transparent 70%)
          `,
        }}
      />
      {/* 선택 시 외곽선 + 네온 하이라이트 */}
      {selected && (
        <div className="pointer-events-none absolute -inset-px rounded-2xl border border-purple-300/80 shadow-[0_0_24px_rgba(167,139,250,0.8)]" />
      )}

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
          {emotion.label}
        </p>
        <p className="mt-1 text-[0.7rem] text-white/70 sm:text-xs">
          {emotion.description}
        </p>
      </div>
    </motion.button>
  );
}

