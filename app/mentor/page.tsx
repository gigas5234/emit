"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { findMentorForColors, MentorColor } from "../emotion/mentors";
import { Share2 } from "lucide-react";

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

const MIXED_COLOR_LABEL_KR: Record<string, string> = {
  Muted_Violet: "뮤티드 바이올렛",
  Warm_Orange: "웜 오렌지",
  Deep_Magenta: "딥 마젠타",
  Ashen_Red: "애쉬 레드",
  Earthy_Brown: "어시 브라운",
  Fiery_Amber: "파이어리 앰버",
  Dark_Crimson: "다크 크림슨",
  Soft_Green: "소프트 그린",
  Indigo_Mist: "인디고 미스트",
  Dust_Blue: "더스트 블루",
  Teal_Blue: "틸 블루",
  Burnt_Sienna: "번트 시에나",
  Midnight_Blue: "미드나잇 블루",
  Pale_Gold: "펄 골드",
  Silver_Yellow: "실버 옐로우",
  Lime_Gold: "라임 골드",
  Sunset_Orange: "선셋 오렌지",
  Ethereal_Blue: "에테리얼 블루",
  Cloudy_Purple: "클라우디 퍼플",
  Sage_Purple: "세이지 퍼플",
  Vibrant_Plum: "바이브런트 플럼",
  Cosmic_Indigo: "코스믹 인디고",
  Olive_Gray: "올리브 그레이",
  Steel_Orange: "스틸 오렌지",
  Deep_Charcoal: "딥 차콜",
  Rusty_Copper: "러스티 코퍼",
  Dark_Teal: "다크 틸",
  Stormy_Blue: "스톰 블루",
  Resonance_Tone: "공명 톤",
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

function hasFinalConsonant(word: string) {
  const target = word.trim();
  if (!target) return false;
  const code = target.charCodeAt(target.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function pickParticle(word: string, withBatchim: string, withoutBatchim: string) {
  return hasFinalConsonant(word) ? withBatchim : withoutBatchim;
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
  const [liveModeEnabled, setLiveModeEnabled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [sttError, setSttError] = useState("");
  const [apiError, setApiError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionType>(null);
  const messagesRef = useRef<Message[]>(messages);
  const transcriptBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const lastSentTextRef = useRef("");
  const lastSentAtRef = useRef(0);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isThinkingRef = useRef(false);
  const isIntroFinishedRef = useRef(false);
  const liveModeEnabledRef = useRef(false);

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

  const mixedColorLabelKr = useMemo(() => {
    return MIXED_COLOR_LABEL_KR[selectedMentor.mixedColorResult] ?? selectedMentor.mixedColorResult;
  }, [selectedMentor.mixedColorResult]);

  const contextLine = useMemo(() => {
    const p1 = pickParticle(n1, "과", "와");
    const p2 = pickParticle(n2, "이", "가");
    return `${n1}${p1} ${n2}${p2} 만나 만들어낸 ${mixedColorLabelKr}의 심리 상태를 분석합니다.`;
  }, [n1, n2, mixedColorLabelKr]);

  useEffect(() => {
    isThinkingRef.current = isThinking;
  }, [isThinking]);

  useEffect(() => {
    isIntroFinishedRef.current = isIntroFinished;
  }, [isIntroFinished]);

  useEffect(() => {
    liveModeEnabledRef.current = liveModeEnabled;
  }, [liveModeEnabled]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const stopSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const resetSpeechBuffers = () => {
    transcriptBufferRef.current = "";
    interimBufferRef.current = "";
    setUserText("");
  };

  const flushTranscriptToApi = async (forcedText?: string) => {
    const text = (forcedText ?? `${transcriptBufferRef.current} ${interimBufferRef.current}`)
      .trim()
      .replace(/\s+/g, " ");
    if (!text || isThinkingRef.current) return;
    if (lastSentTextRef.current === text && Date.now() - lastSentAtRef.current < 2500) {
      resetSpeechBuffers();
      return;
    }
    lastSentTextRef.current = text;
    lastSentAtRef.current = Date.now();
    resetSpeechBuffers();
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
          messages: [],
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
      const err = String(event?.error ?? "음성 인식 오류");
      if (err === "aborted") {
        setSttError("");
        if (
          isIntroFinishedRef.current &&
          liveModeEnabledRef.current &&
          !isThinkingRef.current
        ) {
          setTimeout(() => {
            try {
              recognition.start();
              setIsListening(true);
            } catch {
              // noop
            }
          }, 250);
        }
        return;
      }
      setSttError(err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const pending = `${transcriptBufferRef.current} ${interimBufferRef.current}`.trim();
      if (pending && !isThinkingRef.current) flushTranscriptToApi(pending);
      if (
        isIntroFinishedRef.current &&
        liveModeEnabledRef.current &&
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
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      setLiveModeEnabled(false);
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      resetSpeechBuffers();
      setLiveModeEnabled(true);
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // noop
    }
  };

  const handleEndChat = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // noop
    }
    setLiveModeEnabled(false);
    setIsListening(false);
    setIsIntroFinished(false);
    setShareStatus("대화를 종료했어요. 필요하면 다시 시작해 주세요.");
  };

  const startLiveConversation = async () => {
    setIsIntroFinished(true);
    setLiveModeEnabled(true);
    setSttError("");
    resetSpeechBuffers();
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch {
          // noop
        }
      }, 180);
    } catch {
      setSttError("마이크 권한을 허용해 주세요. 권한이 없으면 STT가 동작하지 않습니다.");
    }
  };

  useEffect(() => {
    // Chat 화면 진입 시 마이크 권한/인식 시작을 한 번 더 보장.
    if (!isIntroFinished || !liveModeEnabled || !recognitionRef.current || isListening) return;
    setTimeout(() => {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        // noop
      }
    }, 220);
  }, [isIntroFinished, liveModeEnabled, isListening]);

  const waveformBars = Array.from({ length: 24 }, (_, i) => i);
  const waveColor = isThinking ? "#c084fc" : "#67e8f9";

  const extractSummaryQuote = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    const specialLine = trimmed
      .split("\n")
      .map((v) => v.trim())
      .find((v) => v.startsWith("오늘의 문장:"));
    if (specialLine) return specialLine.replace("오늘의 문장:", "").trim();
    return trimmed.split(/[.!?]/)[0]?.trim() ?? trimmed;
  };

  const handleNativeShare = async () => {
    // Must be called inside user click handler.
    if (isSharing) return;
    setIsSharing(true);
    setShareStatus("");

    try {
      let summaryQuote = extractSummaryQuote(mentorText);
      if (messagesRef.current.length > 1) {
        const res = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "summary",
            mentorName: matchedRow?.mentorNameKr ?? selectedMentor.mentorName,
            personality: mentorPersonality,
            coreInsight: matchedRow?.mission ?? selectedMentor.coreExperienceInsight,
            messages: messagesRef.current,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          summaryQuote = extractSummaryQuote(String(data?.summary ?? summaryQuote));
        }
      }

      const mentorNameKr = matchedRow?.mentorNameKr ?? selectedMentor.mentorName;
      const title = `E.M.I.T: ${mentorNameKr}의 위로`;
      const text = `[${n1} + ${n2}] 조합의 당신을 위한 한마디: ${summaryQuote || "지금의 감정은 이해받을 가치가 있습니다."}`;
      const url = typeof window !== "undefined" ? window.location.href : "";
      const sharePayload = { title, text, url };

      const canShareFn = navigator.canShare?.bind(navigator);
      const canNativeShare = typeof navigator.share === "function";
      const canPayloadShare = canShareFn ? canShareFn(sharePayload) : true;

      if (canNativeShare && canPayloadShare) {
        await navigator.share(sharePayload);
        setShareStatus("공유가 완료되었습니다.");
      } else {
        await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
        setShareStatus("브라우저 공유를 지원하지 않아 링크를 복사했습니다.");
      }
    } catch {
      try {
        const fallbackUrl = typeof window !== "undefined" ? window.location.href : "";
        await navigator.clipboard.writeText(fallbackUrl);
        setShareStatus("공유가 취소되었거나 실패했습니다. 링크를 복사했습니다.");
      } catch {
        setShareStatus("공유에 실패했습니다. 브라우저 권한을 확인해 주세요.");
      }
    } finally {
      setIsSharing(false);
    }
  };

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
                      text={contextLine}
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
                  onClick={startLiveConversation}
                  className="rounded-2xl border border-violet-200/70 bg-gradient-to-b from-violet-300 to-violet-500 px-6 py-3 text-sm font-semibold tracking-[0.06em] text-[#120822] shadow-[0_8px_30px_rgba(167,139,250,0.65)] transition hover:scale-[1.02] hover:brightness-110"
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
                        backgroundColor: waveColor,
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
              {shareStatus && (
                <p className="mt-1 text-center text-[0.72rem] text-cyan-200/95">
                  {shareStatus}
                </p>
              )}

              <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleEndChat}
                    className="inline-flex min-w-32 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/90 shadow-[0_6px_20px_rgba(0,0,0,0.28)] transition hover:bg-white/20"
                  >
                    대화 종료
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isSharing}
                    className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/95 shadow-[0_6px_20px_rgba(0,0,0,0.28)] transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Share2 className="h-4 w-4" />
                    이 여정 공유하기
                  </button>
                </div>
              </div>
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


