import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY missing");
    return;
  }
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: "hello"
    });
    console.log("Success:", res.text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
