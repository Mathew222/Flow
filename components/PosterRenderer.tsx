
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
      case 'overlay': return 'justify-center items-start pl-12';
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

  const getBrandStyle = () => {
    switch (content.emotional_tone) {
      case EmotionalTone.PREMIUM: return 'font-["Playfair_Display"] border-b border-white/30 pb-1 mb-4';
      default: return 'font-["Inter"] font-black tracking-tighter uppercase mb-2';
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
      <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 pointer-events-none`} />

      {/* Content Layer */}
      <div className={`absolute inset-0 flex flex-col ${getLayoutClasses()} p-12 text-white text-center sm:text-left`}>
        <div className="max-w-lg space-y-2">
          <div className="flex flex-col mb-6">
             <span className={`${getBrandStyle()} text-xl md:text-2xl drop-shadow-lg`}>
                {content.brand_name}
             </span>
             <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60">
                {content.product_category}
             </span>
          </div>
          
          <h1 className={`${getTextStyle()} leading-[0.9] mb-4 break-words drop-shadow-xl`}
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', color: layout.sloganColor }}>
            {content.short_slogan}
          </h1>
          
          <p className="text-base md:text-lg font-medium opacity-80 leading-relaxed max-w-sm drop-shadow-md">
            {content.long_slogan}
          </p>

          <div className="pt-8">
            <button className="px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] text-xs hover:bg-neutral-200 transition-all active:scale-95 shadow-xl">
              Shop Now
            </button>
          </div>
        </div>
      </div>

      {/* Brand Watermark */}
      <div className="absolute top-8 right-8 text-white/30 text-xs font-black italic tracking-tighter select-none">
        FLOW.SYSTEM
      </div>
    </div>
  );
};

export default PosterRenderer;
