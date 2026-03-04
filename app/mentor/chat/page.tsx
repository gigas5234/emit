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
type DebugLog = { time: string; type: "info" | "ok" | "warn" | "err"; msg: string };

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
  const [speechDetected, setSpeechDetected] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionType>(null);
  const transcriptBufferRef = useRef("");
  const interimBufferRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isThinkingRef = useRef(false);
  const lastSentTextRef = useRef("");
  const lastSentAtRef = useRef(0);
  // Track how many results we've already sent — prevents re-processing old results
  const sentUpToIndexRef = useRef(0);
  const lastResultsLengthRef = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const shouldListenRef = useRef(false);
  const sendSpeechRef = useRef<((forced?: string) => Promise<void>) | null>(null);
  const addLogRef = useRef<((type: DebugLog["type"], msg: string) => void) | null>(null);

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
    messagesRef.current = messages;
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const resetBuffers = () => {
    transcriptBufferRef.current = "";
    interimBufferRef.current = "";
    // NOTE: sentUpToIndexRef is intentionally NOT reset here.
    // It tracks consumed results across the session and must only reset on session start/stop.
    setUserText("");
  };

  const sendCurrentSpeech = async (forced?: string) => {
    const text = (forced ?? `${transcriptBufferRef.current} ${interimBufferRef.current}`)
      .trim()
      .replace(/\s+/g, " ");
    if (!text) {
      addLogRef.current?.("warn", "sendCurrentSpeech: 텍스트 없음 — 전송 건너뜀");
      return;
    }
    if (isThinkingRef.current) {
      addLogRef.current?.("warn", "sendCurrentSpeech: AI 응답 중 — 전송 대기");
      return;
    }
    if (lastSentTextRef.current === text && Date.now() - lastSentAtRef.current < 2500) {
      addLogRef.current?.("warn", `sendCurrentSpeech: 중복 전송 방지 ("${text}")`);
      resetBuffers();
      return;
    }
    addLogRef.current?.("info", `📤 API 전송: "${text}" (히스토리 ${messagesRef.current.length}개)`);
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
          messages: messagesRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = String(data?.error ?? `HTTP ${res.status}`);
        const errDetails = String(data?.details ?? "");
        addLogRef.current?.("err", `API 오류 ${res.status}: ${errMsg}${errDetails ? ` — ${errDetails}` : ""}`);
        setApiError(errDetails ? `${errMsg}: ${errDetails}` : errMsg);
        setMentorText("잠시 연결이 불안정합니다. 다시 한 번 말씀해 주시겠어요?");
      } else {
        const reply = String(data?.reply ?? "").trim();
        addLogRef.current?.("ok", `📥 AI 응답 수신 (${reply.length}자)`);
        setMentorText(reply || "말씀 감사합니다. 지금 감정의 결을 더 함께 살펴보겠습니다.");
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (e: any) {
      const msg = e?.message ?? "알 수 없는 오류";
      addLogRef.current?.("err", `네트워크 오류: ${msg}`);
      setApiError("네트워크 오류 또는 API 연결 실패");
      setMentorText("연결이 잠시 끊겼습니다. 다시 한 번 말씀해 주시면 이어가겠습니다.");
    } finally {
      setIsThinking(false);
    }
  };

  // Always keep refs pointing to the latest functions
  sendSpeechRef.current = sendCurrentSpeech;
  addLogRef.current = (type: DebugLog["type"], msg: string) => {
    const time = new Date().toLocaleTimeString("ko-KR", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setDebugLogs((prev) => [...prev.slice(-29), { time, type, msg }]);
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
    recognition.maxAlternatives = 1;

    addLogRef.current?.("ok", "SpeechRecognition 객체 생성 완료 (ko-KR)");

    recognition.onstart = () => {
      addLogRef.current?.("ok", "▶ onstart — 인식 시작됨");
    };

    recognition.onaudiostart = () => {
      addLogRef.current?.("ok", "🎵 onaudiostart — STT 오디오 수신 중 ✓");
    };

    recognition.onaudioend = () => {
      addLogRef.current?.("info", "🔕 onaudioend — STT 오디오 수신 종료");
    };

    recognition.onspeechstart = () => {
      setSpeechDetected(true);
      addLogRef.current?.("ok", "🎤 onspeechstart — 발화 감지됨 ✓");
    };

    recognition.onspeechend = () => {
      setSpeechDetected(false);
      addLogRef.current?.("info", "🔇 onspeechend — 발화 종료");
    };

    recognition.onnomatch = (event: any) => {
      // Try to rescue low-confidence alternatives from the event
      let rescued = "";
      try {
        for (let i = 0; i < (event?.results?.length ?? 0); i += 1) {
          const t = event.results[i][0]?.transcript?.trim();
          const conf = event.results[i][0]?.confidence ?? 0;
          if (t) {
            rescued = t;
            addLogRef.current?.("warn", `onnomatch 저신뢰도 결과: "${t}" (${(conf * 100).toFixed(0)}%)`);
            break;
          }
        }
      } catch { /* noop */ }

      if (!rescued) {
        addLogRef.current?.("warn", "⚠ onnomatch — 인식 결과 없음 (오디오 품질 또는 네트워크 확인)");
      }

      // Fall back to interim buffer if available
      const pending = rescued || `${transcriptBufferRef.current} ${interimBufferRef.current}`.trim();
      if (pending && !isThinkingRef.current) {
        addLogRef.current?.("info", `onnomatch → 전송: "${pending}"`);
        // Advance index and clear buffers BEFORE sending to prevent onend double-send
        sentUpToIndexRef.current = lastResultsLengthRef.current;
        transcriptBufferRef.current = "";
        interimBufferRef.current = "";
        sendSpeechRef.current?.(pending);
      }
    };

    recognition.onresult = (event: any) => {
      setSttError("");
      lastResultsLengthRef.current = event.results.length;

      // Pass 1: consume any NEW final results (advance sentUpToIndexRef as we go)
      // Finals are the source of truth — accumulate them into transcriptBufferRef
      for (let i = sentUpToIndexRef.current; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          const chunk = (event.results[i][0]?.transcript ?? "").trim();
          const conf = event.results[i][0]?.confidence != null
            ? ` (${(event.results[i][0].confidence * 100).toFixed(0)}%)`
            : "";
          if (chunk) {
            transcriptBufferRef.current = transcriptBufferRef.current
              ? `${transcriptBufferRef.current} ${chunk}`
              : chunk;
            addLogRef.current?.("ok", `✅ 최종: "${chunk}"${conf}`);
          }
          sentUpToIndexRef.current = i + 1; // mark this result as consumed
        }
      }

      // Pass 2: get the current interim result (latest non-final, for display only)
      // Interim is NEVER sent — it's only shown so the user gets real-time feedback
      let interimText = "";
      if (event.results.length > sentUpToIndexRef.current) {
        const last = event.results[event.results.length - 1];
        if (!last.isFinal) {
          interimText = (last[0]?.transcript ?? "").trim();
          interimBufferRef.current = interimText;
          if (interimText) addLogRef.current?.("info", `⏳ 중간(표시용): "${interimText}"`);
        }
      } else {
        interimBufferRef.current = "";
      }

      // Display: show only the LATEST text to avoid showing accumulated duplicates.
      // Priority: current interim (real-time) > latest final chunk > nothing
      // This way the user sees just what's being recognized right now, not the whole history.
      const displayText = (interimText || transcriptBufferRef.current).replace(/\s+/g, " ").trim();
      if (displayText) setUserText(displayText);

      // Silence timer: reset on every result, fires only after the user stops speaking
      if (displayText) {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          const toSend = [transcriptBufferRef.current, interimBufferRef.current]
            .filter(Boolean).join(" ").replace(/\s+/g, " ");
          if (!toSend) return;
          addLogRef.current?.("info", `⏱ 침묵 감지 → API 전송: "${toSend}"`);
          // Consume the interim result index too so it's not re-processed
          sentUpToIndexRef.current = lastResultsLengthRef.current;
          sendSpeechRef.current?.(toSend);
          transcriptBufferRef.current = "";
          interimBufferRef.current = "";
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      const err = String(event?.error ?? "음성 인식 오류");
      // aborted / no-speech are non-fatal — auto-restart if user still wants to listen
      if (err === "aborted" || err === "no-speech") {
        addLogRef.current?.("warn", `⚠ onerror(${err}) — 자동 재시작 시도`);
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current) {
              try { recognition.start(); } catch { /* noop */ }
            }
          }, 300);
        }
        return;
      }
      addLogRef.current?.("err", `❌ onerror: ${err}`);
      setSttError(err);
      setIsListening(false);
      shouldListenRef.current = false;
    };

    recognition.onend = () => {
      const pending = `${transcriptBufferRef.current} ${interimBufferRef.current}`.trim();
      addLogRef.current?.("warn", `■ onend — 미전송 텍스트: "${pending || "(없음)"}", shouldListen=${shouldListenRef.current}`);
      if (pending && !isThinkingRef.current) sendSpeechRef.current?.(pending);

      // Auto-restart recognition if user still wants to be listening
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try {
              // New session: reset consumed index so fresh results are processed from 0
              sentUpToIndexRef.current = 0;
              lastResultsLengthRef.current = 0;
              recognition.start();
              addLogRef.current?.("info", "↺ recognition 재시작 (index 리셋)");
            } catch {
              // noop
            }
          }
        }, 300);
      } else {
        setSpeechDetected(false);
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    return () => {
      shouldListenRef.current = false;
      try {
        recognition.abort();
      } catch {
        // noop
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      addLogRef.current?.("err", "❌ startListening: recognitionRef가 null");
      return;
    }
    shouldListenRef.current = true;
    // Reset session-level index on new mic session
    sentUpToIndexRef.current = 0;
    lastResultsLengthRef.current = 0;
    resetBuffers();
    try {
      recognitionRef.current.start();
      setIsListening(true);
      addLogRef.current?.("info", "▶ recognition.start() 호출됨");
    } catch (e: any) {
      addLogRef.current?.("warn", `start() 예외: ${e?.message ?? e} (이미 시작 중일 수 있음)`);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    shouldListenRef.current = false;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setSpeechDetected(false);
    // Reset index when session ends
    sentUpToIndexRef.current = 0;
    lastResultsLengthRef.current = 0;
    try {
      recognitionRef.current.stop();
      addLogRef.current?.("info", "■ recognition.stop() 호출됨");
    } catch {
      // noop
    }
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
            // Each bar gets a unique rhythm via prime-multiplied offsets
            const seed = (bar * 37) % 100;
            const duration = speechDetected
              ? 0.18 + (seed % 30) / 100          // fast: 0.18–0.48s
              : isListening
              ? 0.7 + (seed % 50) / 100            // idle: 0.7–1.2s
              : 1.4 + (seed % 60) / 100;           // off: 1.4–2.0s
            const delay = (seed % 40) / 100;
            const loHgt = speechDetected ? `${15 + seed % 15}%` : `${10 + seed % 8}%`;
            const hiHgt = speechDetected
              ? `${55 + seed % 35}%`
              : isListening ? `${22 + seed % 14}%` : `${14 + seed % 6}%`;
            return (
              <motion.span
                key={bar}
                className="block w-1 rounded-full"
                animate={{
                  height: [loHgt, hiHgt, loHgt],
                  backgroundColor: isThinking ? "#c084fc" : speechDetected ? "#38bdf8" : "#67e8f9",
                  opacity: speechDetected ? 0.95 : isListening ? 0.65 : 0.3,
                }}
                transition={{
                  height: { duration, repeat: Infinity, ease: "easeInOut", delay },
                  backgroundColor: { duration: 0.3 },
                  opacity: { duration: 0.3 },
                }}
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
            {sttError
              ? `STT 오류: ${sttError === "not-allowed" ? "마이크 권한이 거부됨 (브라우저 설정 확인)" : sttError === "network" ? "네트워크 오류 — 인터넷 연결 확인" : sttError === "service-not-allowed" ? "이 브라우저/환경에서 STT가 비허용됨 (HTTP는 불가, HTTPS 필요)" : sttError}`
              : `API 오류: ${apiError}`}
          </p>
        )}
        {shareStatus && (
          <p className="mt-1 text-center text-[0.72rem] text-cyan-200/95">{shareStatus}</p>
        )}

        {/* Debug Panel */}
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowDebug((v) => !v)}
            className="mx-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[0.6rem] text-white/40 transition hover:bg-white/10 hover:text-white/60"
          >
            🐛 진단 로그 {showDebug ? "닫기" : `열기 (${debugLogs.length})`}
          </button>
          {showDebug && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-white/10 bg-black/70 p-3 backdrop-blur-md">
              {debugLogs.length === 0 ? (
                <p className="text-center font-mono text-[0.6rem] text-white/30">로그 없음 — 마이크 버튼을 눌러보세요</p>
              ) : (
                <div className="flex flex-col gap-0.5 font-mono text-[0.58rem]">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="flex gap-1.5">
                      <span className="shrink-0 text-white/30">{log.time}</span>
                      <span
                        className={
                          log.type === "ok" ? "text-emerald-300/90" :
                          log.type === "err" ? "text-rose-300/90" :
                          log.type === "warn" ? "text-amber-300/80" :
                          "text-cyan-200/70"
                        }
                      >
                        {log.msg}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {debugLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDebugLogs([])}
                  className="mt-2 w-full rounded-full border border-white/10 py-0.5 text-[0.55rem] text-white/25 hover:text-white/50"
                >
                  로그 지우기
                </button>
              )}
            </div>
          )}
        </div>
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

