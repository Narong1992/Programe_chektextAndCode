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
    คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข้อมูล Excel (Excel Data Analyst)
    
    ฉันมีข้อมูล 2 คอลัมน์ที่ต้องการเปรียบเทียบ:
    คอลัมน์ A (ต้นฉบับ):
    ${sourceData.substring(0, 10000)} ... (ตัดทอนหากยาวเกินไป)

    คอลัมน์ B (ตรวจสอบ):
    ${checkData.substring(0, 10000)} ... (ตัดทอนหากยาวเกินไป)

    กรุณาวิเคราะห์ความแตกต่างระหว่างสองคอลัมน์นี้ และตอบเป็น "ภาษาไทย":
    1. สรุปความผิดปกติหลัก (เช่น "แถวที่ 5 ต่างกันเพราะการสะกดคำ", "รูปแบบวันที่ไม่ตรงกัน")
    2. ให้คำแนะนำ 3-5 ข้อ เพื่อแก้ไขข้อมูลในคอลัมน์ B ให้ตรงกับคอลัมน์ A
    3. ตรวจจับรูปแบบของข้อผิดพลาด (เช่น ทั้งหมดเป็นเรื่องตัวพิมพ์เล็กใหญ่ หรือเว้นวรรค)
    
    ส่งผลลัพธ์กลับเป็น JSON ตามโครงสร้างที่กำหนด (ค่าข้างในเป็นภาษาไทย)
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