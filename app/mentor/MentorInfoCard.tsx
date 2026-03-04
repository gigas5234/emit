"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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

type MentorInfoCardProps = {
  c1: string;
  c2: string;
  n1: string;
  n2: string;
};

const HEX_TO_COLOR: Record<string, string> = {
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
  const result: string[] = [];
  let token = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        token += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      result.push(token.trim());
      token = "";
      continue;
    }
    token += ch;
  }
  result.push(token.trim());
  return result;
}

function parseMentorsCsv(csv: string): MentorCsvRow[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Header excluded intentionally.
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return {
      id: cols[0] ?? "",
      color1: cols[1] ?? "",
      color2: cols[2] ?? "",
      mentorNameKr: cols[3] ?? "",
      mentorNameEn: cols[4] ?? "",
      selectionReason: cols[5] ?? "",
      mission: cols[6] ?? "",
      tonePersonality: cols[7] ?? "",
    };
  });
}

export default function MentorInfoCard({ c1, c2, n1, n2 }: MentorInfoCardProps) {
  const [rows, setRows] = useState<MentorCsvRow[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch("/mentors.csv")
      .then((res) => res.text())
      .then((text) => {
        if (!mounted) return;
        setRows(parseMentorsCsv(text));
      })
      .catch(() => {
        if (!mounted) return;
        setRows([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const matched = useMemo(() => {
    const colorA = HEX_TO_COLOR[normalizeHex(c1)] ?? "";
    const colorB = HEX_TO_COLOR[normalizeHex(c2)] ?? "";
    if (!colorA || !colorB) return null;

    return (
      rows.find((row) => {
        const a = row.color1.trim();
        const b = row.color2.trim();
        return (a === colorA && b === colorB) || (a === colorB && b === colorA);
      }) ?? null
    );
  }, [rows, c1, c2]);

  return (
    <motion.aside
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute right-3 top-20 z-20 w-[min(88vw,360px)] rounded-2xl border border-white/20 bg-[#0F0A1D]/55 p-4 text-white/90 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-md sm:right-6 sm:top-24"
    >
      <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/60">
        Mentor Insight Card
      </h3>

      <section className="mt-3">
        <p className="text-xs font-semibold text-violet-200">Who is this Mentor?</p>
        <p className="mt-1 text-sm">
          {matched ? `${matched.mentorNameKr} (${matched.mentorNameEn})` : "매칭 중인 멘토를 찾는 중입니다."}
        </p>
        {matched?.tonePersonality && (
          <p className="mt-1 text-[0.76rem] leading-relaxed text-white/70">
            말투/성향: {matched.tonePersonality}
          </p>
        )}
      </section>

      <section className="mt-3 border-t border-white/10 pt-3">
        <p className="text-xs font-semibold text-violet-200">Why we matched?</p>
        <p className="mt-1 text-[0.8rem] leading-relaxed text-white/80">
          {matched?.selectionReason ?? "현재 감정 조합에 맞는 연결 이유를 계산 중입니다."}
        </p>
      </section>

      <section className="mt-3 border-t border-white/10 pt-3">
        <p className="text-xs font-semibold text-violet-200">What you get?</p>
        <p className="mt-1 text-[0.8rem] leading-relaxed text-white/80">
          {matched?.mission ?? "대화를 통해 감정의 방향을 함께 정리해 드립니다."}
        </p>
      </section>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[0.68rem]">
          {n1}
        </span>
        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-[0.68rem]">
          {n2}
        </span>
      </div>
    </motion.aside>
  );
}

