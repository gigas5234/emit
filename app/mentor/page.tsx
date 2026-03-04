"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { findMentorForColors, MentorColor } from "../emotion/mentors";

type MentorCsvRow = {
  id: string;
  color1: string;
  color2: string;
  mentorNameKr: string;
  mentorNameEn: string;
  selectionReason: string;
  mission: string;
  tonePersonality: string;
};

const HEX_TO_COLOR: Record<string, MentorColor> = {
  "#FF0000": "Red",
  "#0000FF": "Blue",
  "#FFFF00": "Yellow",
  "#800080": "Purple",
  "#808080": "Gray",
  "#008000": "Green",
  "#FFA500": "Orange",
  "#000080": "Navy",
};

function normalizeHex(hex: string) {
  return hex.trim().toUpperCase();
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === "," && !quoted) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function parseMentorsCsv(csv: string): MentorCsvRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.slice(1).map((line) => {
    const c = parseCsvLine(line);
    return {
      id: c[0] ?? "",
      color1: c[1] ?? "",
      color2: c[2] ?? "",
      mentorNameKr: c[3] ?? "",
      mentorNameEn: c[4] ?? "",
      selectionReason: c[5] ?? "",
      mission: c[6] ?? "",
      tonePersonality: c[7] ?? "",
    };
  });
}

// Static map — resolved from URL params instantly (no CSV wait)
const COLOR_PAIR_TO_IMAGE: Record<string, string> = {
  "Red_Blue": "/mentors/01.png",
  "Red_Yellow": "/mentors/02.png",
  "Red_Purple": "/mentors/03.png",
  "Red_Gray": "/mentors/04.png",
  "Red_Green": "/mentors/05.png",
  "Red_Orange": "/mentors/06.png",
  "Red_Navy": "/mentors/07.png",
  "Blue_Yellow": "/mentors/08.png",
  "Blue_Purple": "/mentors/09.png",
  "Blue_Gray": "/mentors/10.png",
  "Blue_Green": "/mentors/11.png",
  "Blue_Orange": "/mentors/12.png",
  "Blue_Navy": "/mentors/13.png",
  "Yellow_Purple": "/mentors/14.png",
  "Yellow_Gray": "/mentors/15.png",
  "Yellow_Green": "/mentors/16.png",
  "Yellow_Orange": "/mentors/17.png",
  "Yellow_Navy": "/mentors/18.png",
  "Purple_Gray": "/mentors/19.png",
  "Purple_Green": "/mentors/20.png",
  "Purple_Orange": "/mentors/21.png",
};

function getMentorImageFromColors(a: string, b: string): string {
  return (
    COLOR_PAIR_TO_IMAGE[`${a}_${b}`] ??
    COLOR_PAIR_TO_IMAGE[`${b}_${a}`] ??
    "/mentors/sample.png"
  );
}

function getMentorImage(id: string | undefined): string {
  if (!id) return "/mentors/sample.png";
  const num = parseInt(id, 10);
  if (isNaN(num) || num < 1 || num > 21) return "/mentors/sample.png";
  return `/mentors/${String(num).padStart(2, "0")}.png`;
}

