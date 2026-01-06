
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
      case EmotionalTone.BOLD: return 'font-["Bebas_Neue"] tracking-[0.05em] uppercase italic';
      case EmotionalTone.PREMIUM: return 'font-["Playfair_Display"] italic leading-[1.05] tracking-tight';
      case EmotionalTone.PLAYFUL: return 'font-["Inter"] font-black tracking-tighter leading-[0.85]';
      case EmotionalTone.MINIMAL: return 'font-["Inter"] font-light tracking-[0.5em] uppercase leading-relaxed';
      case EmotionalTone.ENERGETIC: return 'font-["Inter"] font-extrabold tracking-tight uppercase italic leading-[0.9]';
      default: return 'font-["Inter"] font-bold leading-tight';
    }
  };

  useEffect(() => {
    if (!content.transforms) {
      const initialTransforms: any = {
        brand: { x: 0, y: -300, scale: 1, layer: 'front' },
        short: { x: 0, y: -180, scale: 0.65, layer: 'front' },
        backgroundWord: { x: 0, y: 40, scale: 1.1, layer: 'back' },
        cta: { x: 0, y: 280, scale: 1, layer: 'front' },
        contact: { x: 0, y: 360, scale: 1, layer: 'front' }
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
    const newScale = Math.max(0.1, Math.min(10, current.scale + delta));
    
    const newTransforms = {
      ...(content.transforms || {}),
      [id]: { ...current, scale: newScale }
    };
    onUpdateContent({ ...content, transforms: newTransforms });
  };

  const centerElement = (id: string) => {
    const current = content.transforms?.[id as keyof NonNullable<PosterContent['transforms']>] || { x: 0, y: 0, scale: 1, layer: 'front' };
    const newTransforms = {
      ...(content.transforms || {}),
      [id]: { ...current, x: 0 }
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
      ? 'opacity-30 blur-[6px] mix-blend-overlay' 
      : 'opacity-100 drop-shadow-[0_10px_40px_rgba(0,0,0,0.85)]';

    return (
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all pointer-events-auto ${editMode ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-8 ring-offset-black/20 rounded-2xl z-[300]' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
          zIndex: isSelected ? 400 : (transform.layer === 'back' ? 5 : 100),
          width: id === 'backgroundWord' ? '140%' : '85%',
          display: 'flex',
          justifyContent: 'center'
        }}
        onMouseDown={(e) => handleDragStart(e, id)}
      >
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => updateText(id, e.currentTarget.textContent || '')}
          onClick={(e) => { if (editMode) { e.stopPropagation(); setSelectedElement(id); } }}
          className={`${defaultStyle} ${layerStyle} outline-none focus:ring-0 focus:border-0 text-center transition-all duration-300 select-none
            ${id !== 'backgroundWord' ? 'whitespace-pre-line text-wrap-balance' : 'whitespace-nowrap'} 
            break-words [word-break:keep-all] [hyphens:none]`}
          style={{ 
            fontSize, 
            color: color || 'inherit', 
            width: '100%',
          }}
        >
          {text}
        </div>
        
        {isSelected && (
          <div className="editor-controls absolute -top-28 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-3xl p-2.5 rounded-[2rem] border border-white/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,1)] z-[500] pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center bg-black/60 rounded-2xl p-1 gap-1">
              <button 
                onMouseDown={(e) => { e.stopPropagation(); updateScale(id, -0.05); }}
                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-all text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
              </button>
              <div className="text-[12px] font-black text-white px-3 min-w-[60px] text-center font-mono">
                {Math.round(transform.scale * 100)}%
              </div>
              <button 
                onMouseDown={(e) => { e.stopPropagation(); updateScale(id, 0.05); }}
                className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 active:scale-90 transition-all text-white"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>
            
            <div className="w-[1px] h-10 bg-white/10 mx-1" />
            
            <button 
              onClick={(e) => { e.stopPropagation(); centerElement(id); }}
              className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Align Center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M10 12h4M4 18h16" /></svg>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); toggleLayer(id); }} 
              className={`h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${transform.layer === 'back' ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
            >
              {transform.layer === 'back' ? 'DEPTH ON' : 'PUSH BACK'}
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
      className={`relative w-full aspect-[3/4] max-h-[75vh] md:max-h-[85vh] overflow-hidden rounded-[4rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] bg-black transition-all duration-700 ${editMode ? 'ring-[12px] ring-yellow-400/40 scale-[0.96] rounded-[5rem]' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget && editMode) setSelectedElement(null); }}
    >
      <img src={enhancedImageUrl} alt="Composition" className="absolute inset-0 w-full h-full object-cover opacity-100 select-none" draggable={false} crossOrigin="anonymous" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none z-[8]" />

      {renderEditableElement('backgroundWord', 'font-["Inter"] font-black text-white/[0.08] leading-none uppercase tracking-tighter select-none pointer-events-none', content.background_word, '24rem')}
      {renderEditableElement('brand', 'font-["Inter"] font-black tracking-[0.8em] uppercase text-white/30', content.brand_name, '1.2rem')}
      {renderEditableElement('short', getTextStyle(), content.short_slogan, '4.8rem', '#FFFFFF')}
      
      <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-10 pointer-events-none">
        {content.cta_text && renderEditableElement('cta', 'bg-white text-black px-16 py-7 font-black uppercase tracking-[0.5em] shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-full', content.cta_text, '0.8rem', undefined, true)}
        {infoText && renderEditableElement('contact', 'font-mono tracking-[0.4em] uppercase opacity-20 border-t border-white/5 pt-10 w-[70%] text-center leading-loose', infoText, '0.6rem')}
      </div>

      <div className="absolute top-16 right-20 text-white/5 text-[10px] font-black uppercase tracking-[2em] select-none pointer-events-none z-[200]">
        FLOW.OS
      </div>
    </div>
  );
};

export default PosterRenderer;
