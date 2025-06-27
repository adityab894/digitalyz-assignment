import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function geminiHeaderMap(uploadedHeaders: string[], requiredSchema: string[]) {
  const prompt = `
You are a data import assistant. The user uploads a file with the following headers:
${JSON.stringify(uploadedHeaders)}
The required schema is:
${JSON.stringify(requiredSchema)}
Return a JSON object mapping each uploaded header to the correct required field name. If a header does not match any required field, map it to null.
Example output:
{
  "Client Nmae": "ClientName",
  "ID": "ClientID"
}
`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  // Remove code block markers if present
  text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  // Parse JSON
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("Could not parse Gemini header mapping: " + text);
  }
}
