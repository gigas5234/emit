import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const mentorName = String(body?.mentorName ?? "E.M.I.T Mentor");
    const personality = String(body?.personality ?? "차분하고 공감적인 어조");
    const coreInsight = String(
      body?.coreInsight ?? "당신의 감정은 이해받을 가치가 있습니다."
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

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    if (mode === "summary") {
      if (!messages.length) {
        return NextResponse.json(
          { error: "messages are required for summary mode" },
          { status: 400 }
        );
      }

      const summaryPrompt = [
        "당신은 대화 요약 전문가입니다.",
        `멘토 이름: ${mentorName}`,
        `멘토 성격: ${personality}`,
        `핵심 통찰: ${coreInsight}`,
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

    const systemPrompt = [
      `당신은 ${mentorName} 페르소나의 AI 멘토입니다.`,
      `반드시 성격을 반영해서 답변하세요: ${personality}`,
      `반드시 핵심 통찰을 반영하세요: ${coreInsight}`,
      "조건:",
      "- 한국어로 답변",
      "- 3~5문장 이내",
      "- 공감 1문장 + 관찰/통찰 1~2문장 + 다음 행동 제안 1문장",
      "- 과장된 위로 금지, 진솔하고 차분하게",
    ].join("\n");

    const conversation = messages
      .slice(-10)
      .map((m) => `${m.role === "assistant" ? "멘토" : "사용자"}: ${m.content}`)
      .join("\n");

    const prompt = `${systemPrompt}\n\n이전 대화:\n${conversation}\n\n사용자 최신 발화: ${userText}\n멘토 답변:`;
    const result = await model.generateContent(prompt);
    const reply =
      result.response.text()?.trim() ??
      "당신의 지금 감정을 있는 그대로 바라보는 것만으로도 이미 중요한 한 걸음을 내디딘 거예요.";

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { error: "Failed to process mentor request" },
      { status: 500 }
    );
  }
}

