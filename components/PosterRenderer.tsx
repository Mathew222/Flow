
import React, { useState, useRef, useEffect } from 'react';
import { PosterContent, PosterLayout, EmotionalTone, ElementTransform, PosterStyle } from '../types';

interface PosterRendererProps {
  imageUrl: string;
  content: PosterContent;
  layout: PosterLayout;
  selectedStyle: PosterStyle;
  editMode: boolean;
  onUpdateContent: (newContent: PosterContent) => void;
}

const PosterRenderer: React.FC<PosterRendererProps> = ({ imageUrl, content, layout, selectedStyle, editMode, onUpdateContent }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const getTextStyle = () => {
    switch (content.emotional_tone) {
      case EmotionalTone.BOLD: return 'font-["Bebas_Neue"] tracking-widest uppercase italic';
      case EmotionalTone.PREMIUM: return 'font-["Playfair_Display"] italic leading-tight';
      case EmotionalTone.PLAYFUL: return 'font-["Inter"] font-black tracking-tight';
      case EmotionalTone.MINIMAL: return 'font-["Inter"] font-light tracking-[0.2em] uppercase';
      case EmotionalTone.ENERGETIC: return 'font-["Inter"] font-extrabold tracking-tighter uppercase italic';
      default: return 'font-["Inter"] font-bold';
    }
  };

  const getBrandStyle = () => {
    switch (content.emotional_tone) {
      case EmotionalTone.PREMIUM: return 'font-["Playfair_Display"] border-b border-white/30 pb-1 mb-2 tracking-widest uppercase text-sm';
      default: return 'font-["Inter"] font-black tracking-tighter uppercase mb-1 text-base';
    }
  };

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!editMode) return;
    if ((e.target as HTMLElement).closest('.scale-control-container')) return;

    setSelectedElement(id);
    const transform = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1 };
    
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: transform.x,
      initialY: transform.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current || !editMode) return;
      const { id, startX, startY, initialX, initialY } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const newTransforms = {
        ...(content.transforms || {}),
        [id]: {
          ...(content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { scale: 1 }),
          x: initialX + dx,
          y: initialY + dy,
        }
      };

      onUpdateContent({ ...content, transforms: newTransforms });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
    };

    if (editMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editMode, content, onUpdateContent]);

  const updateScale = (id: string, scale: number) => {
    const newTransforms = {
      ...(content.transforms || {}),
      [id]: {
        ...(content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0 }),
        scale: scale,
      }
    };
    onUpdateContent({ ...content, transforms: newTransforms });
  };

  const updateText = (id: string, text: string) => {
    const fieldMap: Record<string, keyof PosterContent> = {
      brand: 'brand_name',
      short: 'short_slogan',
      long: 'long_slogan',
      bg: 'background_word',
      cta: 'cta_text'
    };
    const field = fieldMap[id];
    if (field) {
      onUpdateContent({ ...content, [field]: text });
    }
  };

  const renderEditableElement = (id: string, defaultStyle: string, text: string, fontSize: string, color?: string, extraClass?: string) => {
    const transform = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1 };
    const isSelected = selectedElement === id && editMode;

    return (
      <div
        className={`relative group/element transition-shadow pointer-events-auto ${editMode ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black rounded-sm' : ''} ${extraClass || ''}`}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
          zIndex: isSelected ? 100 : (id === 'bg' ? 5 : 50)
        }}
        onMouseDown={(e) => handleDragStart(e, id)}
      >
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => updateText(id, e.currentTarget.textContent || '')}
          onClick={(e) => {
            if (editMode) {
              e.stopPropagation();
              setSelectedElement(id);
            }
          }}
          className={`${defaultStyle} outline-none focus:ring-0 focus:border-0`}
          style={{ fontSize, color: color || 'inherit' }}
        >
          {text}
        </div>
        
        {isSelected && (
          <div 
            className="scale-control-container absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/95 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/20 shadow-2xl z-[150] pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()} 
          >
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.05"
              value={transform.scale}
              onChange={(e) => {
                e.stopPropagation();
                updateScale(id, parseFloat(e.target.value));
              }}
              className="w-24 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />
            <button onClick={(e) => { e.stopPropagation(); setSelectedElement(null); }} className="text-white hover:text-yellow-400">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderLayout = () => {
    switch (selectedStyle) {
      case PosterStyle.COSMIC_LEVITATION:
        return (
          <div className="absolute inset-0 flex flex-col justify-end items-center p-16 text-center">
            {renderEditableElement('brand', 'font-["Playfair_Display"] tracking-[0.5em] opacity-40 uppercase mb-4', content.brand_name, '0.75rem')}
            {renderEditableElement('short', 'font-["Playfair_Display"] leading-tight italic drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]', content.short_slogan, '3.5rem')}
            {renderEditableElement('long', 'font-["Inter"] font-light opacity-60 mt-4 tracking-widest max-w-sm', content.long_slogan, '0.875rem')}
          </div>
        );
      case PosterStyle.MINIMAL_BRUTALIST:
        return (
          <div className="absolute inset-0 flex flex-col p-12">
            <div className="absolute top-12 left-12">
               {renderEditableElement('bg', 'font-["Inter"] font-black text-white/[0.03] leading-none pointer-events-none select-none', content.background_word, '25rem', undefined, '-rotate-90 origin-top-left translate-y-[25rem]')}
            </div>
            <div className="mt-auto max-w-sm">
               {renderEditableElement('brand', 'font-["Bebas_Neue"] tracking-tighter mb-2', content.brand_name, '2rem')}
               {renderEditableElement('short', 'font-["Bebas_Neue"] leading-[0.85] uppercase italic', content.short_slogan, '6rem')}
               <div className="mt-8">
                 {renderEditableElement('cta', 'bg-yellow-400 text-black px-8 py-3 font-black uppercase text-sm inline-block', content.cta_text, '0.875rem')}
               </div>
            </div>
          </div>
        );
      case PosterStyle.EDITORIAL_INGREDIENTS:
        return (
          <div className="absolute inset-0 p-12 flex flex-col">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none">
               {renderEditableElement('bg', 'font-["Inter"] font-black text-white/[0.04] leading-none uppercase tracking-tighter', content.background_word, '20rem')}
            </div>
            <div className="relative z-10">
               {renderEditableElement('brand', 'font-["Playfair_Display"] italic tracking-widest border-b border-white/20 pb-2 inline-block', content.brand_name, '1rem')}
            </div>
            <div className="mt-auto flex justify-between items-end">
               <div className="max-w-xs">
                 {renderEditableElement('short', 'font-["Playfair_Display"] leading-none mb-4', content.short_slogan, '3rem')}
                 {renderEditableElement('long', 'font-["Inter"] text-white/50 leading-relaxed', content.long_slogan, '0.875rem')}
               </div>
               {renderEditableElement('cta', 'w-24 h-24 rounded-full border-2 border-white/20 flex items-center justify-center text-center font-bold text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all', content.cta_text, '0.625rem')}
            </div>
          </div>
        );
      case PosterStyle.TECHNICAL_BLUEPRINT:
        return (
          <div className="absolute inset-0 p-12 flex flex-col font-mono">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="flex justify-between items-start relative z-10">
               <div>
                 {renderEditableElement('brand', 'font-bold tracking-[0.3em] uppercase opacity-50 mb-1', content.brand_name, '0.75rem')}
                 {renderEditableElement('short', 'font-black uppercase', content.short_slogan, '2.5rem')}
               </div>
               <div className="text-right">
                 <div className="text-[10px] opacity-30 mb-2 uppercase">Tech Specs v1.02</div>
                 {renderEditableElement('cta', 'border border-white/20 px-4 py-2 uppercase', content.cta_text, '0.75rem')}
               </div>
            </div>
            <div className="mt-auto max-w-xs relative z-10">
               <div className="h-[1px] w-full bg-white/20 mb-4" />
               {renderEditableElement('long', 'opacity-40 leading-relaxed italic', content.long_slogan, '0.75rem')}
            </div>
          </div>
        );
      case PosterStyle.DECONSTRUCTED_SPLASH:
      case PosterStyle.GLOW_PORTAL:
      default:
        return (
          <div className="absolute inset-0 p-12 flex flex-col items-center text-center">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full pointer-events-none">
                {renderEditableElement('bg', 'font-["Inter"] font-black text-white/5 leading-none uppercase tracking-tighter', content.background_word, '18rem')}
             </div>
             <div className="mt-auto relative z-10 w-full">
                {renderEditableElement('short', getTextStyle() + ' leading-[0.8] mb-4', content.short_slogan, '6rem')}
                <div className="flex flex-col items-center">
                   {renderEditableElement('brand', getBrandStyle() + ' opacity-50', content.brand_name, '1rem')}
                   <div className="mt-6">
                      {renderEditableElement('cta', 'bg-white text-black px-12 py-4 font-black uppercase tracking-[0.3em]', content.cta_text, '0.75rem')}
                   </div>
                </div>
             </div>
          </div>
        );
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] bg-black ${editMode ? 'ring-4 ring-yellow-400' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget && editMode) setSelectedElement(null); }}
    >
      <img 
        src={imageUrl} 
        alt="Poster Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-90 select-none"
        draggable={false}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      <div className="absolute inset-0 pointer-events-none">
        {renderLayout()}
      </div>

      <div className="absolute top-8 right-8 text-white/10 text-[9px] font-black uppercase tracking-[0.5em] select-none">
        FLOW.RENDER.SYSTEM
      </div>

      {editMode && (
        <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse z-[200]">
          Visual Tuning Mode
        </div>
      )}
    </div>
  );
};

export default PosterRenderer;
