import { GoogleGenAI } from "@google/genai";
import * as dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: "hello",
    });
    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}

test();
