import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildMentorSystemPrompt } from "./prompt";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = String(body?.mode ?? "chat");
    const mentorNameKr = String(body?.mentorNameKr ?? body?.mentorName ?? "멘토");
    const mentorNameEn = String(body?.mentorNameEn ?? "Mentor");
    const color1 = String(body?.color1 ?? "감정 A");
    const color2 = String(body?.color2 ?? "감정 B");
    const tonePersonality = String(
      body?.tonePersonality ?? body?.personality ?? "차분하고 공감적인 어조"
    );
    const coreExperienceInsight = String(
      body?.coreExperienceInsight ??
        body?.coreInsight ??
        "당신의 감정은 이해받을 가치가 있습니다."
    );
    const selectionReason = String(
      body?.selectionReason ?? "당신의 감정과 닮은 삶의 굴곡이 있습니다."
    );
    const mission = String(
      body?.mission ?? "감정을 삶의 방향으로 바꾸는 태도를 제안합니다."
    );
    const messages = Array.isArray(body?.messages)
      ? (body.messages as ChatMessage[])
      : [];

    if (!genAI) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    if (mode === "summary") {
      if (!messages.length) {
        return NextResponse.json(
          { error: "messages are required for summary mode" },
          { status: 400 }
        );
      }

      const summaryPrompt = [
        "당신은 대화 요약 전문가입니다.",
        `멘토 이름: ${mentorNameKr} (${mentorNameEn})`,
        `멘토 성격: ${tonePersonality}`,
        `핵심 통찰: ${coreExperienceInsight}`,
        "요구사항:",
        "1) 오늘 대화 핵심을 한국어 2~3문장으로 요약",
        "2) 마지막 줄에 '오늘의 문장: ...' 형식으로 한 문장 제시",
        "3) 부드럽고 위로가 되는 톤 유지",
      ].join("\n");

      const serialized = messages
        .map((m) => `${m.role === "assistant" ? "멘토" : "사용자"}: ${m.content}`)
        .join("\n");

      const result = await model.generateContent(
        `${summaryPrompt}\n\n대화기록:\n${serialized}`
      );
      const text =
        result.response.text()?.trim() ??
        "오늘의 감정은 충분히 의미 있었고, 당신은 이미 회복의 방향을 찾기 시작했습니다.\n오늘의 문장: 감정은 약점이 아니라, 나를 이해하게 하는 신호다.";

      return NextResponse.json({ summary: text });
    }

    const userText = String(body?.userText ?? "").trim();
    if (!userText) {
      return NextResponse.json(
        { error: "userText is required" },
        { status: 400 }
      );
    }

    const systemPrompt = buildMentorSystemPrompt({
      mentorNameKr,
      mentorNameEn,
      color1,
      color2,
      coreExperienceInsight,
      tonePersonality,
      selectionReason,
      mission,
    });

    const conversation = messages
      .slice(-12)
      .map((m) => `${m.role === "assistant" ? mentorNameKr : "상대방"}: ${m.content}`)
      .join("\n");

    const prompt = conversation
      ? `${systemPrompt}\n\n[지금까지의 대화]\n${conversation}\n\n상대방: ${userText}\n${mentorNameKr}:`
      : `${systemPrompt}\n\n상대방: ${userText}\n${mentorNameKr}:`;
    const result = await model.generateContent(prompt);
    const reply =
      result.response.text()?.trim() ??
      "당신의 지금 감정을 있는 그대로 바라보는 것만으로도 이미 중요한 한 걸음을 내디딘 거예요.";

    return NextResponse.json({ reply });
  } catch (error) {
    const details =
      error instanceof Error ? error.message : "Unknown Gemini API error";
    return NextResponse.json(
      { error: "Failed to process mentor request", details },
      { status: 500 }
    );
  }
}

