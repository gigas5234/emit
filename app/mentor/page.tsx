"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type SpeechRecognitionType =
  | (any & { continuous?: boolean; interimResults?: boolean })
  | null;

export default function MentorChatPage() {
  const [mentorText, setMentorText] = useState("오늘 당신의 마음, 함께 들여다볼까요?");
  const [displayedText, setDisplayedText] = useState("");
  const [userText, setUserText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionType>(null);

  // Typewriter effect for mentor bubble
  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const text = mentorText;
    const interval = setInterval(() => {
      i += 1;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [mentorText]);

  // Setup Web Speech API
  useEffect(() => {
    if (typeof window === "undefined") return;
    const anyWindow = window as any;
    const SpeechRecognition =
      anyWindow.SpeechRecognition || anyWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSttSupported(false);
      return;
    }
    const recognition: SpeechRecognitionType = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript as string)
        .join(" ");
      setUserText(transcript);
      handleSendToMentor(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const handleSendToMentor = async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userText: text }),
      });
      let reply = "";
      if (res.ok) {
        const data = await res.json();
        reply =
          data?.reply ??
          "지금 당신의 이야기를 충분히 들었어요. 이 감정을 어떻게 바라볼지, 함께 한 걸음씩 정리해 볼까요?";
      } else {
        reply =
          "지금은 연결이 원활하지 않아요. 하지만 당신의 마음이 가볍게 정리될 수 있도록 다시 도와볼게요.";
      }
      setMentorText(reply);
    } catch {
      setMentorText(
        "지금은 제가 잠시 생각을 정리하는 중이에요. 그래도 당신의 감정은 분명 의미가 있고, 함께 천천히 풀어 볼 수 있어요."
      );
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    if (!sttSupported || !recognitionRef.current) {
      alert("이 브라우저에서는 음성 인식을 사용할 수 없습니다.");
      return;
    }
    try {
      setIsListening(true);
      recognitionRef.current.start();
    } catch {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#050616] via-[#05010A] to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_20%,rgba(147,51,234,0.6),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(56,189,248,0.5),transparent_60%)] opacity-70" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center px-5 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10">
        {/* Mentor bubble */}
        <div className="mb-6 flex w-full max-w-xl justify-center text-center sm:mb-8">
          <div className="relative">
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

        {/* Mentor figure */}
        <motion.div
          className="relative flex flex-1 items-center justify-center"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Image
            src="/mentors/sample.png"
            alt="Mentor figure"
            width={320}
            height={320}
            priority
            className="h-60 w-auto sm:h-72"
          />
        </motion.div>

        {/* User transcript (optional debug/UX) */}
        {userText && (
          <p className="mb-4 max-w-xl text-center text-[0.75rem] text-white/60 sm:text-sm">
            당신이 말한 내용: <span className="text-white/85">{userText}</span>
          </p>
        )}

        {/* Mic button */}
        <div className="flex w-full justify-center">
          <motion.button
            type="button"
            onMouseDown={startListening}
            onMouseUp={stopListening}
            onMouseLeave={stopListening}
            onTouchStart={(e) => {
              e.preventDefault();
              startListening();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              stopListening();
            }}
            animate={{
              scale: isListening ? 1.1 : 1,
              boxShadow: isListening
                ? "0 0 32px rgba(248, 250, 252, 0.85)"
                : "0 0 20px rgba(148, 163, 184, 0.7)",
            }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-b from-white to-slate-200 text-black shadow-[0_18px_40px_rgba(0,0,0,0.9)] sm:h-20 sm:w-20"
          >
            <span className="relative z-10 text-xl sm:text-2xl">🎤</span>
            <span className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-white/40 to-transparent opacity-60" />
          </motion.button>
        </div>

        {!sttSupported && (
          <p className="mt-3 text-[0.7rem] text-white/60 sm:text-xs">
            이 브라우저에서는 아직 음성 인식을 지원하지 않아요. 텍스트 입력 기능은
            추후 추가될 예정입니다.
          </p>
        )}
      </div>
    </main>
  );
}


