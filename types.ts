
export enum EmotionalTone {
  BOLD = 'bold',
  PREMIUM = 'premium',
  PLAYFUL = 'playful',
  MINIMAL = 'minimal',
  ENERGETIC = 'energetic'
}

export interface ElementTransform {
  x: number;
  y: number;
  scale: number;
  layer?: 'front' | 'back';
}

export interface PosterContent {
  brand_name: string;
  short_slogan: string;
  long_slogan: string;
  cta_text: string;
  background_word: string;
  emotional_tone: EmotionalTone;
  product_category: string;
  company_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
  transforms?: {
    brand?: ElementTransform;
    short?: ElementTransform;
    long?: ElementTransform;
    backgroundWord?: ElementTransform;
    cta?: ElementTransform;
    contact?: ElementTransform;
    product?: ElementTransform;
  };
}

export interface PosterLayout {
  id: string;
  name: string;
  fontFamily: string;
  sloganColor: string;
  positioning: 'center' | 'bottom' | 'top' | 'overlay';
}

export interface GenerationState {
  originalImage: string | null;
  enhancedImage: string | null;
  content: PosterContent | null;
  loading: boolean;
  error: string | null;
  editMode: boolean;
  inputs: {
    brandName: string;
    customSlogan: string;
    context: string;
    visualDescription: string;
    phone: string;
    email: string;
    website: string;
  };
}
