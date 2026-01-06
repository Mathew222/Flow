
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const visualDirectives = `
    TASK: Use the product in the source image as the absolute hero.
    
    ENVIRONMENT: ${userVisualDescription || 'A clean, premium commercial studio setup.'}

    CRITICAL REQUIREMENTS:
    1. PRODUCT FIDELITY: You MUST keep the product from the source image 100% identical. Do NOT change its brand, shape, color, or structural details. It is NOT a generic item; it is THIS specific item.
    2. PLACEMENT: Place the EXACT product in the center of the new environment. 
    3. NEW BACKGROUND: Replace the entire original background with a stunning, high-end professional commercial background that matches the environment description.
    4. LIGHTING: Apply cinematic commercial lighting (rim light, soft shadows) to the product so it looks integrated into the new scene, but the product's identity remains unchanged.
    5. NO TEXT: Do not generate any text, logos (other than the ones on the product), or watermarks.
    6. SPACING: Keep the top 30% and bottom 20% relatively clean for typography overlays.
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

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No enhanced image generated");
};
