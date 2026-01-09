
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
    model: 'gemini-2.0-flash',
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
 * First analyzes the product to get exact visual details,
 * then generates an enhanced image with those specific details.
 */
export const enhanceProductImage = async (
  base64Image: string,
  tone: string,
  userVisualDescription: string,
  context?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // STEP 1: Analyze the product to get exact visual details
  const analysisPrompt = `Analyze this product image and provide EXACT visual details.
  
  Return a JSON object with:
  1. product_type: What type of product is this? (e.g., "smartphone", "shirt", "bottle")
  2. exact_color: The EXACT color(s) of the product. Be very specific (e.g., "teal/cyan blue-green", "Pacific Blue", "matte black")
  3. brand_visible: Any visible brand/logo on the product
  4. design_details: Specific design elements (e.g., "triple camera module", "gradient finish", "collar style")
  5. material_finish: The material/finish of the product (e.g., "glossy glass", "matte aluminum", "cotton fabric")
  6. notable_features: Any other distinctive visual features
  
  Be EXTREMELY specific about colors - this is critical for accurate reproduction.`;

  let productDetails = {
    product_type: 'product',
    exact_color: 'original color',
    brand_visible: '',
    design_details: '',
    material_finish: '',
    notable_features: ''
  };

  try {
    const analysisResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: analysisPrompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            product_type: { type: Type.STRING },
            exact_color: { type: Type.STRING },
            brand_visible: { type: Type.STRING },
            design_details: { type: Type.STRING },
            material_finish: { type: Type.STRING },
            notable_features: { type: Type.STRING }
          },
          required: ["product_type", "exact_color", "design_details"]
        }
      }
    });

    const analysisText = analysisResponse.text || '{}';
    productDetails = { ...productDetails, ...JSON.parse(analysisText) };
    console.log("Product analysis:", productDetails);
  } catch (err) {
    console.warn("Product analysis failed, using generic description:", err);
  }

  // STEP 2: Generate the enhanced image with EXACT product specifications
  const visualDirectives = `
    CRITICAL TASK: Generate a professional commercial advertisement image.
    
    ⚠️ EXACT PRODUCT SPECIFICATIONS - MUST MATCH PRECISELY:
    - Product Type: ${productDetails.product_type}
    - EXACT COLOR: ${productDetails.exact_color} (THIS IS CRITICAL - USE THIS EXACT COLOR)
    - Brand/Logo: ${productDetails.brand_visible || 'As shown in reference'}
    - Design Details: ${productDetails.design_details}
    - Material/Finish: ${productDetails.material_finish}
    - Notable Features: ${productDetails.notable_features}
    
    ENVIRONMENT: ${userVisualDescription || 'A clean, premium commercial studio setup with dramatic lighting.'}
    MOOD: ${tone || 'premium'}
    ${context ? `CONTEXT: ${context}` : ''}

    ABSOLUTE REQUIREMENTS:
    1. ⚠️ THE PRODUCT COLOR MUST BE EXACTLY: ${productDetails.exact_color}
       - If the product is teal/cyan, it MUST be teal/cyan in the generated image
       - If the product is red, it MUST be red
       - DO NOT change the product color under any circumstances
    
    2. PRESERVE ALL PRODUCT DETAILS:
       - Same design, same features, same everything as the reference
       - The product must be visually identical to the input
    
    3. BACKGROUND:
       - Create a beautiful, high-end commercial background
       - Use cinematic lighting with rim lights and professional setup
       - The background should complement the product's ${productDetails.exact_color} color
    
    4. COMPOSITION:
       - Product must be the hero, centered and prominent
       - Keep top 30% and bottom 20% clean for text overlays
       - No text, logos, or watermarks in the generated image
    
    5. STYLE: Professional advertising campaign photo quality
    
    REMEMBER: The product color is ${productDetails.exact_color}. Do NOT change it.
    Generate a single high-quality image with the EXACT same product appearance.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: visualDirectives }
        ]
      },
      config: {
        responseModalities: ['Text', 'Image']
      }
    });

    // Check for image in response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }

    // If no image generated, fall back to using the original image
    console.warn("No image generated by AI, using original image");
    return `data:image/png;base64,${base64Image}`;
  } catch (error: any) {
    console.error("Image generation error:", error);
    // Fall back to original image on error
    return `data:image/png;base64,${base64Image}`;
  }
};
