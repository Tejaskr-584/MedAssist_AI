import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// ✅ API init
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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

// ================= MAIN FUNCTION =================
export async function analyzeSymptoms(
  messages: { role: 'user' | 'model', parts: any[] }[],
  medicalHistory?: string
) {
  try {
    let prompt = messages.map(m => m.parts?.[0]?.text || "").join("\n");

    if (medicalHistory) {
      prompt = `Medical History: ${medicalHistory}\n\n${prompt}`;
    }

    if (!genAI) throw new Error("Gemini API not initialized");

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) throw new Error("Empty response");

    return text;

  } catch (err: any) {
    console.error("🔥 GEMINI ERROR:", err);

    // 🔁 FLASH FALLBACK
    try {
      if (!genAI) throw new Error("Gemini API not initialized");

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

// ================= EXTRA REQUIRED FUNCTIONS =================

// ✅ Generate chat title
export async function generateChatTitle(messages: any[]) {
  try {
    if (!genAI) throw new Error("Gemini API not initialized");

    const prompt = messages.map(m => m.parts?.[0]?.text || "").join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Generate a short 3-5 word title for this medical conversation:\n${prompt}`
    );

    return result.response.text();

  } catch (err) {
    console.error("generateChatTitle error:", err);
    return "Medical Chat";
  }
}

// ✅ Recommend specialist
export async function recommendSpecialist(symptoms: string) {
  try {
    if (!genAI) throw new Error("Gemini API not initialized");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(
      `Based on these symptoms, suggest the most relevant medical specialist:\n${symptoms}`
    );

    return result.response.text();

  } catch (err) {
    console.error("recommendSpecialist error:", err);
    return "General Physician";
  }
}

// ✅ Analyze medical record
export async function analyzeMedicalRecord(text: string) {
  try {
    if (!genAI) throw new Error("Gemini API not initialized");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(
      `Analyze this medical record and summarize key insights:\n${text}`
    );

    return result.response.text();

  } catch (err) {
    console.error("analyzeMedicalRecord error:", err);
    return "Unable to analyze record.";
  }
}

// ✅ Chat about record
export async function chatAboutRecord(record: string, question: string) {
  try {
    if (!genAI) throw new Error("Gemini API not initialized");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const result = await model.generateContent(
      `Medical Record:\n${record}\n\nUser Question:\n${question}`
    );

    return result.response.text();

  } catch (err) {
    console.error("chatAboutRecord error:", err);
    return "Unable to answer.";
  }
}

 // ================= GROQ FALLBACK =================
async function callGroq(messages: any[], systemInstruction: string) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

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