"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LiquidOrb } from "../emotion/LiquidOrb";

const MESSAGES_TEMPLATE = [
  (n1: string, n2: string) => `당신의 ${n1}과 ${n2}을(를) 섞는 중입니다...`,
  () => "시간의 틈에서 당신을 이해할 멘토를 찾는 중...",
  () => "곧 당신의 멘토가 도착합니다...",
];

function AlchemyInner() {
  const router = useRouter();
  const search = useSearchParams();

  const c1 = search.get("c1") ?? "#FF6B9A";
  const c2 = search.get("c2") ?? "#7C3AED";
  const n1 = search.get("n1") ?? "감정 A";
  const n2 = search.get("n2") ?? "감정 B";
  const m1 = search.get("m1") ?? "Purple";
  const m2 = search.get("m2") ?? "Blue";

  const colors = useMemo(() => [c1, c2], [c1, c2]);

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    timers.push(
      setTimeout(() => setMsgIndex(1), 1000),
      setTimeout(() => setMsgIndex(2), 2000),
      setTimeout(() => {
        const params = new URLSearchParams({ c1, c2, n1, n2, m1, m2 });
        router.push(`/mentor?${params.toString()}`);
      }, 3000)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [router, c1, c2, n1, n2, m1, m2]);

  const currentMessage = useMemo(() => {
    const fn = MESSAGES_TEMPLATE[msgIndex] ?? MESSAGES_TEMPLATE[0];
    return fn(n1, n2);
  }, [msgIndex, n1, n2]);

  return (
    <>
      {/* top hint */}
      <p
        className="mb-6 text-[0.65rem] uppercase tracking-[0.42em] text-purple-100/70 sm:mb-8 sm:text-[0.7rem]"
        style={{ fontFamily: "'Cormorant Garamond','Garamond',Georgia,serif", fontWeight: 300 }}
      >
        Emotion Alchemy
      </p>

      {/* center orb */}
      <motion.div
        className="relative flex flex-1 flex-col items-center justify-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.div
          className="relative"
          animate={{ rotate: [0, 8, -6, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <LiquidOrb colors={colors} />
        </motion.div>

        {/* loading text */}
        <div className="mt-6 h-12 w-full max-w-xl text-center text-sm sm:text-base">
          <AnimatePresence mode="wait">
            <motion.p
              key={msgIndex}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="px-4 text-white/85 drop-shadow-[0_0_14px_rgba(0,0,0,0.9)]"
              style={{ fontFamily: "system-ui, 'Noto Sans KR', sans-serif", fontWeight: 300 }}
            >
              {currentMessage}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 실루엣은 현재 연출에서 제외 */}
    </>
  );
}

export default function EmotionAlchemyPage() {
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_15%,rgba(147,51,234,0.65),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.5),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,black_88%)] mix-blend-multiply" />
      </div>

      <Suspense>
        <div className="relative z-10 flex min-h-screen flex-col items-center px-5 pb-8 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
          <AlchemyInner />
        </div>
      </Suspense>
    </main>
  );
}


