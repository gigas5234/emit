"use client";

import { useEffect, useState } from "react";
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
  summary: string;
};

function getMentorImage(id: string | undefined): string {
  if (!id) return "/mentors/sample.png";
  const num = parseInt(id, 10);
  if (isNaN(num) || num < 1 || num > 21) return "/mentors/sample.png";
  return `/mentors/${String(num).padStart(2, "0")}.png`;
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

  const handleReselect = () => {
    router.push("/emotion");
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040611] via-[#06020D] to-[#020205]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_15%,rgba(130,75,255,0.45),transparent_55%),radial-gradient(circle_at_30%_80%,rgba(56,189,248,0.25),transparent_60%)]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-10">
        <div className="w-full rounded-3xl border border-white/15 bg-black/40 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.6)] backdrop-blur-md">
          {loading ? (
            <div className="py-10">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
              <p className="mt-4 text-sm text-white/60">요약 카드를 불러오는 중...</p>
            </div>
          ) : !data ? (
            <p className="py-6 text-white/70">요약 정보를 찾지 못했습니다.</p>
          ) : (
            <>
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-white/45">
                E.M.I.T Prescription
              </p>

              <div className="mt-4 flex justify-center">
                <div
                  className="relative overflow-hidden rounded-2xl"
                  style={{ width: 140, height: 180, isolation: "isolate" }}
                >
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.85) 0%, rgba(130,75,255,0.4) 50%, transparent 80%)",
                    }}
                  />
                  <Image
                    src={getMentorImage(data.mentorId)}
                    alt="Mentor"
                    fill
                    style={{
                      objectFit: "cover",
                      objectPosition: "center 5%",
                      mixBlendMode: "multiply",
                    }}
                  />
                </div>
              </div>

              <p className="mt-3 text-sm font-semibold text-white/80">
                {data.mentorNameKr} 멘토의 처방전
              </p>

              <p className="mt-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-base font-medium leading-relaxed text-white/95">
                &ldquo;{data.quote}&rdquo;
              </p>

              <p className="mt-3 text-xs text-white/50">
                감정 조합: {data.emotionKeyword}
              </p>

              {data.summary && (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed text-white/70">
                  {data.summary}
                </p>
              )}
            </>
          )}

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
                onClick={handleReselect}
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
