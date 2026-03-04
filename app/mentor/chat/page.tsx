"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { findMentorForColors, MentorColor } from "../../emotion/mentors";

type SpeechRecognitionType =
  | (any & { continuous?: boolean; interimResults?: boolean })
  | null;

type Message = { role: "user" | "assistant"; content: string };

type MentorCsvRow = {
  color1: string;
  color2: string;
  mentorNameKr: string;
  mentorNameEn: string;
  selectionReason: string;
  mission: string;
  tonePersonality: string;
};

const CHAT_HISTORY_STORAGE_KEY = "emit-chat-history";

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
  return csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)
    .map((line) => {
      const c = parseCsvLine(line);
      return {
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

function MentorChatInner() {
  const router = useRouter();
  const params = useSearchParams();
  const c1 = params.get("c1") ?? "#7C3AED";
  const c2 = params.get("c2") ?? "#3B82F6";
  const n1 = params.get("n1") ?? "감정 A";
  const n2 = params.get("n2") ?? "감정 B";
  const m1 = (params.get("m1") as MentorColor) ?? "Purple";
  const m2 = (params.get("m2") as MentorColor) ?? "Blue";

  const [rows, setRows] = useState<MentorCsvRow[]>([]);
  const [mentorText, setMentorText] = useState(
    "좋습니다. 지금 마음의 결을 들려주시면, 천천히 함께 풀어보겠습니다."
  );
  const [displayedText, setDisplayedText] = useState("");
  const [userText, setUserText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [sttError, setSttError] = useState("");
  const [apiError, setApiError] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  const recognitionRef = useRef<SpeechRecognitionType>(null);
  const transcriptBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const isThinkingRef = useRef(false);
  const lastSentTextRef = useRef("");
  const lastSentAtRef = useRef(0);

  useEffect(() => {
    fetch("/mentors.csv")
      .then((res) => res.text())
      .then((text) => setRows(parseMentorsCsv(text)))
      .catch(() => setRows([]));
  }, []);

  const matchedRow = useMemo(() => {
    const key1 = HEX_TO_COLOR[normalizeHex(c1)] ?? m1;
    const key2 = HEX_TO_COLOR[normalizeHex(c2)] ?? m2;
    return (
      rows.find((row) => {
        const a = row.color1.trim();
        const b = row.color2.trim();
        return (a === key1 && b === key2) || (a === key2 && b === key1);
      }) ?? null
    );
  }, [rows, c1, c2, m1, m2]);

  const selectedMentor = useMemo(() => {
    const key1 = HEX_TO_COLOR[normalizeHex(c1)] ?? m1;
    const key2 = HEX_TO_COLOR[normalizeHex(c2)] ?? m2;
    return (
      findMentorForColors(key1, key2) ?? {
        mentorName: "E.M.I.T Mentor",
        coreExperienceInsight: "당신의 감정은 언제나 이해받을 가치가 있습니다.",
      }
    );
  }, [c1, c2, m1, m2]);

  const mentorPersonality = useMemo(
    () =>
      matchedRow?.tonePersonality ??
      "차분하고 통찰력 있게 공감하는 멘토",
    [matchedRow]
  );

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.sessionStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Message[];
      if (Array.isArray(parsed) && parsed.length) {
        setMessages(parsed);
      }
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayedText(mentorText.slice(0, i));
      if (i >= mentorText.length) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, [mentorText]);

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
          setAudioLevel((prev) => prev * 0.72 + Math.min(1, rms * 3.4) * 0.28);
          rafRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        setSttError("마이크 권한이 필요합니다.");
      }
    };

    setupAudio();
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const resetBuffers = () => {
    transcriptBufferRef.current = "";
    interimBufferRef.current = "";
    setUserText("");
  };

  const sendCurrentSpeech = async (forced?: string) => {
    const text = (forced ?? `${transcriptBufferRef.current} ${interimBufferRef.current}`)
      .trim()
      .replace(/\s+/g, " ");
    if (!text || isThinkingRef.current) return;
    if (lastSentTextRef.current === text && Date.now() - lastSentAtRef.current < 2500) {
      resetBuffers();
      return;
    }
    lastSentTextRef.current = text;
    lastSentAtRef.current = Date.now();
    resetBuffers();
    setUserText(text);
    setIsThinking(true);
    setApiError("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          mentorNameKr: matchedRow?.mentorNameKr ?? selectedMentor.mentorName,
          mentorNameEn: matchedRow?.mentorNameEn ?? selectedMentor.mentorName,
          color1: n1,
          color2: n2,
          tonePersonality: mentorPersonality,
          coreExperienceInsight: selectedMentor.coreExperienceInsight,
          selectionReason:
            matchedRow?.selectionReason ?? selectedMentor.coreExperienceInsight,
          mission:
            matchedRow?.mission ??
            "이번 대화에서 감정의 원인을 구조적으로 이해하고 다음 행동을 설계합니다.",
          messages: [],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setApiError(String(data?.error ?? `HTTP ${res.status}`));
        setMentorText("잠시 연결이 불안정합니다. 다시 한 번 말씀해 주시겠어요?");
      } else {
        const reply = String(data?.reply ?? "").trim();
        setMentorText(reply || "말씀 감사합니다. 지금 감정의 결을 더 함께 살펴보겠습니다.");
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch {
      setApiError("네트워크 오류 또는 API 연결 실패");
      setMentorText("연결이 잠시 끊겼습니다. 다시 한 번 말씀해 주시면 이어가겠습니다.");
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    const anyWindow = window as any;
    const SpeechRecognition = anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttError("현재 브라우저가 Web Speech API를 지원하지 않습니다.");
      return;
    }
    const recognition: SpeechRecognitionType = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      setSttError("");
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const chunk = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += chunk;
        } else {
          interimTranscript += chunk;
        }
      }
      transcriptBufferRef.current = `${transcriptBufferRef.current} ${finalTranscript}`.trim();
      interimBufferRef.current = interimTranscript.trim();
      const currentFullText = `${transcriptBufferRef.current} ${interimBufferRef.current}`
        .trim()
        .replace(/\s+/g, " ");

      if (currentFullText) setUserText(currentFullText);

      if (currentFullText) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          sendCurrentSpeech(currentFullText);
          transcriptBufferRef.current = "";
          interimBufferRef.current = "";
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      const err = String(event?.error ?? "음성 인식 오류");
      if (err !== "aborted") setSttError(err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const pending = `${transcriptBufferRef.current} ${interimBufferRef.current}`.trim();
      if (pending && !isThinkingRef.current) sendCurrentSpeech(pending);
    };

    recognitionRef.current = recognition;
    return () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    };
  }, [matchedRow, selectedMentor, n1, n2, mentorPersonality]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      resetBuffers();
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // noop
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  };

  const extractSummaryQuote = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const special = trimmed
      .split("\n")
      .map((v) => v.trim())
      .find((v) => v.startsWith("오늘의 문장:"));
    if (special) return special.replace("오늘의 문장:", "").trim();
    return trimmed.split(/[.!?]/)[0]?.trim() ?? trimmed;
  };

  const handleNativeShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    setShareStatus("");
    try {
      const title = `E.M.I.T: ${(matchedRow?.mentorNameKr ?? selectedMentor.mentorName)}의 위로`;
      const text = `[${n1} + ${n2}] 조합의 당신을 위한 한마디: ${extractSummaryQuote(mentorText)}`;
      const url = typeof window !== "undefined" ? window.location.href : "";
      const payload = { title, text, url };
      const canShare = navigator.canShare ? navigator.canShare(payload) : true;
      if (typeof navigator.share === "function" && canShare) {
        await navigator.share(payload);
        setShareStatus("공유가 완료되었습니다.");
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        setShareStatus("브라우저 공유를 지원하지 않아 링크를 복사했습니다.");
      }
    } catch {
      setShareStatus("공유에 실패했습니다.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleGoBack = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // noop
    }
    router.push("/emotion");
  };

  const handleEndJourney = async () => {
    if (!messages.length || isEnding) return;
    setIsEnding(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorNameKr: matchedRow?.mentorNameKr ?? selectedMentor.mentorName,
          mentorNameEn: matchedRow?.mentorNameEn ?? selectedMentor.mentorName,
          color1: n1,
          color2: n2,
          messages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(String(data?.error ?? `HTTP ${res.status}`));
      if (data?.id) {
        router.push(`/share/${data.id}`);
      } else {
        throw new Error("invalid summarize response");
      }
    } catch {
      setApiError("대화 요약 생성에 실패했습니다.");
    } finally {
      setIsEnding(false);
    }
  };

  const waveformBars = Array.from({ length: 24 }, (_, i) => i);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040611] via-[#06020D] to-[#020205]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(130,75,255,0.42),transparent_58%),radial-gradient(circle_at_24%_78%,rgba(56,189,248,0.28),transparent_62%)]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/20 disabled:opacity-60"
            aria-label="색 선택 화면으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isSharing}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/20"
            aria-label="이 여정 공유하기"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 flex justify-center">
          <button
            type="button"
            onClick={handleEndJourney}
            disabled={isEnding || messages.length === 0}
            className="rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[0.72rem] font-semibold tracking-[0.08em] text-white/90 backdrop-blur-md transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isEnding ? "요약 생성 중..." : "여정 종료"}
          </button>
        </div>

        <div className="mb-4 mt-2 flex w-full justify-center text-center sm:mb-6">
          <div className="relative max-w-2xl">
            <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-[0_18px_45px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-6 sm:py-4 sm:text-base">
              <div className="max-h-24 overflow-y-auto whitespace-pre-wrap leading-6 text-white/95">
                {displayedText}
                {isThinking && (
                  <span className="ml-1 inline-flex items-center gap-[2px] align-middle">
                    <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/80 animate-pulse" />
                    <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/60 animate-pulse [animation-delay:0.12s]" />
                    <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/40 animate-pulse [animation-delay:0.24s]" />
                  </span>
                )}
              </div>
            </div>
            <div className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-[2px] rotate-45 border-b border-r border-white/20 bg-white/10 backdrop-blur-md" />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center">
            <p className="mb-2 rounded-full border border-white/25 bg-white/10 px-4 py-1 text-[0.72rem] font-semibold tracking-[0.14em] text-white/90 backdrop-blur-md">
              {matchedRow?.mentorNameKr ?? selectedMentor.mentorName}
            </p>
            <motion.div
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
          </div>
        </div>

        {userText && (
          <p className="mb-2 text-center text-[0.75rem] text-white/60 sm:text-sm">
            감지된 음성: <span className="text-white/85">{userText}</span>
          </p>
        )}

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
                  backgroundColor: isThinking ? "#c084fc" : "#67e8f9",
                  opacity: isListening ? 0.9 : 0.45,
                }}
                transition={{ duration: 0.18, ease: "linear" }}
              />
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={toggleMic}
            className="h-14 w-14 rounded-full border border-violet-200/70 bg-violet-100 text-xl shadow-[0_8px_20px_rgba(167,139,250,0.55)] transition hover:scale-105"
          >
            {isListening ? "🎙️" : "🎤"}
          </button>
        </div>

        <p className="mt-3 text-center text-[0.7rem] text-white/55">
          {isListening
            ? "음성 감지 중... 잠시 멈추면 자동으로 멘토에게 전달됩니다."
            : "대기 중... 마이크 버튼을 눌러 대화를 시작하세요."}
        </p>
        {(sttError || apiError) && (
          <p className="mt-1 text-center text-[0.68rem] text-rose-300/90">
            {sttError ? `STT: ${sttError}` : `API: ${apiError}`}
          </p>
        )}
        {shareStatus && (
          <p className="mt-1 text-center text-[0.72rem] text-cyan-200/95">{shareStatus}</p>
        )}
      </section>
    </main>
  );
}

export default function MentorChatPage() {
  return (
    <Suspense>
      <MentorChatInner />
    </Suspense>
  );
}

