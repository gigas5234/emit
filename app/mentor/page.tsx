"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { findMentorForColors, MentorColor } from "../emotion/mentors";

type SpeechRecognitionType =
  | (any & { continuous?: boolean; interimResults?: boolean })
  | null;

type Message = { role: "user" | "assistant"; content: string };

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

const introListVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.24 },
  },
};

const introItemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
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

function TypingText({
  text,
  speed = 18,
  className = "",
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [visible, setVisible] = useState("");
  useEffect(() => {
    setVisible("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setVisible(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return <p className={className}>{visible}</p>;
}

function MentorInner() {
  const params = useSearchParams();
  const c1 = params.get("c1") ?? "#7C3AED";
  const c2 = params.get("c2") ?? "#3B82F6";
  const n1 = params.get("n1") ?? "감정 A";
  const n2 = params.get("n2") ?? "감정 B";
  const m1 = (params.get("m1") as MentorColor) ?? "Purple";
  const m2 = (params.get("m2") as MentorColor) ?? "Blue";

  const c1Key = HEX_TO_COLOR[normalizeHex(c1)];
  const c2Key = HEX_TO_COLOR[normalizeHex(c2)];
  const mentorKey1 = c1Key ?? m1;
  const mentorKey2 = c2Key ?? m2;

  const selectedMentor = useMemo(
    () =>
      findMentorForColors(mentorKey1, mentorKey2) ?? {
        mentorName: "E.M.I.T Mentor",
        occupation: "Emotional Guide",
        coreExperienceInsight: "당신의 감정은 언제나 이해받을 가치가 있습니다.",
        mixedColorResult: "Resonance_Tone",
      },
    [mentorKey1, mentorKey2]
  );

  const mentorPersonality = useMemo(
    () =>
      `${selectedMentor.occupation}의 톤으로 차분하고 통찰력 있게 답변하며, 핵심 인사이트는 "${selectedMentor.coreExperienceInsight}"를 반영한다.`,
    [selectedMentor]
  );

  const [mentorRows, setMentorRows] = useState<MentorCsvRow[]>([]);
  const [isIntroFinished, setIsIntroFinished] = useState(false);
  const [mentorText, setMentorText] = useState(
    "준비되면 당신의 이야기를 들려주세요. 감정의 결을 함께 읽어볼게요."
  );
  const [displayedText, setDisplayedText] = useState("");
  const [userText, setUserText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "준비되면 당신의 이야기를 들려주세요. 감정의 결을 함께 읽어볼게요.",
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sttError, setSttError] = useState("");
  const [apiError, setApiError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionType>(null);
  const messagesRef = useRef<Message[]>(messages);
  const transcriptBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isThinkingRef = useRef(false);
  const audioLevelRef = useRef(0);
  const liveThreshold = 0.07;

  useEffect(() => {
    fetch("/mentors.csv")
      .then((res) => res.text())
      .then((text) => setMentorRows(parseMentorsCsv(text)))
      .catch(() => setMentorRows([]));
  }, []);

  const matchedRow = useMemo(() => {
    const key1 = c1Key ?? m1;
    const key2 = c2Key ?? m2;
    return (
      mentorRows.find((row) => {
        const a = row.color1.trim();
        const b = row.color2.trim();
        return (a === key1 && b === key2) || (a === key2 && b === key1);
      }) ?? null
    );
  }, [mentorRows, c1Key, c2Key, m1, m2]);

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

  const flushTranscriptToApi = async (forcedText?: string) => {
    const text = (forcedText ?? `${transcriptBufferRef.current} ${interimBufferRef.current}`)
      .trim()
      .replace(/\s+/g, " ");
    if (!text || isThinkingRef.current) return;
    transcriptBufferRef.current = "";
    interimBufferRef.current = "";
    setUserText(text);

    const nextMessages: Message[] = [...messagesRef.current, { role: "user", content: text }];
    setMessages(nextMessages);
    setIsThinking(true);
    setApiError("");

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          mentorName: matchedRow?.mentorNameKr ?? selectedMentor.mentorName,
          personality: mentorPersonality,
          coreInsight: matchedRow?.mission ?? selectedMentor.coreExperienceInsight,
          messages: nextMessages,
        }),
      });

      let reply = "";
      if (res.ok) {
        const data = await res.json();
        reply =
          data?.reply ??
          "좋은 질문이에요. 이 감정의 뿌리를 함께 찾아보면 생각보다 선명한 답을 만나게 될 거예요.";
      } else {
        const err = await res.json().catch(() => null);
        setApiError(String(err?.error ?? `HTTP ${res.status}`));
        reply = "잠시 연결이 불안정하지만, 저는 계속 당신의 이야기를 듣고 있어요.";
      }
      setMentorText(reply);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setApiError("네트워크 오류 또는 API 연결 실패");
      const fallback = "좋아요, 지금 숨을 한 번 고르고 감정의 이름을 다시 천천히 불러볼까요?";
      setMentorText(fallback);
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(mentorText.slice(0, i));
      if (i >= mentorText.length) clearInterval(interval);
    }, 28);
    return () => clearInterval(interval);
  }, [mentorText]);

  useEffect(() => {
    let mounted = true;
    const setupAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) return;
        setSttError("");
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
        setSttError("마이크 권한이 필요합니다.");
      }
    };
    setupAudio();
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSilenceTimer();
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    const anyWindow = window as any;
    const SpeechRecognition = anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      setSttError("현재 브라우저가 Web Speech API를 지원하지 않습니다.");
      return;
    }
    const recognition: SpeechRecognitionType = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      setSttError("");
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
      interimBufferRef.current = interim.trim();
      const preview = `${transcriptBufferRef.current} ${interimBufferRef.current}`.trim();
      if (preview) setUserText(preview);
      if (preview) {
        stopSilenceTimer();
        silenceTimerRef.current = setTimeout(() => flushTranscriptToApi(preview), 1000);
      }
    };

    recognition.onerror = (event: any) => {
      setSttError(String(event?.error ?? "음성 인식 오류"));
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const pending = `${transcriptBufferRef.current} ${interimBufferRef.current}`.trim();
      if (pending && !isThinkingRef.current) flushTranscriptToApi(pending);
      if (
        isIntroFinished &&
        audioLevelRef.current > liveThreshold * 0.8 &&
        !isThinkingRef.current
      ) {
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
  }, [isIntroFinished]);

  useEffect(() => {
    if (!isIntroFinished) return;
    if (!sttSupported || !recognitionRef.current || isListening || isThinking) return;
    if (audioLevel < liveThreshold) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // noop
    }
  }, [audioLevel, isIntroFinished, isListening, isThinking, sttSupported]);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // noop
    }
  };

  const waveformBars = Array.from({ length: 24 }, (_, i) => i);
  const waveColor = isThinking ? "#c084fc" : "#67e8f9";

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#040611] via-[#06020D] to-[#020205]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(130,75,255,0.42),transparent_58%),radial-gradient(circle_at_24%_78%,rgba(56,189,248,0.28),transparent_62%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8">
        <AnimatePresence mode="wait">
          {!isIntroFinished ? (
            <motion.section
              key="encounter"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex min-h-[88vh] flex-col"
            >
              <p className="text-center text-sm tracking-[0.08em] text-white/80 sm:text-base">
                감정의 주파수가 일치하는 멘토를 찾았습니다.
              </p>

              <div className="mt-6 grid flex-1 grid-cols-1 items-center gap-6 lg:grid-cols-[1.1fr_1fr_1.1fr]">
                <motion.div
                  variants={introListVariants}
                  initial="hidden"
                  animate="show"
                  className="order-2 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md lg:order-1"
                >
                  <motion.div variants={introItemVariants} className="mb-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-violet-200">
                      Mentor
                    </p>
                    <TypingText
                      text={`${matchedRow?.mentorNameKr ?? "멘토"} (${matchedRow?.mentorNameEn ?? selectedMentor.mentorName})`}
                      className="mt-1 text-sm leading-relaxed text-white/90"
                    />
                  </motion.div>

                  <motion.div variants={introItemVariants}>
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-violet-200">
                      Context
                    </p>
                    <TypingText
                      text={`${n1}(${c1})와 ${n2}(${c2})가 만나 탄생한 ${selectedMentor.mixedColorResult}의 심리 상태를 분석합니다.`}
                      className="mt-1 text-[0.82rem] leading-relaxed text-white/85"
                    />
                  </motion.div>
                </motion.div>

                <div className="order-1 flex items-center justify-center lg:order-2">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                  >
                    <div className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-violet-400/20 blur-3xl" />
                    <Image
                      src="/mentors/sample.png"
                      alt="Mentor figure"
                      width={380}
                      height={380}
                      priority
                      className="h-64 w-auto sm:h-80"
                    />
                  </motion.div>
                </div>

                <motion.div
                  variants={introListVariants}
                  initial="hidden"
                  animate="show"
                  className="order-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md"
                >
                  <motion.div variants={introItemVariants} className="mb-3">
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-violet-200">
                      Why
                    </p>
                    <TypingText
                      text={
                        matchedRow?.selectionReason ??
                        selectedMentor.coreExperienceInsight
                      }
                      className="mt-1 text-[0.82rem] leading-relaxed text-white/85"
                    />
                  </motion.div>
                  <motion.div variants={introItemVariants}>
                    <p className="text-[0.68rem] uppercase tracking-[0.2em] text-violet-200">
                      Mission
                    </p>
                    <TypingText
                      text={
                        matchedRow?.mission ??
                        "이번 대화에서 감정의 원인을 구조적으로 이해하고 다음 행동을 설계합니다."
                      }
                      className="mt-1 text-[0.82rem] leading-relaxed text-white/85"
                    />
                  </motion.div>
                </motion.div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsIntroFinished(true)}
                  className="rounded-2xl border border-violet-300/30 bg-violet-400/20 px-6 py-3 text-sm font-semibold tracking-[0.06em] text-white shadow-[0_0_24px_rgba(167,139,250,0.45)] transition hover:scale-[1.02] hover:bg-violet-400/30"
                >
                  대화 시작하기
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.section
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[88vh] flex-col"
            >
              <div className="mb-4 mt-2 flex w-full justify-center text-center sm:mb-6">
                <div className="relative max-w-2xl">
                  <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm shadow-[0_18px_45px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-6 sm:py-4 sm:text-base">
                    {displayedText}
                    {isThinking && (
                      <span className="ml-1 inline-flex items-center gap-[2px] align-middle">
                        <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/80 animate-pulse" />
                        <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/60 animate-pulse [animation-delay:0.12s]" />
                        <span className="inline-block h-[3px] w-[3px] rounded-full bg-white/40 animate-pulse [animation-delay:0.24s]" />
                      </span>
                    )}
                  </div>
                  <div className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-[2px] rotate-45 border-b border-r border-white/20 bg-white/10 backdrop-blur-md" />
                </div>
              </div>

              <div className="relative flex flex-1 items-center justify-center">
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
                        backgroundColor: waveColor,
                        opacity: isListening ? 0.9 : 0.45,
                      }}
                      transition={{ duration: 0.18, ease: "linear" }}
                    />
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={toggleMic}
                  className="h-14 w-14 rounded-full border border-white/30 bg-white/10 text-xl shadow-[0_0_24px_rgba(125,211,252,0.45)] backdrop-blur-md transition hover:scale-105"
                >
                  {isListening ? "🎙️" : "🎤"}
                </button>
              </div>

              <p className="mt-3 text-center text-[0.7rem] text-white/55">
                {sttSupported
                  ? isListening
                    ? "음성 감지 중... 잠시 멈추면 자동으로 멘토에게 전달됩니다."
                    : "대기 중... 목소리가 감지되면 자동으로 라이브 대화를 시작합니다."
                  : "이 브라우저는 Web Speech API를 지원하지 않습니다."}
              </p>
              {(sttError || apiError) && (
                <p className="mt-1 text-center text-[0.68rem] text-rose-300/90">
                  {sttError ? `STT: ${sttError}` : `API: ${apiError}`}
                </p>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </div>
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


