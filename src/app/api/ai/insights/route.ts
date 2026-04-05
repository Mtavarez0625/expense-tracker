import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

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
      topCategoryShare,
      expenseCount,
      topThreeCategories,
      topThreeExpenses,
    } = body;

    // 💡 Better structured prompt (THIS is what makes it feel premium)
    const prompt = `
    You are a financial insights assistant for a personal expense dashboard.

    Analyze the user's spending data and write a short, practical insight in 3 to 5 sentences.

    Rules:
    - Use natural, human-friendly language.
    - Avoid overly formal or robotic phrasing.
    - Frame recommendations as small, realistic actions (not generic advice).
    - Mention the largest spending category if relevant.
    - Mention month-over-month change if available.
    - Mention one or two of the largest expenses if useful.
    - Give one practical recommendation.
    - Keep the tone professional and helpful.
    - Do not use bullet points.
    - Do not invent numbers that were not provided.

    Data:
    - Total spending: ${total}
    - Current month spending: ${currentMonthAmount}
    - Previous month spending: ${previousMonthAmount}
    - Monthly change: ${monthlyChange ?? "Not enough history"}
    - Number of expenses: ${expenseCount}
    - Top category: ${topCategory ?? "None"}
    - Top category share: ${topCategoryShare}%
    - Top categories: ${JSON.stringify(topThreeCategories)}
    - Top expenses: ${JSON.stringify(topThreeExpenses)}
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