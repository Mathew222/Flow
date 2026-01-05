
export enum EmotionalTone {
  BOLD = 'bold',
  PREMIUM = 'premium',
  PLAYFUL = 'playful',
  MINIMAL = 'minimal',
  ENERGETIC = 'energetic'
}

export enum PosterStyle {
  COSMIC_LEVITATION = 'Cosmic Levitation',
  DECONSTRUCTED_SPLASH = 'Deconstructed Splash',
  EDITORIAL_INGREDIENTS = 'Editorial Beauty',
  TECHNICAL_BLUEPRINT = 'Technical Blueprint',
  MINIMAL_BRUTALIST = 'Minimal Brutalist',
  GLOW_PORTAL = 'Glow Portal'
}

export interface ElementTransform {
  x: number;
  y: number;
  scale: number;
}

export interface PosterContent {
  brand_name: string;
  short_slogan: string;
  long_slogan: string;
  cta_text: string;
  background_word: string;
  emotional_tone: EmotionalTone;
  product_category: string;
  transforms?: {
    brand?: ElementTransform;
    short?: ElementTransform;
    long?: ElementTransform;
    backgroundWord?: ElementTransform;
    cta?: ElementTransform;
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
  selectedStyle: PosterStyle;
  inputs: {
    brandName: string;
    customSlogan: string;
    context: string;
  };
}
