
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PosterContent, EmotionalTone } from "./types";

const API_KEY = process.env.API_KEY || '';

export const generatePosterContent = async (
  base64Image: string, 
  brandName?: string, 
  customSlogan?: string, 
  context?: string
): Promise<PosterContent> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `You are a professional creative director. 
  Look at the attached product image and generate marketing slogans and brand identity.
  
  USER INPUTS:
  - Brand/Product Name: ${brandName || "Generate a creative one if not obvious"}
  - Preferred Slogan: ${customSlogan || "Generate one if empty"}
  - Context/Idea: ${context || "Use your best creative judgment based on the image"}

  INSTRUCTIONS:
  1. Use the provided Brand Name if available.
  2. Use the provided Slogan if available, or enhance it if requested by context.
  3. Incorporate the Context/Idea into the emotional tone and messaging.
  
  Return valid JSON with:
  1. brand_name (string)
  2. short_slogan (max 8 words)
  3. long_slogan (max 15 words)
  4. emotional_tone (one of: bold, premium, playful, minimal, energetic)
  5. product_category (single word description)`;

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
          brand_name: { type: Type.STRING },
          short_slogan: { type: Type.STRING },
          long_slogan: { type: Type.STRING },
          emotional_tone: { 
            type: Type.STRING, 
            enum: ['bold', 'premium', 'playful', 'minimal', 'energetic'] 
          },
          product_category: { type: Type.STRING }
        },
        required: ["brand_name", "short_slogan", "long_slogan", "emotional_tone", "product_category"]
      }
    }
  });

  return JSON.parse(response.text || '{}') as PosterContent;
};

export const enhanceProductImage = async (base64Image: string, tone: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
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
