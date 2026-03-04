import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setShareSummary } from "../_lib/share-store";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

function extractField(text: string, key: string) {
  const line = text
    .split("\n")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${key}:`));
  return line ? line.replace(`${key}:`, "").trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mentorNameKr = String(body?.mentorNameKr ?? "멘토");
    const mentorNameEn = String(body?.mentorNameEn ?? "Mentor");
    const mentorId = body?.mentorId ? String(body.mentorId) : undefined;
    const color1 = String(body?.color1 ?? "감정 A");
    const color2 = String(body?.color2 ?? "감정 B");
    const messages = Array.isArray(body?.messages)
      ? (body.messages as ChatMessage[])
      : [];

    if (!messages.length) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }
    if (!genAI) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const conversation = messages
      .map((m) => `${m.role === "assistant" ? "멘토" : "사용자"}: ${m.content}`)
      .join("\n");

    const prompt = [
      "당신은 상담 대화 요약 전문가입니다.",
      "아래 형식을 정확히 지켜서 한국어로 출력하세요.",
      "quote: (이번 대화의 핵심 격언 1문장)",
      "emotion: (사용자의 최종 감정 상태 키워드 1~2개)",
      "summary: (2문장 이내 요약)",
      "",
      `멘토: ${mentorNameKr} (${mentorNameEn})`,
      `감정 조합: ${color1} + ${color2}`,
      "",
      "[대화]",
      conversation,
    ].join("\n");

    const result = await model.generateContent(prompt);
    const raw = result.response.text()?.trim() ?? "";
    const quote = extractField(raw, "quote") || "감정은 나를 이해하는 가장 정직한 신호입니다.";
    const emotionKeyword = extractField(raw, "emotion") || `${color1}, ${color2}`;
    const summary =
      extractField(raw, "summary") ||
      "오늘의 대화를 통해 감정의 흐름을 조금 더 분명히 바라보게 되었습니다.";

    const id = crypto.randomUUID();
    setShareSummary({
      id,
      mentorId,
      mentorNameKr,
      mentorNameEn,
      color1,
      color2,
      quote,
      emotionKeyword,
      summary,
      createdAt: Date.now(),
    });

    return NextResponse.json({ id, quote, emotionKeyword, summary });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown summarize error";
    return NextResponse.json(
      { error: "Failed to summarize conversation", details },
      { status: 500 }
    );
  }
}

