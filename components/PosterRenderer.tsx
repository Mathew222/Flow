
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

  useEffect(() => {
    if (!content.transforms) {
      const initialTransforms: any = {
        brand: { x: 0, y: -280, scale: 1, layer: 'front' },
        short: { x: 0, y: -160, scale: 0.8, layer: 'front' },
        backgroundWord: { x: 0, y: 0, scale: 1, layer: 'back' },
        cta: { x: 0, y: 260, scale: 1, layer: 'front' },
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

  const updateScale = (id: string, delta: number) => {
    const current = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1, layer: 'front' };
    const newScale = Math.max(0.1, Math.min(8, current.scale + delta));
    
    const newTransforms = {
      ...(content.transforms || {}),
      [id]: { ...current, scale: newScale }
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
      ? 'opacity-40 blur-[2px]' 
      : 'opacity-100 drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]';

    return (
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all pointer-events-auto ${editMode ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-4 ring-offset-black rounded-lg z-[300]' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
          zIndex: isSelected ? 400 : (transform.layer === 'back' ? 10 : 100),
          maxWidth: '85%', // Prevent text from going off-poster
        }}
        onMouseDown={(e) => handleDragStart(e, id)}
      >
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => updateText(id, e.currentTarget.textContent || '')}
          onClick={(e) => { if (editMode) { e.stopPropagation(); setSelectedElement(id); } }}
          className={`${defaultStyle} ${layerStyle} outline-none focus:ring-0 focus:border-0 whitespace-normal text-center leading-tight transition-opacity duration-300 ${isButton && !text ? 'hidden' : ''}`}
          style={{ fontSize, color: color || 'inherit', width: 'auto' }}
        >
          {text}
        </div>
        
        {isSelected && (
          <div className="editor-controls absolute -top-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/90 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-[500] pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center bg-white/5 rounded-xl px-2 py-1 gap-3">
              <button 
                onMouseDown={(e) => { e.stopPropagation(); updateScale(id, -0.05); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all text-white font-bold"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
              </button>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-tighter w-10 text-center select-none">
                {Math.round(transform.scale * 100)}%
              </div>
              <button 
                onMouseDown={(e) => { e.stopPropagation(); updateScale(id, 0.05); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 active:scale-90 transition-all text-white font-bold"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            <div className="w-[1px] h-8 bg-white/10 mx-1" />
            <button 
              onClick={(e) => { e.stopPropagation(); toggleLayer(id); }} 
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${transform.layer === 'back' ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
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
      className={`relative w-full aspect-[3/4] overflow-hidden rounded-[4rem] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] bg-black transition-all duration-500 ${editMode ? 'ring-4 ring-yellow-400 scale-[0.98]' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget && editMode) setSelectedElement(null); }}
    >
      <img src={enhancedImageUrl} alt="Masterpiece" className="absolute inset-0 w-full h-full object-cover opacity-100 select-none" draggable={false} crossOrigin="anonymous" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none z-[5]" />

      {renderEditableElement('backgroundWord', 'font-["Inter"] font-black text-white/[0.06] leading-none uppercase tracking-tighter select-none pointer-events-none', content.background_word, '18rem')}
      {renderEditableElement('brand', 'font-["Inter"] font-black tracking-widest uppercase text-white/60 mb-2', content.brand_name, '1.2rem')}
      {renderEditableElement('short', getTextStyle(), content.short_slogan, '4.5rem', '#FFFFFF')}
      {renderEditableElement('cta', 'bg-white text-black px-12 py-5 font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(255,255,255,0.2)] rounded-full', content.cta_text, '0.8rem', undefined, true)}
      {infoText && renderEditableElement('contact', 'font-mono tracking-widest uppercase opacity-30 border-t border-white/5 pt-6 w-[80%]', infoText, '0.65rem')}

      <div className="absolute top-12 right-16 text-white/10 text-[8px] font-black uppercase tracking-[1.5em] select-none pointer-events-none z-[200]">
        FLOW.ART.PRO
      </div>
    </div>
  );
};

export default PosterRenderer;
