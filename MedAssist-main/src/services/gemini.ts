import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// ✅ API init
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export enum GeminiErrorType {
  NETWORK = 'NETWORK',
  API = 'API',
  PROMPT = 'PROMPT',
  UNKNOWN = 'UNKNOWN'
}

export class GeminiError extends Error {
  constructor(public type: GeminiErrorType, message: string, public originalError?: any) {
    super(message);
    this.name = 'GeminiError';
  }
}

const SYSTEM_INSTRUCTION = `You are an empathetic medical assistant named MedAssist...`;

export async function analyzeSymptoms(
  messages: { role: 'user' | 'model', parts: any[] }[],
  medicalHistory?: string
) {
  try {
    // ✅ FIX: convert messages → plain text (MOST IMPORTANT FIX)
    let prompt = messages.map(m => m.parts?.[0]?.text || "").join("\n");

    if (medicalHistory) {
      prompt = `Medical History: ${medicalHistory}\n\n${prompt}`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(prompt);

    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new GeminiError(
        GeminiErrorType.API,
        "Empty response from AI"
      );
    }

    return text;

  } catch (err: any) {
    console.error("🔥 GEMINI ERROR:", err);

    // 🔁 FLASH FALLBACK (FIXED)
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const prompt = messages.map(m => m.parts?.[0]?.text || "").join("\n");

      const result = await model.generateContent(prompt);
      return result.response.text();

    } catch (fallbackErr) {
      console.error("Flash fallback failed:", fallbackErr);
    }

    // 🔁 GROQ FALLBACK
    const groqResponse = await callGroq(messages, SYSTEM_INSTRUCTION);
    if (groqResponse) return groqResponse;

    throw new GeminiError(
      GeminiErrorType.UNKNOWN,
      "AI failed completely",
      err
    );
  }
}

// GROQ (unchanged)
async function callGroq(messages: any[], systemInstruction: string) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        ...messages.map(m => ({
          role: m.role === 'model' ? 'assistant' : m.role,
          content: m.parts?.[0]?.text || ""
        }))
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content || null;

  } catch (err) {
    console.error("Groq error:", err);
    return null;
  }
}