function MentorIntroInner() {
  const router = useRouter();
  const params = useSearchParams();
  const c1 = params.get("c1") ?? "#7C3AED";
  const c2 = params.get("c2") ?? "#3B82F6";
  const n1 = params.get("n1") ?? "감정 A";
  const n2 = params.get("n2") ?? "감정 B";
  const m1 = (params.get("m1") as MentorColor) ?? "Purple";
  const m2 = (params.get("m2") as MentorColor) ?? "Blue";

  // Resolved immediately from URL — no CSV loading delay
  const instantImageSrc = getMentorImageFromColors(m1, m2);

  const [mentorRows, setMentorRows] = useState<MentorCsvRow[]>([]);

  useEffect(() => {
    fetch("/mentors.csv")
      .then((res) => res.text())
      .then((text) => setMentorRows(parseMentorsCsv(text)))
      .catch(() => setMentorRows([]));
  }, []);

  const selectedMentor = useMemo(() => {
    const key1 = HEX_TO_COLOR[normalizeHex(c1)] ?? m1;
    const key2 = HEX_TO_COLOR[normalizeHex(c2)] ?? m2;
    return (
      findMentorForColors(key1, key2) ?? {
        mentorName: "E.M.I.T Mentor",
        mixedColorResult: "Resonance_Tone",
        coreExperienceInsight: "당신의 감정은 언제나 이해받을 가치가 있습니다.",
      }
    );
  }, [c1, c2, m1, m2]);

  const matchedRow = useMemo(() => {
    const key1 = HEX_TO_COLOR[normalizeHex(c1)] ?? m1;
    const key2 = HEX_TO_COLOR[normalizeHex(c2)] ?? m2;
    return (
      mentorRows.find((row) => {
        const a = row.color1.trim();
        const b = row.color2.trim();
        return (a === key1 && b === key2) || (a === key2 && b === key1);
      }) ?? null
    );
  }, [mentorRows, c1, c2, m1, m2]);

  const handleStartChat = () => {
    router.push(`/mentor/chat?${params.toString()}`);
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040611] via-[#06020D] to-[#020205]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(130,75,255,0.42),transparent_58%),radial-gradient(circle_at_24%_78%,rgba(56,189,248,0.28),transparent_62%)]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <p className="text-center text-[0.65rem] tracking-[0.28em] text-white/50 sm:text-[0.72rem]">
          감정의 주파수가 일치하는 멘토를 찾았습니다.
        </p>

        {/* Mentor name highlight */}
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="font-display text-[0.58rem] font-light uppercase tracking-[0.38em] text-white/38">Your Mentor</p>
          <h1
            className="text-center text-2xl font-extrabold tracking-wide sm:text-3xl"
            style={{
              background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: `drop-shadow(0 0 14px ${c1}88) drop-shadow(0 0 28px ${c2}66)`,
            }}
          >
            {matchedRow?.mentorNameKr ?? selectedMentor.mentorName}
          </h1>
          {matchedRow?.mentorNameEn && (
            <p className="text-xs tracking-[0.18em] text-white/45">
              {matchedRow.mentorNameEn}
            </p>
          )}
        </div>

        <div className="mt-4 grid flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_1fr_1.1fr]">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <p className="font-display text-[0.6rem] font-light uppercase tracking-[0.32em] text-violet-200/80">Context</p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-white/82">
              {n1}와 {n2}가 만나 만들어낸 감정의 흐름을 함께 읽어냅니다.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            >
                <Image
                  src={instantImageSrc}
                  alt="Mentor figure"
                  width={280}
                  height={320}
                  priority
                  className="h-64 w-auto sm:h-80"
                  style={{ objectFit: "contain" }}
                />
            </motion.div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <p className="font-display text-[0.6rem] font-light uppercase tracking-[0.32em] text-violet-200/80">Why</p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-white/82">
              {matchedRow?.selectionReason ?? selectedMentor.coreExperienceInsight}
            </p>
            <p className="font-display mt-4 text-[0.6rem] font-light uppercase tracking-[0.32em] text-violet-200/80">Mission</p>
            <p className="mt-1 text-[0.82rem] leading-relaxed text-white/82">
              {matchedRow?.mission ??
                "이번 대화에서 감정의 원인을 구조적으로 이해하고 다음 행동을 설계합니다."}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleStartChat}
            className="group relative overflow-hidden rounded-full px-10 py-3.5 text-sm font-semibold tracking-[0.12em] text-white transition-all duration-300 hover:scale-[1.04] active:scale-[0.97]"
            style={{
              background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
              boxShadow: `0 0 28px ${c1}66, 0 0 56px ${c2}44, 0 8px 32px rgba(0,0,0,0.6)`,
            }}
          >
            {/* shimmer overlay */}
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
              }}
            />
            <span className="relative z-10" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.45)" }}>
              대화 시작하기
            </span>
          </button>
        </div>
      </section>
    </main>
  );
}

export default function MentorIntroPage() {
  return (
    <Suspense>
      <MentorIntroInner />
    </Suspense>
  );
}

