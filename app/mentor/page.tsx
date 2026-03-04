"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { findMentorForColors, MentorColor } from "../emotion/mentors";
import { kakaoClipboard, useKakaoScript } from "react-kakao-share";

type SpeechRecognitionType =
  | (any & { continuous?: boolean; interimResults?: boolean })
  | null;

type Message = {
  role: "user" | "assistant";
  content: string;
};

function MentorInner() {
  const params = useSearchParams();
  const c1 = params.get("c1") ?? "#7C3AED";
  const c2 = params.get("c2") ?? "#3B82F6";
  const n1 = params.get("n1") ?? "감정 A";
  const n2 = params.get("n2") ?? "감정 B";
  const m1 = (params.get("m1") as MentorColor) ?? "Purple";
  const m2 = (params.get("m2") as MentorColor) ?? "Blue";

  const selectedMentor = useMemo(
    () =>
      findMentorForColors(m1, m2) ?? {
        mentorName: "E.M.I.T Mentor",
        occupation: "Emotional Guide",
        coreExperienceInsight: "당신의 감정은 언제나 이해받을 가치가 있습니다.",
      },
    [m1, m2]
  );

  const mentorPersonality = useMemo(
    () =>
      `${selectedMentor.occupation}의 톤으로 차분하고 통찰력 있게 답변하며, 핵심 인사이트는 "${selectedMentor.coreExperienceInsight}"를 반영한다.`,
    [selectedMentor]
  );

  useKakaoScript();

  const [mentorText, setMentorText] = useState("좋아요. 지금 감정의 결을 함께 천천히 읽어볼게요.");
  const [displayedText, setDisplayedText] = useState("");
  const [userText, setUserText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "좋아요. 지금 감정의 결을 함께 천천히 읽어볼게요." },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionType>(null);
  const messagesRef = useRef<Message[]>(messages);
  const transcriptBufferRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isThinkingRef = useRef(false);
  const audioLevelRef = useRef(0);
  const liveThreshold = 0.07;
  const kakaoApiKey = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  const stopSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const flushTranscriptToApi = async () => {
    const text = transcriptBufferRef.current.trim();
    if (!text) return;
    transcriptBufferRef.current = "";
    setUserText(text);
    const nextMessages: Message[] = [
      ...messagesRef.current,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          mentorName: selectedMentor.mentorName,
          personality: mentorPersonality,
          coreInsight: selectedMentor.coreExperienceInsight,
          messages: nextMessages,
        }),
      });

      let reply = "";
      if (res.ok) {
        const data = await res.json();
        reply =
          data?.reply ??
          "좋은 질문이에요. 이 감정의 뿌리를 함께 찾아보면, 생각보다 선명한 답을 만나게 될 거예요.";
      } else {
        reply = "잠시 연결이 불안정하지만, 저는 계속 당신의 이야기를 듣고 있어요.";
      }
      setMentorText(reply);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      const fallback =
        "좋아요, 지금 숨을 한 번 고르고 감정의 이름을 다시 천천히 불러볼까요?"
      setMentorText(fallback);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Typewriter effect
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const text = mentorText;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [mentorText]);

  // Audio analyser + VAD-like level tracking
  useEffect(() => {
    let mounted = true;
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) return;
        mediaStreamRef.current = stream;

        const ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        const data = new Uint8Array(analyser.fftSize);

        audioCtxRef.current = ctx;
        analyserRef.current = analyser;
        dataArrayRef.current = data;

        const tick = () => {
          if (!analyserRef.current || !dataArrayRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArrayRef.current as any);
          let sum = 0;
          for (let i = 0; i < dataArrayRef.current.length; i += 1) {
            const v = (dataArrayRef.current[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / dataArrayRef.current.length);
          const normalized = Math.min(1, rms * 3.2);
          setAudioLevel((prev) => prev * 0.75 + normalized * 0.25);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해 주세요.");
      }
    };

    setupAudio();
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSilenceTimer();
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Setup continuous recognition
  useEffect(() => {
    const anyWindow = window as any;
    const SpeechRecognition =
      anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }

    const recognition: SpeechRecognitionType = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) {
          transcriptBufferRef.current = `${transcriptBufferRef.current} ${chunk}`.trim();
        } else {
          interim += chunk;
        }
      }

      if (interim.trim()) setUserText(interim.trim());

      if (transcriptBufferRef.current.trim()) {
        stopSilenceTimer();
        silenceTimerRef.current = setTimeout(() => {
          flushTranscriptToApi();
        }, 900);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // live mode: if voice level is above threshold, resume listening
      if (audioLevelRef.current > liveThreshold * 0.8 && !isThinkingRef.current) {
        try {
          recognition.start();
          setIsListening(true);
        } catch {
          // noop
        }
      }
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    };
  }, []);

  // Auto start recognition when voice is detected above threshold
  useEffect(() => {
    if (!sttSupported || !recognitionRef.current || isListening || isThinking) return;
    if (audioLevel < liveThreshold) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // noop
    }
  }, [audioLevel, isListening, isThinking, sttSupported]);

  const waveformBars = Array.from({ length: 24 }, (_, i) => i);
  const waveColor = isThinking ? "#c084fc" : "#67e8f9";

  const dailySentence = useMemo(() => {
    if (!summaryText) return "";
    const line = summaryText
      .split("\n")
      .map((s) => s.trim())
      .find((s) => s.startsWith("오늘의 문장:"));
    if (line) return line.replace("오늘의 문장:", "").trim();
    return summaryText.split(/[.!?]/)[0]?.trim() ?? "";
  }, [summaryText]);

  const mixedEmotionLabel = `${n1} + ${n2}`;

  const handleEndJourney = async () => {
    setIsSummarizing(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "summary",
          mentorName: selectedMentor.mentorName,
          personality: mentorPersonality,
          coreInsight: selectedMentor.coreExperienceInsight,
          messages,
        }),
      });

      if (!res.ok) throw new Error("summary failed");
      const data = await res.json();
      const summary = String(data?.summary ?? "").trim();
      setSummaryText(summary || "오늘의 대화를 통해 감정의 흐름을 한 걸음 더 이해했습니다.");
      setShowSummaryModal(true);
    } catch {
      setSummaryText(
        "오늘의 대화는 당신의 감정을 더 선명하게 바라보는 시간이었어요.\n오늘의 문장: 감정은 숨길 대상이 아니라, 나를 이해하는 단서다."
      );
      setShowSummaryModal(true);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleKakaoShare = () => {
    if (!kakaoApiKey) {
      alert("카카오 공유를 위해 NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY 설정이 필요합니다.");
      return;
    }
    kakaoClipboard({
      title: `${selectedMentor.mentorName} 멘토와의 여정`,
      description: `[혼합 감정] ${mixedEmotionLabel}\n[오늘의 문장] ${dailySentence || "감정은 나를 이해하는 단서다."}`,
      image: "/00.logo.png",
      APIKEY: kakaoApiKey,
    });
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050616] via-[#05010A] to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(147,51,234,0.6),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.5),transparent_60%)] opacity-70" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 pb-8 pt-6 sm:px-8 sm:pt-8">
        {/* top bar */}
        <div className="mb-4 flex items-start justify-between sm:mb-6">
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] backdrop-blur-md">
              <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: c1 }} />
              Color 1
            </div>
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.7rem] backdrop-blur-md">
              <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: c2 }} />
              Color 2
            </div>
          </div>

          <div className="rounded-full border border-red-300/40 bg-red-500/10 px-3 py-1 text-[0.7rem] font-semibold tracking-[0.2em] text-red-200 backdrop-blur-md">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-400 align-middle">
              <motion.span
                className="block h-2 w-2 rounded-full bg-red-400"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </span>
            LIVE
          </div>
        </div>

        <div className="-mt-1 mb-3 flex justify-end">
          <button
            type="button"
            disabled={isSummarizing}
            onClick={handleEndJourney}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white/90 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSummarizing ? "요약 생성 중..." : "여정 종료"}
          </button>
        </div>

        {/* mentor bubble */}
        <div className="mb-4 flex w-full justify-center text-center sm:mb-6">
          <div className="relative max-w-2xl">
            <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-[0_18px_45px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-6 sm:py-4 sm:text-base">
              <AnimatePresence mode="wait">
                <motion.span
                  key={mentorText}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {displayedText}
                  {isThinking && (
                    <span className="ml-1 inline-flex items-center gap-[2px] align-middle">
                      <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/80 animate-pulse" />
                      <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/60 animate-pulse [animation-delay:0.12s]" />
                      <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/40 animate-pulse [animation-delay:0.24s]" />
                    </span>
                  )}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-[2px] rotate-45 border-b border-r border-white/20 bg-white/10 backdrop-blur-md" />
          </div>
        </div>

        {/* center mentor */}
        <div className="relative flex flex-1 items-center justify-center">
          <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/mentors/sample.png"
              alt="Mentor figure"
              width={360}
              height={360}
              priority
              className="h-60 w-auto sm:h-72"
            />
          </motion.div>

          <motion.div
            className="absolute right-0 top-8 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs backdrop-blur-md sm:right-8"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-white/65">Mentor</p>
            <p className="mt-1 text-sm font-semibold text-white/90">{selectedMentor.mentorName}</p>
            <p className="text-[0.7rem] text-white/70">{selectedMentor.occupation}</p>
          </motion.div>
        </div>

        {/* user text */}
        {userText && (
          <p className="mb-3 text-center text-[0.75rem] text-white/60 sm:text-sm">
            감지된 음성: <span className="text-white/85">{userText}</span>
          </p>
        )}

        {/* waveform */}
        <div className="mb-2 flex h-14 w-full items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/40 px-3 backdrop-blur-md">
          {waveformBars.map((bar) => {
            const base = 20 + ((bar * 7) % 24);
            const level = Math.min(100, base + audioLevel * 75);
            return (
              <motion.span
                key={bar}
                className="block w-1 rounded-full"
                animate={{
                  height: `${level}%`,
                  backgroundColor: waveColor,
                  opacity: isListening ? 0.9 : 0.45,
                }}
                transition={{ duration: 0.18, ease: "linear" }}
              />
            );
          })}
        </div>

        <p className="text-center text-[0.7rem] text-white/55">
          {sttSupported
            ? isListening
              ? "음성 감지 중... 잠시 멈추면 자동으로 멘토에게 전달됩니다."
              : "대기 중... 목소리가 감지되면 자동으로 라이브 대화를 시작합니다."
            : "이 브라우저는 Web Speech API를 지원하지 않습니다."}
        </p>
      </div>

      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md rounded-3xl border border-white/20 bg-[#120B1F]/90 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.75)]"
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
            >
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Share Card</p>
              <h3 className="mt-2 text-lg font-semibold">오늘의 멘토 여정 요약</h3>

              <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-sm text-white/85">
                  <span className="text-white/55">멘토:</span> {selectedMentor.mentorName}
                </p>
                <p className="mt-1 text-sm text-white/85">
                  <span className="text-white/55">혼합 감정:</span> {mixedEmotionLabel}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/85">{summaryText}</p>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleKakaoShare}
                  className="flex-1 rounded-xl bg-[#FEE500] px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-95"
                >
                  카카오톡 공유
                </button>
                <button
                  type="button"
                  onClick={() => setShowSummaryModal(false)}
                  className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white/90 transition hover:bg-white/20"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function MentorChatPage() {
  return (
    <Suspense>
      <MentorInner />
    </Suspense>
  );
}


