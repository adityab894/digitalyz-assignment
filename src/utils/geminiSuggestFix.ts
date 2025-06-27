import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function geminiSuggestFix(row: any, error: string) {
  const prompt = `
You are a data validation assistant. The following row has a validation error:
Row: ${JSON.stringify(row)}
Error: "${error}"
Suggest a corrected value for the field, and return a JSON object with the corrected row.
Return ONLY the corrected row as JSON.
`;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Could not parse Gemini suggestion: " + text);
  }
} 