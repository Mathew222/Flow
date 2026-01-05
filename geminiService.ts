
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PosterContent, EmotionalTone } from "./types";

const API_KEY = process.env.API_KEY || '';

export const generatePosterContent = async (base64Image: string): Promise<PosterContent> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `You are a professional creative director. 
  Look at the attached product image and generate marketing slogans.
  
  Return valid JSON with:
  1. short_slogan (max 8 words)
  2. long_slogan (max 15 words)
  3. emotional_tone (one of: bold, premium, playful, minimal, energetic)
  4. product_category (single word description)`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          short_slogan: { type: Type.STRING },
          long_slogan: { type: Type.STRING },
          emotional_tone: { 
            type: Type.STRING, 
            enum: ['bold', 'premium', 'playful', 'minimal', 'energetic'] 
          },
          product_category: { type: Type.STRING }
        },
        required: ["short_slogan", "long_slogan", "emotional_tone", "product_category"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as PosterContent;
};

export const enhanceProductImage = async (base64Image: string, tone: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // Nano Banana / Gemini 2.5 Flash Image is used for editing/enhancing
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: `Enhance this product image for a ${tone} marketing poster. 
        Place the item in a professional studio setting with clean lighting, 
        aesthetic background, and high resolution. Maintain the product's integrity.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No enhanced image generated");
};
