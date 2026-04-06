import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not set in .env file");
}

// Initialize GoogleGenAI only if API key is available
let ai: any = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export interface SymptomAnalysis {
  intent: "symptom_analysis" | "medical_info" | "non_medical";
  possibleConditions: string[];
  severity: "Mild" | "Moderate" | "Severe";
  suggestedActions: string[];
  emergencyWarning: string | null;
  recommendedDoctor: string;
  isHealthRelated: boolean;
  followUpQuestions?: string[];
  generalExplanation?: string;
}

export function isHealthQuery(query: string): boolean {
  const healthKeywords = [
    'pain', 'fever', 'headache', 'cough', 'sore', 'throat', 'nausea', 'dizzy', 'hurt', 'ache',
    'symptom', 'doctor', 'medicine', 'health', 'medical', 'body', 'stomach', 'chest', 'breathing',
    'rash', 'swelling', 'blood', 'injury', 'sick', 'ill', 'disease', 'condition', 'treatment',
    'vaccine', 'virus', 'infection', 'allergy', 'cold', 'flu', 'covid', 'heart', 'brain', 'skin',
    'bone', 'muscle', 'joint', 'eye', 'ear', 'nose', 'mouth', 'tooth', 'gum', 'hair', 'nail',
    'sleep', 'diet', 'exercise', 'mental', 'stress', 'anxiety', 'depression', 'therapy', 'counseling',
    'what is', 'causes', 'how to treat', 'symptoms of'
  ];
  
  const lowerQuery = query.toLowerCase();
  return healthKeywords.some(keyword => lowerQuery.includes(keyword));
}

export async function analyzeSymptoms(
  chatHistory: { role: string; content: string }[],
  options: { language: string; isEmergency: boolean }
): Promise<SymptomAnalysis> {
  if (!ai) {
    console.error("Gemini API not initialized. Missing VITE_GEMINI_API_KEY");
    return {
      intent: "non_medical",
      possibleConditions: [],
      severity: "Mild",
      suggestedActions: ["Please configure API key and refresh the page"],
      emergencyWarning: "API key not configured. Please check your .env file.",
      recommendedDoctor: "None",
      isHealthRelated: false
    };
  }

  const contents = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: `You are MedAssist AI, a strictly professional medical assistant. 
      
      CONTEXT:
      - Current Language: ${options.language === 'hi' ? 'Hindi' : 'English'}
      - Emergency Mode: ${options.isEmergency ? 'ENABLED (Use a very urgent, strict, and direct tone)' : 'DISABLED'}

      INTENT CLASSIFICATION RULES:
      1. TYPE 1: SYMPTOM INPUT (e.g., "I have fever", "chest pain")
         - Set intent: "symptom_analysis"
         - Determine severity (Mild, Moderate, Severe) based on symptoms.
         - Provide structured medical analysis.
      2. TYPE 2: GENERAL MEDICAL QUESTIONS (e.g., "What is a migraine?", "Causes of fever")
         - Set intent: "medical_info"
         - Provide a simple explanation, causes, when to worry, and basic care tips in "generalExplanation".
         - Do NOT use "Based on your symptoms" phrasing.
         - Leave structured fields (possibleConditions, etc.) empty or null.
      3. TYPE 3: NON-MEDICAL QUESTIONS (e.g., "2+2", "Who is the PM?")
         - Set intent: "non_medical"
         - Set isHealthRelated: false
         - Return EXACTLY: "This is MedAssist AI, a medical assistant. Please ask health-related questions only." in "emergencyWarning".

      GENERAL RULES:
      - If the user's symptom input is vague or severity is unclear, provide 1-2 natural follow-up questions in "followUpQuestions" (e.g., "How intense is the pain?", "Is it getting worse?").
      - ALWAYS respond in the requested language: ${options.language === 'hi' ? 'Hindi' : 'English'}.
      - ALWAYS return a JSON object with the following structure:
      {
        "intent": "symptom_analysis" | "medical_info" | "non_medical",
        "possibleConditions": ["condition1", "condition2"],
        "severity": "Mild" | "Moderate" | "Severe",
        "suggestedActions": ["action1", "action2"],
        "emergencyWarning": "Warning message or refusal message, else null",
        "recommendedDoctor": "Specialist type",
        "isHealthRelated": boolean,
        "followUpQuestions": ["question1", "question2"],
        "generalExplanation": "Markdown explanation for general medical queries"
      }
      - Be cautious, professional, and always include a disclaimer that this is not a substitute for professional medical advice.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING, enum: ["symptom_analysis", "medical_info", "non_medical"] },
          possibleConditions: { type: Type.ARRAY, items: { type: Type.STRING } },
          severity: { type: Type.STRING, enum: ["Mild", "Moderate", "Severe"] },
          suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          emergencyWarning: { type: Type.STRING, nullable: true },
          recommendedDoctor: { type: Type.STRING },
          isHealthRelated: { type: Type.BOOLEAN },
          followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          generalExplanation: { type: Type.STRING, nullable: true }
        },
        required: ["intent", "possibleConditions", "severity", "suggestedActions", "emergencyWarning", "recommendedDoctor", "isHealthRelated", "followUpQuestions"]
      }
    }
  });

  try {
    const analysis: SymptomAnalysis = JSON.parse(response.text || "{}");
    if (!analysis.isHealthRelated) {
      analysis.possibleConditions = [];
      analysis.suggestedActions = [];
      analysis.recommendedDoctor = "None";
      analysis.emergencyWarning = "This is MedAssist AI, a medical assistant. Please ask health-related questions only.";
    }
    return analysis;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to analyze symptoms. Please try again.");
  }
}

export async function analyzeMedicalRecord(recordContent: string): Promise<string> {
  if (!ai) {
    return "API key not configured. Please check your .env file and refresh the page.";
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following medical record and provide a clear, concise summary for the patient. 
    Explain key terms and highlight any areas that might need follow-up with a doctor.
    Record: ${recordContent}`,
    config: {
      systemInstruction: "You are a medical record analyst. Provide clear, patient-friendly summaries of complex medical documents."
    }
  });

  return response.text || "Could not analyze the record.";
}
