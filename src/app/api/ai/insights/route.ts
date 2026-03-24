import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment variables" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const body = await req.json();

    const {
      total,
      currentMonthAmount,
      previousMonthAmount,
      monthlyChange,
      topCategory,
    } = body;

    // 💡 Better structured prompt (THIS is what makes it feel premium)
    const prompt = `
You are a senior financial analyst AI.

Analyze the user's spending data and give a concise, insightful summary.

Rules:
- Keep it 2-3 sentences
- Be specific and actionable
- Mention trends and risk if applicable
- Use a professional tone

Data:
Total spending: ${total}
Current month: ${currentMonthAmount}
Previous month: ${previousMonthAmount}
Monthly change: ${
      monthlyChange === null ? "N/A" : `${monthlyChange.toFixed(1)}%`
    }
Top category: ${topCategory || "Unknown"}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const insight =
      response.output_text ||
      "No insight generated.";

    return NextResponse.json({ insight });
  } catch (error) {
    console.error("AI ERROR:", error);

    return NextResponse.json(
      { error: "Failed to generate AI insight" },
      { status: 500 }
    );
  }
}