import { GoogleGenAI, Type } from "@google/genai";
import { FeedbackResponse, FormData } from "../types";

export const analyzeReflection = async (data: FormData): Promise<FeedbackResponse> => {
  // Lazy initialization to prevent "process is not defined" or missing API key errors at startup
  const apiKey = process.env.API_KEY;
  
  // Note: In a production environment, ensure API_KEY is injected via build process or env variables.
  if (!apiKey) {
    console.warn("Gemini API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey || '' });
  const model = "gemini-2.5-flash";
  
  const prompt = `
    You are a precise and insightful writing tutor for a student club called "Na-Phil-Sa" (My Transcription Club).
    
    Student Info: ${data.studentInfo}
    Most Impressive Phrase: "${data.impressivePhrase}"
    Student's Transcription & Reflection:
    "${data.content}"

    TASK: Analyze the student's writing based on the OREO principle. Be STRICT in your evaluation.
    
    The OREO principle stands for:
    O (Opinion): Is the main argument or central thought clearly stated?
    R (Reason): Is there a logical reason provided for why they think that?
    E (Example): Is there a specific example from the text or personal experience to support the reason?
    O (Opinion/Offer): Is the opinion restated or a concluding thought/suggestion offered at the end?

    Please generate a JSON response with the following:
    1. summary: Summarize what they wrote in 1 sentence (Korean).
    2. oreoAnalysis: Evaluate each part of OREO. Set the boolean to FALSE if the part is weak, vague, or missing. Be critical.
    3. score: Give a score out of 100 based on logical flow and sincerity. Deduct points if OREO structure is missing.
    4. constructiveFeedback: Provide sophisticated and specific advice in Korean. Explain exactly which part of OREO was weak and how to fix it. Use bullet points or clear structure if needed.
    5. encouragement: Write a warm, motivating comment in Korean.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING, description: "A one sentence summary in Korean" },
          oreoAnalysis: {
            type: Type.OBJECT,
            properties: {
              opinion: { type: Type.BOOLEAN, description: "Clear main point/opinion" },
              reason: { type: Type.BOOLEAN, description: "Logical reason provided" },
              example: { type: Type.BOOLEAN, description: "Specific example or evidence provided" },
              opinionRestated: { type: Type.BOOLEAN, description: "Conclusion or restatement provided" },
            },
            required: ["opinion", "reason", "example", "opinionRestated"]
          },
          score: { type: Type.INTEGER, description: "Score out of 100" },
          constructiveFeedback: { type: Type.STRING, description: "Detailed, specific advice for OREO improvement in Korean" },
          encouragement: { type: Type.STRING, description: "Warm closing comment in Korean" },
        },
        required: ["summary", "oreoAnalysis", "score", "constructiveFeedback", "encouragement"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(text) as FeedbackResponse;
};