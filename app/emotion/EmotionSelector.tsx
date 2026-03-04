"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmotionCard, Emotion } from "./EmotionCard";
import { LiquidOrb } from "./LiquidOrb";

type EmotionKey =
  | "anger"
  | "sadness"
  | "calm"
  | "anxiety"
  | "apathy"
  | "comparison"
  | "overwhelm"
  | "isolation";

const MENTOR_COLOR_BY_EMOTION: Record<
  EmotionKey,
  "Red" | "Blue" | "Yellow" | "Purple" | "Gray" | "Green" | "Orange" | "Navy"
> = {
  anger: "Red",
  sadness: "Blue",
  calm: "Yellow",
  anxiety: "Purple",
  apathy: "Gray",
  comparison: "Green",
  overwhelm: "Orange",
  isolation: "Navy",
};

const EMOTIONS: Emotion[] = [
  {
    key: "anger",
    label: "분노 · Anger",
    color: "#FF0000",
    description: "쉽게 폭발할 것 같은 뜨거운 에너지.",
  },
  {
    key: "sadness",
    label: "우울 · Sadness",
    color: "#0000FF",
    description: "깊게 가라앉아 있는 푸른 마음.",
  },
  {
    key: "calm",
    label: "평온 · Calm",
    color: "#FFFF00",
    description: "잔잔하게 숨 쉬는 고요한 상태.",
  },
  {
    key: "anxiety",
    label: "불안 · Anxiety",
    color: "#800080",
    description: "설명하기 어려운 불편함과 긴장.",
  },
  {
    key: "apathy",
    label: "무기력 · Apathy",
    color: "#808080",
    description: "아무 감정도 떠오르지 않는 텅 빈 느낌.",
  },
  {
    key: "comparison",
    label: "비교 · Comparison",
    color: "#008000",
    description: "남들과 자신을 끊임없이 견주는 마음.",
  },
  {
    key: "overwhelm",
    label: "과부하 · Overwhelm",
    color: "#FFA500",
    description: "머릿속이 너무 복잡해 멈추고 싶은 상태.",
  },
  {
    key: "isolation",
    label: "고립 · Isolation",
    color: "#000080",
    description: "모든 연결이 끊긴 것 같은 외로움.",
  },
];

export default function EmotionSelector() {
  const router = useRouter();
  const [selected, setSelected] = useState<EmotionKey[]>([]);

  const handleToggle = (key: EmotionKey) => {
    setSelected((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length === 0) return [key];
      if (prev.length === 1) return [...prev, key];
      // 최대 2개: 가장 오래된 것을 교체
      return [prev[1], key];
    });
  };

  const selectedColors = selected
    .map((key) => EMOTIONS.find((e) => e.key === key)?.color)
    .filter(Boolean) as string[];

  const canProceed = selected.length === 2;

  const handleProceed = () => {
    if (!canProceed) return;
    const [k1, k2] = selected;
    const e1 = EMOTIONS.find((e) => e.key === k1);
    const e2 = EMOTIONS.find((e) => e.key === k2);
    const n1 = e1?.label.split("·")[0].trim() ?? "감정 A";
    const n2 = e2?.label.split("·")[0].trim() ?? "감정 B";
    const c1 = e1?.color ?? "#FF6B9A";
    const c2 = e2?.color ?? "#7C3AED";
    const params = new URLSearchParams({
      c1,
      c2,
      n1,
      n2,
      m1: MENTOR_COLOR_BY_EMOTION[k1],
      m2: MENTOR_COLOR_BY_EMOTION[k2],
    });
    router.push(`/alchemy?${params.toString()}`);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <Image
          src="/01.back_img.png"
          alt="cosmic background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(147,51,234,0.55),transparent_55%),radial-gradient(circle_at_15%_80%,rgba(96,165,250,0.4),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,black_85%)] mix-blend-multiply" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* nav */}
        <header className="flex items-center justify-between px-5 py-4 sm:px-8 sm:py-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-full shadow-[0_0_14px_rgba(147,51,234,0.7)] sm:h-9 sm:w-9">
              <Image
                src="/00.logo.png"
                alt="E.M.I.T Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span
              className="text-xs tracking-[0.32em] text-white/80 sm:text-sm"
              style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
            >
              E.M.I.T
            </span>
          </Link>
          <nav className="text-xs text-white/70 sm:text-sm">
            <button className="rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[0.7rem] tracking-[0.18em] uppercase text-white/80 shadow-[0_6px_18px_rgba(0,0,0,0.6)] transition hover:bg-white hover:text-black sm:px-4 sm:text-[0.75rem]">
              My Page
            </button>
          </nav>
        </header>

        {/* main content */}
        <div className="flex flex-1 flex-col px-5 pb-6 sm:px-8 sm:pb-10">
          {/* orb area */}
          <section className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:items-start sm:gap-10">
            <div className="text-center sm:text-left">
              <p
                className="text-[0.62rem] uppercase tracking-[0.38em] text-purple-100/75 sm:text-[0.68rem]"
                style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
              >
                Emotion Mix
              </p>
              <p
                className="mt-2 max-w-xs text-[0.8rem] leading-relaxed text-white/72 sm:text-sm"
                style={{ fontFamily: "system-ui, 'Noto Sans KR', sans-serif", fontWeight: 300 }}
              >
                지금 당신의 감정을 두 가지까지 선택해 보세요. 섞인 색을 바탕으로,
                당신의 마음을 가장 잘 이해해 줄 멘토를 찾아 드립니다.
              </p>
            </div>
            <LiquidOrb colors={selectedColors} />
          </section>

          {/* emotion grid */}
          <section className="mt-8 flex-1">
            <motion.div
              className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
              initial="initial"
              animate="enter"
              variants={{
                initial: {},
                enter: {
                  transition: { staggerChildren: 0.06, delayChildren: 0.1 },
                },
              }}
            >
              {EMOTIONS.map((emotion) => (
                <EmotionCard
                  key={emotion.key}
                  emotion={emotion}
                  selected={selected.includes(emotion.key)}
                  onToggle={() => handleToggle(emotion.key)}
                />
              ))}
            </motion.div>
          </section>

          {/* CTA */}
          <section className="mt-6 flex justify-center">
            <motion.button
              whileHover={canProceed ? { scale: 1.04 } : undefined}
              whileTap={{ scale: 0.97 }}
              disabled={!canProceed}
              className="inline-flex items-center justify-center rounded-full border px-8 py-3.5 text-xs tracking-[0.2em] transition-all sm:text-sm"
              style={{ fontFamily: "system-ui, 'Noto Sans KR', sans-serif", fontWeight: 400 }}
              style={
                canProceed
                  ? {
                      background: `linear-gradient(135deg, ${selectedColors[0]} 0%, ${selectedColors[1]} 100%)`,
                      borderColor: "rgba(255,255,255,0.35)",
                      color: "#fff",
                      textShadow: "0 1px 6px rgba(0,0,0,0.55)",
                      boxShadow: `0 0 24px ${selectedColors[0]}88, 0 0 48px ${selectedColors[1]}55, 0 8px 32px rgba(0,0,0,0.7)`,
                    }
                  : {
                      borderColor: "rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.05)",
                      color: "rgba(255,255,255,0.45)",
                      cursor: "not-allowed",
                    }
              }
              onClick={handleProceed}
            >
              {canProceed
                ? "이 감정을 이해해주는 멘토 찾기"
                : "감정을 두 가지 선택해 주세요"}
            </motion.button>
          </section>
        </div>
      </div>
    </main>
  );
}

