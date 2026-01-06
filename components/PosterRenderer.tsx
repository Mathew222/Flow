
import React, { useState, useRef, useEffect } from 'react';
import { PosterContent, PosterLayout, EmotionalTone, ElementTransform } from '../types';

interface PosterRendererProps {
  originalImageUrl: string | null;
  enhancedImageUrl: string;
  content: PosterContent;
  layout: PosterLayout;
  editMode: boolean;
  onUpdateContent: (newContent: PosterContent) => void;
}

const PosterRenderer: React.FC<PosterRendererProps> = ({ originalImageUrl, enhancedImageUrl, content, layout, editMode, onUpdateContent }) => {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
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

  // Default positions to avoid the center (where the product usually is)
  useEffect(() => {
    if (!content.transforms) {
      const initialTransforms: any = {
        brand: { x: 0, y: -260, scale: 1, layer: 'front' },
        short: { x: 0, y: -180, scale: 1, layer: 'front' },
        backgroundWord: { x: 0, y: 0, scale: 1, layer: 'back' },
        cta: { x: 0, y: 240, scale: 1, layer: 'front' },
        contact: { x: 0, y: 340, scale: 1, layer: 'front' }
      };
      onUpdateContent({ ...content, transforms: initialTransforms });
    }
  }, []);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    if (!editMode) return;
    if ((e.target as HTMLElement).closest('.editor-controls')) return;

    setSelectedElement(id);
    const transform = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1, layer: 'front' };
    
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
          ...(content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { scale: 1, layer: 'front' }),
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
        ...(content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, layer: 'front' }),
        scale: scale,
      }
    };
    onUpdateContent({ ...content, transforms: newTransforms });
  };

  const toggleLayer = (id: string) => {
    const currentTransform = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1, layer: 'front' };
    const newLayer = currentTransform.layer === 'back' ? 'front' : 'back';
    const newTransforms = {
      ...(content.transforms || {}),
      [id]: { ...currentTransform, layer: newLayer }
    };
    onUpdateContent({ ...content, transforms: newTransforms });
  };

  const updateText = (id: string, text: string) => {
    const fieldMap: any = {
      brand: 'brand_name',
      short: 'short_slogan',
      backgroundWord: 'background_word',
      cta: 'cta_text',
      phone: 'phone',
      email: 'email',
      website: 'website'
    };
    const field = fieldMap[id];
    if (!field) return;

    if (['phone', 'email', 'website'].includes(field)) {
      onUpdateContent({
        ...content,
        company_info: { ...content.company_info, [field]: text }
      });
    } else {
      onUpdateContent({ ...content, [field as keyof PosterContent]: text });
    }
  };

  const renderEditableElement = (id: string, defaultStyle: string, text: string, fontSize: string, color?: string, isButton: boolean = false) => {
    if (!text && !editMode) return null;
    
    const transform = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1, layer: id === 'backgroundWord' ? 'back' : 'front' };
    const isSelected = selectedElement === id && editMode;

    const layerStyle = transform.layer === 'back' 
      ? 'opacity-40 blur-[1.5px]' 
      : 'opacity-100 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]';

    return (
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all pointer-events-auto ${editMode ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black rounded-sm z-[300]' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
          zIndex: isSelected ? 400 : (transform.layer === 'back' ? 10 : 100)
        }}
        onMouseDown={(e) => handleDragStart(e, id)}
      >
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => updateText(id, e.currentTarget.textContent || '')}
          onClick={(e) => { if (editMode) { e.stopPropagation(); setSelectedElement(id); } }}
          className={`${defaultStyle} ${layerStyle} outline-none focus:ring-0 focus:border-0 whitespace-nowrap text-center ${isButton && !text ? 'hidden' : ''}`}
          style={{ fontSize, color: color || 'inherit' }}
        >
          {text}
        </div>
        
        {isSelected && (
          <div className="editor-controls absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/95 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/20 shadow-2xl z-[500] pointer-events-auto">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] uppercase font-black text-white/40 px-1">Scale</label>
              <input type="range" min="0.1" max="8" step="0.05" value={transform.scale} onChange={(e) => { e.stopPropagation(); updateScale(id, parseFloat(e.target.value)); }} className="w-24 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
            </div>
            <div className="w-[1px] h-8 bg-white/10 mx-1" />
            <button onClick={(e) => { e.stopPropagation(); toggleLayer(id); }} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all whitespace-nowrap ${transform.layer === 'back' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}>
              {transform.layer === 'back' ? 'Depth Active' : 'Push Back'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const infoText = [content.company_info.phone, content.company_info.email, content.company_info.website].filter(Boolean).join(' • ');

  return (
    <div 
      id="poster-canvas-target"
      className={`relative w-full aspect-[3/4] overflow-hidden rounded-[3rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] bg-black ${editMode ? 'ring-4 ring-yellow-400' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget && editMode) setSelectedElement(null); }}
    >
      {/* Background with AI-generated Integrated Product (The product is now INSIDE this image) */}
      <img src={enhancedImageUrl} alt="Masterpiece" className="absolute inset-0 w-full h-full object-cover opacity-100 select-none" draggable={false} crossOrigin="anonymous" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none z-[5]" />

      {/* Layer: All Typography - Layering is handled by individual z-indices and filters */}
      {renderEditableElement('backgroundWord', 'font-["Inter"] font-black text-white/[0.08] leading-none uppercase tracking-tighter select-none', content.background_word, '18rem')}
      {renderEditableElement('brand', 'font-["Inter"] font-black tracking-tighter uppercase text-white opacity-80', content.brand_name, '1.5rem')}
      {renderEditableElement('short', getTextStyle() + ' leading-[0.85]', content.short_slogan, '5rem', '#FFFFFF')}
      {renderEditableElement('cta', 'bg-white text-black px-12 py-4 font-black uppercase tracking-[0.2em] shadow-2xl', content.cta_text, '0.875rem', undefined, true)}
      {infoText && renderEditableElement('contact', 'font-mono tracking-widest uppercase opacity-40 border-t border-white/10 pt-4 w-[400px]', infoText, '0.7rem')}

      <div className="absolute top-10 right-14 text-white/10 text-[9px] font-black uppercase tracking-[1em] select-none pointer-events-none z-[200]">
        FLOW.SYSTEM.EXPORT
      </div>
    </div>
  );
};

export default PosterRenderer;