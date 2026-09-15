import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();
async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  console.log(data.models.map((m: any) => m.name));
}
test();
