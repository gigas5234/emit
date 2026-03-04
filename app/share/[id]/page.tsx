"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Share2, RefreshCw } from "lucide-react";

type ShareSummaryPayload = {
  id: string;
  mentorId?: string;
  mentorNameKr: string;
  mentorNameEn: string;
  color1: string;
  color2: string;
  quote: string;
  emotionKeyword: string;
  healingScore: number;
  journeyWords: string[];
};

function getMentorImage(id: string | undefined): string {
  if (!id) return "/mentors/sample.png";
  const num = parseInt(id, 10);
  if (isNaN(num) || num < 1 || num > 21) return "/mentors/sample.png";
  return `/mentors/${String(num).padStart(2, "0")}.png`;
}

/** Semi-circle healing gauge drawn with SVG */
function HealingArc({
  score,
  color1,
  color2,
}: {
  score: number;
  color1: string;
  color2: string;
}) {
  const arcRef = useRef<SVGPathElement>(null);
  const [dashOffset, setDashOffset] = useState(251); // full hidden

  // Semi-circle arc path (r=80, center 100,95)
  const R = 80;
  const CX = 100;
  const CY = 95;
  const circumference = Math.PI * R; // half circle = πr

  useEffect(() => {
    const timer = setTimeout(() => {
      const filled = circumference * (score / 100);
      setDashOffset(circumference - filled);
    }, 300);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <div className="relative flex flex-col items-center">
      <svg
        viewBox="0 0 200 110"
        className="w-full max-w-[220px]"
        aria-label={`감정 회복 ${score}%`}
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color1} stopOpacity="0.9" />
            <stop offset="100%" stopColor={color2} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {/* Track */}
        <path
          d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Filled arc */}
        <path
          ref={arcRef}
          d={`M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Score label */}
        <text
          x={CX}
          y={CY - 8}
          textAnchor="middle"
          fontSize="26"
          fontWeight="bold"
          fill="white"
          fillOpacity="0.92"
        >
          {score}
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          fontSize="9"
          fill="rgba(255,255,255,0.45)"
          letterSpacing="2"
        >
          HEALING
        </text>
        {/* Axis labels */}
        <text x="8" y="108" fontSize="8" fill="rgba(255,255,255,0.3)">무거움</text>
        <text x="158" y="108" fontSize="8" fill="rgba(255,255,255,0.3)">가벼움</text>
      </svg>
    </div>
  );
}

/** 3-step journey pill row */
function JourneyFlow({ words, color1, color2 }: { words: string[]; color1: string; color2: string }) {
  const three = [...words, "", ""].slice(0, 3);
  return (
    <div className="flex items-center justify-center gap-2">
      {three.map((word, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="rounded-full px-3 py-1 text-[0.72rem] font-semibold text-white"
            style={{
              background:
                i === 0
                  ? `${color1}55`
                  : i === 1
                  ? "rgba(255,255,255,0.12)"
                  : `${color2}55`,
              border: `1px solid ${i === 0 ? color1 : i === 2 ? color2 : "rgba(255,255,255,0.2)"}55`,
            }}
          >
            {word || "—"}
          </span>
          {i < 2 && (
            <span className="text-[0.6rem] text-white/30">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState("");
  const [data, setData] = useState<ShareSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareStatus, setShareStatus] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/share/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json?.error) setData(null);
        else setData(json as ShareSummaryPayload);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleShare = async () => {
    if (isSharing || !data) return;
    setIsSharing(true);
    setShareStatus("");
    try {
      const title = `E.M.I.T: ${data.mentorNameKr}의 위로`;
      const text = `[${data.emotionKeyword}] 조합의 처방전: ${data.quote}`;
      const url = typeof window !== "undefined" ? window.location.href : "";
      const payload = { title, text, url };
      const canShare = navigator.canShare ? navigator.canShare(payload) : true;
      if (typeof navigator.share === "function" && canShare) {
        await navigator.share(payload);
        setShareStatus("공유가 완료되었습니다.");
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        setShareStatus("링크가 복사되었습니다.");
      }
    } catch {
      setShareStatus("공유에 실패했습니다.");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040611] via-[#06020D] to-[#020205]" />
        {data && (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 60% 15%, ${data.color1}30, transparent 55%), radial-gradient(circle at 30% 80%, ${data.color2}22, transparent 60%)`,
            }}
          />
        )}
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-10">
        <div className="w-full rounded-3xl border border-white/15 bg-black/45 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.65)] backdrop-blur-md">
          {loading ? (
            <div className="py-10">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
              <p className="mt-4 text-sm text-white/60">처방전을 불러오는 중...</p>
            </div>
          ) : !data ? (
            <p className="py-6 text-white/70">요약 정보를 찾지 못했습니다.</p>
          ) : (
            <>
              {/* Header label */}
              <p className="text-[0.6rem] uppercase tracking-[0.28em] text-white/35">
                E.M.I.T Prescription
              </p>

              {/* Mentor figure */}
              <div className="mt-3 flex justify-center">
                <Image
                  src={getMentorImage(data.mentorId)}
                  alt="Mentor"
                  width={120}
                  height={140}
                  className="h-28 w-auto"
                  style={{ objectFit: "contain" }}
                />
              </div>

              {/* Mentor name */}
              <p className="mt-2 text-sm font-bold tracking-wide text-white/90">
                {data.mentorNameKr} 멘토의 처방전
              </p>

              {/* Quote */}
              <p className="mt-3 rounded-2xl border border-white/15 bg-white/8 px-4 py-4 text-[0.93rem] font-medium italic leading-relaxed text-white/95">
                &ldquo;{data.quote}&rdquo;
              </p>

              {/* Emotion keywords */}
              <p className="mt-2 text-[0.7rem] tracking-wide text-white/40">
                감정 조합 · {data.emotionKeyword}
              </p>

              {/* Divider */}
              <div className="my-4 h-px w-full bg-white/10" />

              {/* Healing arc gauge */}
              <p className="mb-2 text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
                감정 회복 지수
              </p>
              <HealingArc
                score={data.healingScore ?? 55}
                color1={data.color1}
                color2={data.color2}
              />

              {/* Journey flow */}
              {data.journeyWords?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[0.65rem] uppercase tracking-[0.2em] text-white/35">
                    감정 여정
                  </p>
                  <JourneyFlow
                    words={data.journeyWords}
                    color1={data.color1}
                    color2={data.color2}
                  />
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          {!loading && (
            <div className="mt-6 flex flex-col gap-3">
              {data && (
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/25 px-5 py-3 text-sm font-semibold text-violet-100 backdrop-blur-md transition hover:bg-violet-500/40 disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" />
                  {isSharing ? "공유 중..." : "공유하기"}
                </button>
              )}
              <button
                type="button"
                onClick={() => router.push("/emotion")}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white/85 backdrop-blur-md transition hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                감정 다시 선택하기
              </button>
            </div>
          )}

          {shareStatus && (
            <p className="mt-3 text-center text-xs text-cyan-200/90">{shareStatus}</p>
          )}
        </div>
      </section>
    </main>
  );
}
