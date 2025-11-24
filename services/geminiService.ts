import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize client
const ai = new GoogleGenAI({ apiKey });

export const analyzeDiscrepancies = async (sourceData: string, checkData: string) => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const modelId = 'gemini-2.5-flash';

  const prompt = `
    You are an expert Excel Data Analyst.
    
    I have two columns of data.
    Column A (Source):
    ${sourceData.substring(0, 10000)} ... (truncated if too long)

    Column B (Check):
    ${checkData.substring(0, 10000)} ... (truncated if too long)

    Please analyze the differences between these two columns.
    1. Summarize the main discrepancies (e.g., "Row 5 differs due to spelling", "Dates are formatted differently").
    2. Provide 3-5 specific suggestions on how to clean or fix the data in Column B to match Column A.
    3. Detect patterns (e.g., all mismatches are due to capitalization or whitespace).
    
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            patternDetected: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text);
    }
    throw new Error("No response from AI");

  } catch (error) {
    console.error("Error analyzing data with Gemini:", error);
    throw error;
  }
};