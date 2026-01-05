
import React from 'react';
import { PosterContent, PosterLayout, EmotionalTone } from '../types';

interface PosterRendererProps {
  imageUrl: string;
  content: PosterContent;
  layout: PosterLayout;
}

const PosterRenderer: React.FC<PosterRendererProps> = ({ imageUrl, content, layout }) => {
  const getLayoutClasses = () => {
    switch (layout.positioning) {
      case 'bottom': return 'justify-end items-center pb-12';
      case 'top': return 'justify-start items-center pt-12';
      case 'center': return 'justify-center items-center';
      case 'overlay': return 'justify-center items-start pl-8';
      default: return 'justify-center items-center';
    }
  };

  const getTextStyle = () => {
    switch (content.emotional_tone) {
      case EmotionalTone.BOLD: return 'font-["Bebas_Neue"] tracking-widest uppercase italic';
      case EmotionalTone.PREMIUM: return 'font-["Playfair_Display"] italic';
      case EmotionalTone.PLAYFUL: return 'font-["Inter"] font-black lowercase';
      case EmotionalTone.MINIMAL: return 'font-["Inter"] font-light tracking-[0.2em] uppercase';
      case EmotionalTone.ENERGETIC: return 'font-["Inter"] font-extrabold tracking-tighter uppercase';
      default: return 'font-["Inter"] font-bold';
    }
  };

  return (
    <div className="relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-2xl bg-black">
      <img 
        src={imageUrl} 
        alt="Poster Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-700"
      />
      
      {/* Dynamic Overlay Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none`} />

      {/* Content Layer */}
      <div className={`absolute inset-0 flex flex-col ${getLayoutClasses()} p-8 text-white text-center sm:text-left`}>
        <div className="max-w-lg space-y-4">
          <p className="text-xs font-bold uppercase tracking-[0.3em] opacity-80 mb-2">
            {content.product_category}
          </p>
          
          <h1 className={`${getTextStyle()} leading-none mb-4 break-words drop-shadow-lg`}
              style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', color: layout.sloganColor }}>
            {content.short_slogan}
          </h1>
          
          <p className="text-lg md:text-xl font-medium opacity-90 leading-relaxed max-w-sm drop-shadow-md">
            {content.long_slogan}
          </p>

          <div className="pt-8">
            <button className="px-8 py-3 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-opacity-90 transition-all active:scale-95">
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Brand Watermark */}
      <div className="absolute top-8 right-8 text-white/40 text-sm font-black italic tracking-tighter">
        FLOW.SYSTEM
      </div>
    </div>
  );
};

export default PosterRenderer;
