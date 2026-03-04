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
    const emotion1 = String(body?.color1 ?? "감정 A");
    const emotion2 = String(body?.color2 ?? "감정 B");
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
      "아래 대화를 분석해서 정확히 다음 형식으로만 출력하십시오. 다른 설명은 절대 추가하지 마십시오.",
      "",
      "quote: (멘토가 대화에서 전한 가장 인상적인 한 문장. 멘토의 말투로 작성하되, 사용자가 간직할 수 있는 울림 있는 문장)",
      "emotion: (사용자의 감정 조합 키워드 1~2개, 예: 우울, 지침)",
      "healing: (0~100 사이 정수. 대화 전후 사용자의 감정 무게가 얼마나 가벼워졌는지 추정. 대화가 짧으면 30~50, 충분히 공감이 이루어졌으면 60~80)",
      "journey: (감정 여정을 나타내는 3단계 한국어 단어, 쉼표로 구분. 예: 토로, 공감, 수용 / 혼란, 통찰, 결심)",
      "",
      `멘토: ${mentorNameKr} (${mentorNameEn})`,
      `초기 감정: ${emotion1}, ${emotion2}`,
      "",
      "[대화]",
      conversation,
    ].join("\n");

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
      color1: emotion1,
      color2: emotion2,
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
