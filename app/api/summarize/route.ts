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
    const hexColor1 = String(body?.color1 ?? "#7C3AED");  // hex for share page bg
    const hexColor2 = String(body?.color2 ?? "#3B82F6");
    const emotion1 = String(body?.n1 ?? body?.color1 ?? "감정 A");  // label for prompt
    const emotion2 = String(body?.n2 ?? body?.color2 ?? "감정 B");
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Use last 6 exchanges to keep prompt short
    const recent = messages.slice(-6);
    const conversation = recent
      .map((m) => `${m.role === "assistant" ? "멘토" : "사용자"}: ${m.content}`)
      .join("\n");

    const prompt =
`다음 형식으로만 출력하라. 설명 없이 4줄만.
quote: 멘토의 울림 있는 한 문장
emotion: 감정 키워드 1~2개
healing: 0~100 정수 (감정이 얼마나 가벼워졌나)
journey: 3단계 한국어 단어, 쉼표 구분

멘토:${mentorNameKr} | 초기감정:${emotion1},${emotion2}
[대화]
${conversation}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text()?.trim() ?? "";

    const quote =
      extractField(raw, "quote") ||
      "가장 힘든 순간, 하루하루를 버텨내는 것 자체가 이미 용기입니다.";
    const emotionKeyword =
      extractField(raw, "emotion") || `${emotion1}, ${emotion2}`;

    const healingRaw = parseInt(extractField(raw, "healing"), 10);
    const healingScore = isNaN(healingRaw)
      ? 55
      : Math.min(100, Math.max(0, healingRaw));

    const journeyRaw = extractField(raw, "journey");
    const journeyWords = journeyRaw
      ? journeyRaw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)
      : ["토로", "공감", "수용"];

    const id = crypto.randomUUID();
    setShareSummary({
      id,
      mentorId,
      mentorNameKr,
      mentorNameEn,
      color1: hexColor1,
      color2: hexColor2,
      quote,
      emotionKeyword,
      healingScore,
      journeyWords,
      createdAt: Date.now(),
    });

    return NextResponse.json({ id, quote, emotionKeyword, healingScore, journeyWords });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown summarize error";
    return NextResponse.json(
      { error: "Failed to summarize conversation", details },
      { status: 500 }
    );
  }
}
