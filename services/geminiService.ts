
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentData, AssessmentResult, ImageSize } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to clean JSON string if markdown code blocks are present
const cleanJsonString = (str: string): string => {
  return str.replace(/```json\n?|\n?```/g, "").trim();
};

export const generateAssessmentStructure = async (role: string): Promise<AssessmentData> => {
  try {
    const prompt = `Create a professional skill assessment structure for the position of "${role}". 
    Identify 5-7 key skills categorized by 'Hard Skills' and 'Soft Skills'.
    Return ONLY a valid JSON object with the following schema:
    {
      "role": "${role}",
      "skills": [
        {
          "name": "Skill Name",
          "description": "Brief description of the skill",
          "category": "Hard Skills" | "Soft Skills",
          "maxScore": 10
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2048 }, // Using thinking budget for better structure
      },
    });

    const jsonStr = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonStr) as AssessmentData;
  } catch (error) {
    console.error("Error generating assessment:", error);
    throw error;
  }
};

export const evaluateAssessment = async (role: string, skills: any[], employeeName?: string): Promise<AssessmentResult> => {
  try {
    const nameContext = employeeName ? ` for employee "${employeeName}"` : "";
    const prompt = `Analyze the following self-assessment for a ${role} position${nameContext}.
    
    Data: ${JSON.stringify(skills)}
    
    Provide a detailed evaluation JSON with:
    1. A summary paragraph${employeeName ? ` (refer to the employee ${employeeName} in the third person)` : ""}.
    2. A list of key strengths.
    3. A list of weaknesses/areas for improvement.
    4. Specific actionable recommendations for career growth.
    5. Specific Training & Development recommendations (e.g., specific courses, certifications, workshops, on-the-job training tasks) to address gaps.
    6. An calculated overall score out of 100 based on the input weights.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            trainingRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallScore: { type: Type.NUMBER },
          },
          required: ["summary", "strengths", "weaknesses", "recommendations", "trainingRecommendations", "overallScore"]
        }
      },
    });

    const jsonStr = cleanJsonString(response.text || "{}");
    return JSON.parse(jsonStr) as AssessmentResult;
  } catch (error) {
    console.error("Error evaluating assessment:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string, size: ImageSize): Promise<string> => {
  try {
    // Create a new instance to ensure the most up-to-date API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          imageSize: size,
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const streamChatMessage = async function* (message: string, history: { role: string, parts: { text: string }[] }[]) {
  try {
    const chat = ai.chats.create({
      model: "gemini-3-pro-preview",
      history: history,
      config: {
        systemInstruction: "You are a helpful and knowledgeable HR and Career Consultant assistant within the SkillArchitect app. Keep answers professional yet conversational.",
      }
    });

    const result = await chat.sendMessageStream({ message });
    
    for await (const chunk of result) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};
