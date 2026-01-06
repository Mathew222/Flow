
import { GoogleGenAI, Type } from "@google/genai";
import { PosterContent } from "./types";

/**
 * Generates marketing content and brand identity from a product image using Gemini 3 Flash.
 */
export const generatePosterContent = async (
  base64Image: string, 
  brandName?: string, 
  customSlogan?: string, 
  context?: string,
  contactInfo?: { phone?: string; email?: string; website?: string }
): Promise<PosterContent> => {
  // Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `You are a professional creative director. 
  Look at the attached product image and generate marketing slogans and brand identity.
  
  USER INPUTS:
  - Brand/Product Name: ${brandName || "Generate a creative one if not obvious"}
  - Preferred Slogan: ${customSlogan || "Generate one if empty"}
  - Context/Idea: ${context || "Use your best creative judgment based on the image"}

  INSTRUCTIONS:
  1. Use the provided Brand Name if available.
  2. Use the provided Slogan if available.
  3. generate a 'background_word' which is one single powerful word related to the product (e.g., 'FRESH', 'GLOW', 'PURE', 'DRIVE').
  4. generate a short 'cta_text' like 'SHOP NOW', 'ORDER NOW', or a price point.
  
  Return valid JSON with:
  1. brand_name (string)
  2. short_slogan (max 8 words)
  3. long_slogan (max 15 words)
  4. cta_text (string)
  5. background_word (string)
  6. emotional_tone (one of: bold, premium, playful, minimal, energetic)
  7. product_category (single word description)`;

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
          cta_text: { type: Type.STRING },
          background_word: { type: Type.STRING },
          emotional_tone: { 
            type: Type.STRING, 
            enum: ['bold', 'premium', 'playful', 'minimal', 'energetic'] 
          },
          product_category: { type: Type.STRING }
        },
        required: ["brand_name", "short_slogan", "long_slogan", "cta_text", "background_word", "emotional_tone", "product_category"]
      }
    }
  });

  // response.text is a property, not a method
  const text = response.text || '{}';
  const content = JSON.parse(text) as PosterContent;
  content.company_info = contactInfo || {};
  return content;
};

/**
 * Enhances the product image by generating a new background while keeping the product central.
 * Uses gemini-2.5-flash-image for image generation/editing tasks.
 */
export const enhanceProductImage = async (
  base64Image: string, 
  tone: string, 
  userVisualDescription: string,
  context?: string
): Promise<string> => {
  // Always use process.env.API_KEY directly when initializing the GoogleGenAI client instance
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const visualDirectives = `
    TASK: Generate a professional product poster background based on the provided source image.
    
    ARTISTIC DIRECTION: ${userVisualDescription || 'A clean, premium commercial studio setup.'}

    MANDATORY RULES:
    1. PRODUCT INTEGRATION: The product from the source image MUST be the central hero of the new scene. It should be redrawn in the exact center with the new lighting.
    2. REMOVE SOURCE BACKGROUND: Do NOT include any of the original background from the user image. The product should be placed in a completely new environment.
    3. NO TEXT: Do NOT generate any typography, letters, logos, or numbers in the image.
    4. LIGHTING: Use high-end commercial rim lighting to separate the product from the background.
    5. QUALITY: Photorealistic, 8k resolution, professional advertising photography.
    6. SPACING: Ensure the top 1/3 and bottom 1/4 of the image are clean and uncluttered to allow for text overlays.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/png' } },
        { text: visualDirectives }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  // Find the image part by iterating through all parts
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const base64EncodeString = part.inlineData.data;
      return `data:image/png;base64,${base64EncodeString}`;
    }
  }

  throw new Error("No enhanced image generated");
};
