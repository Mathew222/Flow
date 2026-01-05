
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { PosterContent, EmotionalTone, PosterStyle } from "./types";

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

  return JSON.parse(response.text || '{}') as PosterContent;
};

export const enhanceProductImage = async (
  base64Image: string, 
  tone: string, 
  style: PosterStyle,
  context?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  let styleDirective = "";

  switch (style) {
    case PosterStyle.COSMIC_LEVITATION:
      styleDirective = `
        Atmospheric and mystical. The product is the center of a cosmic event.
        - COMPOSITION: The product is levitating between two massive, glowing cracked rocks or blue geodes. 
        - LIGHTING: Strong blue internal glow emanating from the rocks and product. Dark, high-contrast background with floating dust particles and small ice/rock shards.
        - VIBE: Premium, mysterious, and high-end hydration/tech aesthetic.
      `;
      break;
    case PosterStyle.DECONSTRUCTED_SPLASH:
      styleDirective = `
        High-energy deconstructed composition. 
        - COMPOSITION: The product is surrounded by exploding, high-speed ingredients. Floating splashes of liquid, crisp slices of fruit (like lime or mango), and droplets frozen in time.
        - LIGHTING: Bright, vibrant lighting with sharp rim highlights on every splashing element.
        - VIBE: Energetic, refreshing, and appetizing. Inspired by luxury beverage and food photography.
      `;
      break;
    case PosterStyle.EDITORIAL_INGREDIENTS:
      styleDirective = `
        Soft editorial beauty style.
        - COMPOSITION: Elegant arrangement of the product with its key ingredients (e.g., coconut halves, almonds, botanical leaves) floating gracefully around it in a soft milk-like splash or gentle breeze.
        - LIGHTING: Soft, diffused studio lighting with warm or clean tones. Low contrast with a clean, light-colored background.
        - VIBE: Pure, natural, and premium skincare or wellness aesthetic.
      `;
      break;
    case PosterStyle.TECHNICAL_BLUEPRINT:
      styleDirective = `
        Technical industrial design aesthetic.
        - COMPOSITION: The product is centered on a blueprint-style background. 
        - DETAILS: Include architectural grid lines, subtle white technical measurements, and hand-drawn sketch elements of the product's silhouette in the background.
        - VIBE: Innovative, precise, and tech-forward. Clean blue or navy blue grid theme.
      `;
      break;
    case PosterStyle.MINIMAL_BRUTALIST:
      styleDirective = `
        Bold, high-fashion brutalist style.
        - COMPOSITION: Product placed against a flat, vibrant color-blocked background (e.g., bold orange and beige). 
        - DETAILS: Sharp, hard-edge shadows. Clean geometric division of the background space.
        - VIBE: Modern, streetwear, and artistic. Inspired by modern culture and fashion posters.
      `;
      break;
    case PosterStyle.GLOW_PORTAL:
      styleDirective = `
        Symmetrical futuristic presentation.
        - COMPOSITION: The product is centered inside a glowing geometric portal or frame (like a rounded neon square or vertical bar).
        - LIGHTING: Strong backlighting from the portal creating a sharp silhouette. Deep purple or vibrant neon color theme. 
        - VIBE: Luxury automotive, high-end electronics, and night-life energy.
      `;
      break;
  }

  const visualDirectives = `
    TASK: Generate a professional product poster background based on the provided source image.
    
    STYLE GUIDELINE: ${styleDirective}

    MANDATORY RULES:
    1. PRODUCT FOCUS: The product from the source image MUST be the central hero.
    2. NO TEXT: Do NOT generate any typography, letters, logos, or numbers in the image.
    3. SPACING: Leave clear areas at the top and bottom for UI text overlays.
    4. QUALITY: Photorealistic commercial photography. High resolution, sharp focus on the product, and professional lighting separation.
    5. CONTEXT: Incorporate "${context || ''}" into the visual mood.
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
