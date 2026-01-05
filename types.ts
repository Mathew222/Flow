
export enum EmotionalTone {
  BOLD = 'bold',
  PREMIUM = 'premium',
  PLAYFUL = 'playful',
  MINIMAL = 'minimal',
  ENERGETIC = 'energetic'
}

export interface PosterContent {
  short_slogan: string;
  long_slogan: string;
  emotional_tone: EmotionalTone;
  product_category: string;
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
}
