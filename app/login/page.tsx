"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-wide sm:text-3xl">
            로그인
          </h1>
          <p className="mt-2 text-xs text-white/60 sm:text-sm">
            E.M.I.T에 다시 오신 것을 환영합니다.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)] backdrop-blur-md sm:p-7">
          <form className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-white/80 sm:text-sm"
              >
                이메일 주소
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-purple-300 focus:bg-black/60 focus:ring-2 focus:ring-purple-500/60 sm:px-4 sm:py-2.5"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-xs font-medium text-white/80 sm:text-sm"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-0 transition focus:border-purple-300 focus:bg-black/60 focus:ring-2 focus:ring-purple-500/60 sm:px-4 sm:py-2.5"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-fuchsia-500 px-4 py-2.5 text-sm font-semibold tracking-[0.18em] text-white shadow-[0_16px_40px_rgba(0,0,0,0.9)] transition hover:brightness-110 sm:py-3"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <div className="mt-4 space-y-3">
            <p className="text-center text-[0.7rem] text-white/60 sm:text-xs">
              다른 서비스로 로그인
            </p>
            <div className="space-y-2">
              <button
                type="button"
                className="group flex w-full items-center justify-center gap-3 rounded-full border border-[#3a3a3a] bg-black/40 px-4 py-2.5 text-sm font-medium text-[#F5F5F5] shadow-[0_10px_24px_rgba(0,0,0,0.6)] transition hover:border-[#FEE500] hover:bg-[#111111] hover:text-[#FEE500] cursor-pointer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FEE500] text-xs font-bold text-black shadow-[0_0_8px_rgba(0,0,0,0.45)]">
                  말
                </span>
                <span className="text-[0.85rem]">카카오로 시작하기</span>
              </button>
              <button
                type="button"
                className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-black/60 px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(0,0,0,0.65)] transition hover:bg-white hover:text-black cursor-pointer"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[0.9rem] font-bold text-[#4285F4] shadow-[0_0_8px_rgba(0,0,0,0.45)]">
                  G
                </span>
                <span className="text-[0.85rem]">Google로 시작하기</span>
              </button>
            </div>
          </div>

          <div className="mt-4 text-center text-[0.65rem] text-white/45 sm:text-[0.7rem]">
            <span>계정이 없으신가요? </span>
            <Link href="/" className="text-purple-200 hover:underline">
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

