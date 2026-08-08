import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { field, value, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let prompt = "";

    if (field === "caption") {
      prompt = `You are a social media copywriter for Lifestyle Medicine Gateway. Write a highly engaging viral social media caption based on the following content context:
      ${context}

      Make sure to:
      1. Include a strong hook in the first sentence.
      2. Use emojis naturally.
      3. Provide 3 clear takeaways or key insights.
      4. End with a call to action.`;
    } else if (field === "hashtags") {
      prompt = `Generate 10 to 15 relevant, high-volume social media hashtags for this content:
      ${context}

      Return ONLY a single line of space-separated hashtags starting with #.`;
    } else if (field === "excerpt") {
      prompt = `Write a concise 2-sentence meta summary / excerpt for this article title and content:
      ${context}`;
    } else if (field === "custom") {
      prompt = `${value}\n\nContext:\n${context}`;
    } else {
      prompt = `Improve and rewrite the following copy to make it more professional, clear, and engaging:\n${value}\n\nContext:\n${context}`;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error("AI Enhance API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI enhancement" },
      { status: 500 }
    );
  }
}
