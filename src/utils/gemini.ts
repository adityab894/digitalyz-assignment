import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function geminiNlpFilter(query: string, dataSample: unknown[], entity: string) {
  const prompt = `
      You are an expert data assistant. The user will give you a natural language query about a table of ${entity} data.
      Return a JavaScript filter function (as a string) that, when applied to an array of rows, returns only the rows matching the query.
      Query: "${query}"
      Data sample: ${JSON.stringify(dataSample.slice(0, 3), null, 2)}
      IMPORTANT: Only use the fields available in the row object. Do not reference any external variables or tables. For numeric comparisons, cast the value with Number(row.Duration) or similar.
      Return ONLY the filter function, nothing else.
      Example: row => Number(row.Duration) < 2
      `;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Remove code block markers and 'javascript' label
  text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').replace(/^javascript\s*/i, '').trim();

  // Try to evaluate the function directly
  try {
    const fn = eval('(' + text + ')');
    if (typeof fn === 'function') return fn;
  } catch {
    // fallback to previous regex-based extraction if needed
  }

  text = text.replace(/row\.duration/g, 'row.Duration');

  throw new Error("Could not parse Gemini response: " + text);
}