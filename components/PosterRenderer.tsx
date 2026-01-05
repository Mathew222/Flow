
import React, { useState, useRef, useEffect } from 'react';
import { PosterContent, PosterLayout, EmotionalTone, ElementTransform } from '../types';

interface PosterRendererProps {
  imageUrl: string;
  content: PosterContent;
  layout: PosterLayout;
  editMode: boolean;
  onUpdateContent: (newContent: PosterContent) => void;
}

const PosterRenderer: React.FC<PosterRendererProps> = ({ imageUrl, content, layout, editMode, onUpdateContent }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; startX: number; startY: number; initialX: number; initialY: number } | null>(null);

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

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!editMode) return;
    
    // Only drag if not clicking the range slider
    if ((e.target as HTMLElement).closest('input[type="range"]')) return;

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
      long: 'long_slogan'
    };
    const field = fieldMap[id];
    if (field) {
      onUpdateContent({ ...content, [field]: text });
    }
  };

  const renderEditableElement = (id: string, defaultStyle: string, text: string, fontSize: string, color?: string) => {
    const transform = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1 };
    const isSelected = selectedElement === id && editMode;

    return (
      <div
        className={`relative group/element transition-shadow ${editMode ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-4 ring-offset-black rounded-sm' : ''}`}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: 'center center',
          zIndex: isSelected ? 50 : 10
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
            className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/90 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/20 shadow-2xl z-[60] pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()} // Prevent drag when interacting with slider
          >
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Scale</span>
                <span className="text-[9px] font-bold text-yellow-400">{Math.round(transform.scale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="4"
                step="0.05"
                value={transform.scale}
                onChange={(e) => updateScale(id, parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedElement(null); }}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
               <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-[3/4] overflow-hidden rounded-xl shadow-2xl bg-black ${editMode ? 'ring-4 ring-yellow-400/50' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && editMode) setSelectedElement(null);
      }}
    >
      <img 
        src={imageUrl} 
        alt="Poster Background" 
        className="absolute inset-0 w-full h-full object-cover opacity-90 select-none"
        draggable={false}
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 pointer-events-none" />

      <div className={`absolute inset-0 flex flex-col ${getLayoutClasses()} p-12 text-white text-center sm:text-left pointer-events-none`}>
        <div className="max-w-lg flex flex-col items-center sm:items-start pointer-events-auto">
          <div className="flex flex-col mb-6 items-center sm:items-start">
             {renderEditableElement('brand', getBrandStyle(), content.brand_name, '1.5rem')}
             <span className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-60 pointer-events-none mt-2">
                {content.product_category}
             </span>
          </div>
          
          {renderEditableElement('short', getTextStyle(), content.short_slogan, 'clamp(2.5rem, 7vw, 5rem)', layout.sloganColor)}
          
          <div className="mt-4">
            {renderEditableElement('long', 'text-base md:text-lg font-medium opacity-80 leading-relaxed max-w-sm drop-shadow-md', content.long_slogan, '1.125rem')}
          </div>

          <div className="pt-8 pointer-events-none">
            <button className="px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] text-xs shadow-xl">
              Shop Now
            </button>
          </div>
        </div>
      </div>

      <div className="absolute top-8 right-8 text-white/30 text-xs font-black italic tracking-tighter select-none">
        FLOW.SYSTEM
      </div>

      {editMode && (
        <div className="absolute top-4 left-4 bg-yellow-400 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-xl z-[70]">
          Interactive Mode
        </div>
      )}
    </div>
  );
};

export default PosterRenderer;
