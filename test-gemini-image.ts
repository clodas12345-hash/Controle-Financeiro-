import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        "What is in this image?",
        { inlineData: { data: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64").toString("base64"), mimeType: "image/png" } }
      ]
    });
    console.log("Success:", res.text);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
