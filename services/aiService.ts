import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const parseResumeWithAI = async (text: string) => {
  const prompt = `
    You are an expert resume parser associated with a Resume Builder Application.
    Extract the following details from the resume text provided below and return STRICT JSON ONLY.
    
    Do not add any markdown formatting like \`\`\`json or \`\`\`. Just return the raw JSON string.

    The JSON structure must be exactly:
    {
      "firstName": "string",
      "lastName": "string",
      "email": "string (or empty)",
      "phone": "string (or empty)",
      "address": "string (or empty, city/state only)",
      "summary": "string (short professional summary if available, else empty)",
      "skills": ["string", "string"], (max 10 key skills)
      "experience": [
        {
          "title": "string",
          "company": "string",
          "description": "string (short bullet points or summary, max 400 chars)",
          "current": boolean,
          "startDate": "string (YYYY-MM-DD or MM/YYYY format)",
          "endDate": "string (YYYY-MM-DD or MM/YYYY format, or empty if current)"
        }
      ],
      "education": [
        {
          "school": "string",
          "degree": "string",
          "year": "string (graduation year usually)"
        }
      ]
    }

    RESUME TEXT:
    ${text}
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textResponse = response.text();
    
    // Clean potential markdown if the model ignores instructions
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("Gemini AI Parsing Error:", error);
    // Include the actual error message for debugging
    const errorMessage = error.message || JSON.stringify(error);
    throw new Error(`Failed to parse resume with AI: ${errorMessage}`);
  }
};
