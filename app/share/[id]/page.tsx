"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type ShareSummaryPayload = {
  id: string;
  mentorNameKr: string;
  mentorNameEn: string;
  color1: string;
  color2: string;
  quote: string;
  emotionKeyword: string;
  summary: string;
};

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState("");
  const [data, setData] = useState<ShareSummaryPayload | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-700/60 via-indigo-700/40 to-cyan-600/45" />
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-6 py-10">
        <div className="w-full rounded-3xl border border-white/20 bg-black/30 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.55)] backdrop-blur-md">
          {loading ? (
            <p className="text-white/85">요약 카드를 불러오는 중...</p>
          ) : !data ? (
            <p className="text-white/80">요약 정보를 찾지 못했습니다.</p>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.22em] text-white/65">
                E.M.I.T Prescription
              </p>
              <div className="mt-4 flex justify-center">
                <Image
                  src="/mentors/sample.png"
                  alt="Mentor"
                  width={180}
                  height={180}
                  className="h-36 w-auto"
                />
              </div>
              <p className="mt-3 text-sm text-white/85">
                [{data.mentorNameKr}] 멘토의 처방전
              </p>
              <p className="mt-2 rounded-2xl bg-white/10 px-4 py-3 text-base leading-relaxed text-white/95">
                {data.quote}
              </p>
              <p className="mt-3 text-xs text-white/70">
                감정 키워드: {data.emotionKeyword}
              </p>
              <p className="mt-2 text-sm text-white/80">{data.summary}</p>
            </>
          )}

          <Link
            href="/"
            className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/20"
          >
            나도 멘토 만나러 가기
          </Link>
        </div>
      </section>
    </main>
  );
}

