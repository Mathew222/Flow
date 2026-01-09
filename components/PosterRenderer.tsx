
import React, { useState, useRef, useEffect } from 'react';
import { PosterContent, PosterLayout, EmotionalTone, ElementTransform } from '../types';

interface PosterRendererProps {
  originalImageUrl: string | null;
  enhancedImageUrl: string;
  useOriginalProduct: boolean;
  content: PosterContent;
  layout: PosterLayout;
  editMode: boolean;
  onUpdateContent: (newContent: PosterContent) => void;
}

const PosterRenderer: React.FC<PosterRendererProps> = ({ originalImageUrl, enhancedImageUrl, useOriginalProduct, content, layout, editMode, onUpdateContent }) => {
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

  // Premium gradient text styles
  const getGradientTextStyle = (): React.CSSProperties => {
    const gradients: Record<string, string> = {
      [EmotionalTone.BOLD]: 'linear-gradient(135deg, #FACC15 0%, #F97316 50%, #EF4444 100%)',
      [EmotionalTone.PREMIUM]: 'linear-gradient(135deg, #FDE68A 0%, #FBBF24 30%, #F59E0B 50%, #FBBF24 70%, #FDE68A 100%)',
      [EmotionalTone.PLAYFUL]: 'linear-gradient(135deg, #F472B6 0%, #A855F7 50%, #6366F1 100%)',
      [EmotionalTone.MINIMAL]: 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 50%, #FFFFFF 100%)',
      [EmotionalTone.ENERGETIC]: 'linear-gradient(135deg, #22D3EE 0%, #3B82F6 50%, #8B5CF6 100%)',
    };
    return {
      background: gradients[content.emotional_tone] || 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    };
  };

  // Enhanced multi-layer text shadow with glow
  const getEnhancedTextShadow = (id: string): string => {
    if (id === 'short') {
      // Main slogan gets extra glow
      switch (content.emotional_tone) {
        case EmotionalTone.BOLD:
          return '0 0 20px rgba(250, 204, 21, 0.8), 0 0 40px rgba(249, 115, 22, 0.6), 0 0 80px rgba(239, 68, 68, 0.4), 0 4px 20px rgba(0,0,0,0.9)';
        case EmotionalTone.PREMIUM:
          return '0 0 30px rgba(251, 191, 36, 0.5), 0 0 60px rgba(245, 158, 11, 0.3), 0 6px 30px rgba(0,0,0,0.9)';
        case EmotionalTone.PLAYFUL:
          return '0 0 25px rgba(244, 114, 182, 0.7), 0 0 50px rgba(168, 85, 247, 0.5), 0 0 80px rgba(99, 102, 241, 0.3), 0 4px 20px rgba(0,0,0,0.8)';
        case EmotionalTone.MINIMAL:
          return '0 2px 10px rgba(0,0,0,0.3), 0 4px 30px rgba(0,0,0,0.5)';
        case EmotionalTone.ENERGETIC:
          return '0 0 30px rgba(34, 211, 238, 0.8), 0 0 60px rgba(59, 130, 246, 0.6), 0 0 100px rgba(139, 92, 246, 0.4), 0 4px 20px rgba(0,0,0,0.8)';
        default:
          return '0 4px 30px rgba(0,0,0,0.7)';
      }
    }
    if (id === 'brand') {
      return '0 0 20px rgba(255,255,255,0.3), 0 2px 10px rgba(0,0,0,0.8)';
    }
    return '0 4px 20px rgba(0,0,0,0.7)';
  };

  useEffect(() => {
    if (!content.transforms) {
      const initialTransforms: any = {
        brand: { x: 0, y: -200, scale: 1, layer: 'front' },
        short: { x: 0, y: -120, scale: 1, layer: 'front' },
        backgroundWord: { x: 0, y: 80, scale: 1, layer: 'back' },
        cta: { x: 0, y: 220, scale: 1, layer: 'front' },
        contact: { x: 0, y: 280, scale: 1, layer: 'front' }
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

    const isGradientText = id === 'short' && transform.layer !== 'back';
    const textShadow = transform.layer !== 'back' ? getEnhancedTextShadow(id) : 'none';

    return (
      <div
        key={id}
        className={`absolute left-1/2 top-1/2 transition-all duration-200 ${editMode ? 'cursor-move hover:ring-2 hover:ring-white/30 hover:rounded-xl' : ''} ${isSelected ? 'ring-2 ring-yellow-400 ring-offset-4 ring-offset-black/50 rounded-xl' : ''}`}
        style={{
          transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
          zIndex: isSelected ? 400 : (transform.layer === 'back' ? 5 : 100),
          width: id === 'backgroundWord' ? '100%' : '85%',
          maxWidth: id === 'backgroundWord' ? '100%' : '500px',
          pointerEvents: editMode ? 'auto' : 'none'
        }}
        onMouseDown={(e) => handleDragStart(e, id)}
        onClick={(e) => { if (editMode) { e.stopPropagation(); setSelectedElement(id); } }}
      >
        <div
          contentEditable={editMode}
          suppressContentEditableWarning
          onBlur={(e) => updateText(id, e.currentTarget.textContent || '')}
          className={`${defaultStyle} ${layerStyle} outline-none focus:outline-2 focus:outline-yellow-400/50 text-center transition-all duration-300 w-full`}
          style={{
            fontSize,
            color: isGradientText ? undefined : (color || 'inherit'),
            lineHeight: 1.2,
            textShadow,
            ...(isGradientText ? getGradientTextStyle() : {}),
          }}
        >
          {text}
        </div>

        {/* Editor Controls - Positioned below element for visibility */}
        {isSelected && (
          <div
            className="editor-controls absolute left-1/2 -translate-x-1/2 mt-4 flex items-center gap-2 bg-neutral-900/95 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl pointer-events-auto"
            style={{
              zIndex: 600,
              top: '100%',
              minWidth: '300px'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Scale Controls */}
            <div className="flex items-center bg-black/60 rounded-xl p-1 gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); updateScale(id, -0.1); }}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-90 transition-all text-white"
                title="Scale Down"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg>
              </button>
              <div className="text-xs font-bold text-white px-2 min-w-[50px] text-center font-mono">
                {Math.round(transform.scale * 100)}%
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); updateScale(id, 0.1); }}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 active:scale-90 transition-all text-white"
                title="Scale Up"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            </div>

            <div className="w-px h-8 bg-white/20" />

            {/* Center Button */}
            <button
              onClick={(e) => { e.stopPropagation(); centerElement(id); }}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-all"
              title="Center Horizontally"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M10 12h4M4 18h16" /></svg>
            </button>

            <div className="w-px h-8 bg-white/20" />

            {/* Depth Toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleLayer(id); }}
              className={`h-10 px-4 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${transform.layer === 'back' ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
            >
              {transform.layer === 'back' ? '✓ Depth' : 'Depth'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const infoText = [content.company_info.phone, content.company_info.email, content.company_info.website].filter(Boolean).join(' • ');

  // Get gradient colors based on emotional tone
  const getGradientStyle = () => {
    switch (content.emotional_tone) {
      case EmotionalTone.BOLD: return 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500';
      case EmotionalTone.PREMIUM: return 'bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200';
      case EmotionalTone.PLAYFUL: return 'bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400';
      case EmotionalTone.MINIMAL: return 'bg-gradient-to-r from-white via-gray-100 to-white';
      case EmotionalTone.ENERGETIC: return 'bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600';
      default: return 'bg-gradient-to-r from-white to-gray-200';
    }
  };

  const getTextShadowStyle = () => {
    switch (content.emotional_tone) {
      case EmotionalTone.BOLD: return '0 0 40px rgba(250, 204, 21, 0.6), 0 0 80px rgba(249, 115, 22, 0.4)';
      case EmotionalTone.PREMIUM: return '0 4px 30px rgba(0, 0, 0, 0.8), 0 0 60px rgba(217, 169, 60, 0.3)';
      case EmotionalTone.PLAYFUL: return '0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)';
      case EmotionalTone.MINIMAL: return '0 2px 20px rgba(0, 0, 0, 0.5)';
      case EmotionalTone.ENERGETIC: return '0 0 50px rgba(34, 211, 238, 0.6), 0 0 100px rgba(59, 130, 246, 0.4)';
      default: return '0 4px 30px rgba(0, 0, 0, 0.5)';
    }
  };

  return (
    <div
      id="poster-canvas-target"
      className={`relative w-full aspect-[3/4] max-h-[75vh] md:max-h-[85vh] rounded-[4rem] shadow-[0_100px_200px_-50px_rgba(0,0,0,1)] bg-black transition-all duration-700 ${editMode ? 'ring-[12px] ring-yellow-400/40 scale-[0.92] rounded-[5rem]' : 'overflow-hidden'}`}
      onClick={(e) => { if (e.target === e.currentTarget && editMode) setSelectedElement(null); }}
    >
      {/* AI-Generated Background */}
      <img src={enhancedImageUrl} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-100 select-none rounded-[inherit]" draggable={false} crossOrigin="anonymous" />

      {/* Original Product Overlay - ensures exact product appearance */}
      {useOriginalProduct && originalImageUrl && (
        <div className="absolute inset-0 flex items-center justify-center z-[6] pointer-events-none">
          <img
            src={originalImageUrl}
            alt="Product"
            className="max-w-[60%] max-h-[60%] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            draggable={false}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 pointer-events-none z-[8] rounded-[inherit]" />

      {/* Background Word - Editable */}
      {renderEditableElement(
        'backgroundWord',
        `font-['Bebas_Neue'] text-white/[0.08] uppercase`,
        content.background_word,
        'clamp(5rem, 18vw, 10rem)'
      )}

      {/* Brand Name - Editable */}
      {renderEditableElement(
        'brand',
        `font-['Inter'] font-bold tracking-[0.4em] uppercase`,
        content.brand_name,
        'clamp(0.6rem, 1.5vw, 0.85rem)',
        'rgba(255,255,255,0.9)'
      )}

      {/* Main Slogan - Editable with gradient */}
      {renderEditableElement(
        'short',
        `${getTextStyle()} leading-tight`,
        content.short_slogan,
        'clamp(1.5rem, 5vw, 2.8rem)',
        '#FFFFFF'
      )}

      {/* CTA Button - Premium with shimmer */}
      {content.cta_text && renderEditableElement(
        'cta',
        `${getGradientStyle()} text-black px-10 py-4 rounded-full font-black uppercase tracking-[0.25em] shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_60px_rgba(250,204,21,0.3)] relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:translate-x-[-200%] before:animate-[shimmer_3s_infinite] before:skew-x-12`,
        content.cta_text,
        'clamp(0.6rem, 1.3vw, 0.85rem)'
      )}

      {/* Contact Info - Editable */}
      {infoText && renderEditableElement(
        'contact',
        'font-mono tracking-[0.2em] uppercase text-white/30',
        infoText,
        'clamp(0.45rem, 0.9vw, 0.6rem)'
      )}

      {/* Edit Mode Indicator */}
      {editMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest z-[500] animate-pulse">
          Edit Mode • Click elements to adjust
        </div>
      )}

      <div className="absolute top-16 right-8 text-white/10 text-[8px] font-black uppercase tracking-[0.3em] select-none pointer-events-none z-[200]">
        FLOW
      </div>
    </div>
  );
};

export default PosterRenderer;
