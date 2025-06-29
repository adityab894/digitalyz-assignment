import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function geminiDataModifier(command: string, dataSample: unknown[], entity: string) {
  const prompt = `
You are a data assistant. The user will give you a natural language command to modify a table of ${entity} data.
Command: "${command}"
Data sample: ${JSON.stringify(dataSample.slice(0, 3), null, 2)}
Return a JavaScript map function (as a string) that, when applied to each row, returns the modified row.
Example: row => { if (row.GroupTag === 'Alpha') row.PriorityLevel = 5; return row; }
Return ONLY the function, nothing else.
`;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').replace(/^javascript\s*/i, '').trim();
  const multilineArrow = text.match(/^([a-zA-Z0-9_]+)\s*=>\s*{([\s\S]*)}$/);
  if (multilineArrow) {
    return new Function(multilineArrow[1], multilineArrow[2]);
  }
  const arrowMatch = text.match(/^([a-zA-Z0-9_]+)\s*=>\s*([\s\S]*)$/);
  if (arrowMatch) {
    return new Function(arrowMatch[1], "return " + arrowMatch[2]);
  }
  throw new Error("Could not parse Gemini response: " + text);
} 