
import React, { useState } from 'react';
import { GenerationState, PosterLayout, PosterContent, PosterStyle } from './types';
import { generatePosterContent, enhanceProductImage } from './geminiService';
import PosterRenderer from './components/PosterRenderer';

const LAYOUTS: PosterLayout[] = [
  { id: '1', name: 'Ultra Minimal', fontFamily: 'Inter', sloganColor: '#FFFFFF', positioning: 'center' },
  { id: '2', name: 'Editorial Luxe', fontFamily: 'Playfair Display', sloganColor: '#FFFFFF', positioning: 'overlay' },
  { id: '3', name: 'Brutalist Bold', fontFamily: 'Bebas Neue', sloganColor: '#FACC15', positioning: 'bottom' },
  { id: '4', name: 'Header Title', fontFamily: 'Inter', sloganColor: '#FFFFFF', positioning: 'top' },
];

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({
    originalImage: null,
    enhancedImage: null,
    content: null,
    loading: false,
    error: null,
    editMode: false,
    selectedStyle: PosterStyle.COSMIC_LEVITATION,
    inputs: {
      brandName: '',
      customSlogan: '',
      context: ''
    }
  });

  const [activeLayout, setActiveLayout] = useState<PosterLayout>(LAYOUTS[0]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, originalImage: reader.result as string, error: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: keyof GenerationState['inputs'], value: string) => {
    setState(prev => ({
      ...prev,
      inputs: { ...prev.inputs, [field]: value }
    }));
  };

  const handleUpdateContent = (newContent: PosterContent) => {
    setState(prev => ({ ...prev, content: newContent }));
  };

  const startGeneration = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, loading: true, error: null, editMode: false }));

    try {
      const base64 = state.originalImage.split(',')[1];
      
      const content = await generatePosterContent(
        base64, 
        state.inputs.brandName, 
        state.inputs.customSlogan, 
        state.inputs.context
      );
      
      const enhanced = await enhanceProductImage(
        base64, 
        content.emotional_tone, 
        state.selectedStyle,
        state.inputs.context
      );

      setState(prev => ({
        ...prev,
        content,
        enhancedImage: enhanced,
        loading: false
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: "Failed to generate visual masterpiece. Try again." 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-400 selection:text-black font-['Inter']">
      <header className="px-8 py-8 flex items-center justify-between border-b border-white/5 sticky top-0 bg-neutral-950/80 backdrop-blur-xl z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.3)]">
             <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <div>
             <span className="text-3xl font-black tracking-tighter uppercase italic block leading-none">Flow</span>
             <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">Studio Engine</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-6 md:p-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-5 space-y-16">
            <section>
              <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter leading-[0.85] italic">Directing<br/>Mastery.</h2>
              <p className="text-white/40 text-xl mb-12 leading-relaxed font-light">
                Compose stunning commercial posters. Select your aesthetic, upload your product, and refine the narrative.
              </p>

              <div className="space-y-10">
                {/* Style Archetype Selection */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Visual Archetype</label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(PosterStyle).map((style) => (
                      <button
                        key={style}
                        onClick={() => setState(s => ({ ...s, selectedStyle: style }))}
                        className={`p-5 rounded-[1.5rem] border text-left transition-all relative overflow-hidden group ${
                          state.selectedStyle === style 
                          ? 'border-yellow-400 bg-yellow-400 text-black shadow-2xl' 
                          : 'border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:bg-white/10'
                        }`}
                      >
                        <span className={`block text-[11px] font-black uppercase tracking-widest relative z-10 ${state.selectedStyle === style ? 'text-black' : 'text-white'}`}>
                          {style}
                        </span>
                        {state.selectedStyle === style && (
                          <div className="absolute top-2 right-2 text-black/20">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <div className={`w-full h-80 border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden shadow-inner
                    ${state.originalImage ? 'border-yellow-400 bg-yellow-400/5' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                    
                    {state.originalImage ? (
                      <img src={state.originalImage} className="w-full h-full object-contain p-10 drop-shadow-2xl animate-in zoom-in-95 duration-500" alt="Uploaded" />
                    ) : (
                      <div className="text-center p-8 group-hover:scale-105 transition-transform duration-500">
                        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10">
                           <svg className="w-10 h-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                        </div>
                        <p className="font-black uppercase tracking-[0.4em] text-[10px] text-white/20">Awaiting Product Asset</p>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/*" />
                  </div>
                </div>

                {!state.editMode ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Brand Identity</label>
                        <input type="text" placeholder="e.g. Vivera" value={state.inputs.brandName} onChange={(e) => handleInputChange('brandName', e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder:text-white/10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 ml-1">Context / Mood</label>
                        <input type="text" placeholder="e.g. Hyper-fresh, Neon" value={state.inputs.context} onChange={(e) => handleInputChange('context', e.target.value)} className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder:text-white/10" />
                      </div>
                    </div>

                    <button onClick={startGeneration} disabled={!state.originalImage || state.loading} className={`w-full py-7 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xl transition-all transform active:scale-95 flex items-center justify-center gap-5 ${state.loading ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_20px_60px_-15px_rgba(250,204,21,0.4)]'}`}>
                      {state.loading ? (<><div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" />Synthesizing...</>) : 'Generate Masterpiece'}
                    </button>
                  </div>
                ) : (
                  <div className="p-10 bg-yellow-400/5 border border-yellow-400/20 rounded-[3rem] animate-in zoom-in-95 duration-300">
                    <h3 className="text-2xl font-black mb-6 uppercase italic tracking-tighter">Direct Control</h3>
                    <p className="text-white/40 text-sm mb-8 leading-relaxed">Adjust layout elements manually to achieve perfect composition.</p>
                    <button onClick={() => setState(s => ({ ...s, editMode: false }))} className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-neutral-200 transition-all shadow-xl">
                      Save & Finalize
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-32">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-[4rem] blur-[80px] opacity-20 pointer-events-none"></div>
              
              <div className="relative bg-neutral-900 border border-white/5 rounded-[4rem] overflow-hidden min-h-[750px] flex items-center justify-center shadow-inner group">
                {state.loading ? (
                  <div className="text-center p-12 space-y-8 animate-pulse">
                    <div className="flex justify-center gap-5 mb-4">
                      <div className="w-5 h-5 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-5 h-5 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-5 h-5 bg-yellow-400 rounded-full animate-bounce"></div>
                    </div>
                    <div>
                      <p className="text-4xl font-black uppercase italic tracking-tighter mb-2">Composing...</p>
                      <p className="text-[10px] uppercase tracking-[0.8em] text-white/20">Director's Mode v4.0</p>
                    </div>
                  </div>
                ) : state.enhancedImage && state.content ? (
                  <div className="w-full h-full p-8 relative">
                    <PosterRenderer 
                      imageUrl={state.enhancedImage} 
                      content={state.content} 
                      layout={activeLayout} 
                      selectedStyle={state.selectedStyle}
                      editMode={state.editMode}
                      onUpdateContent={handleUpdateContent}
                    />
                    {!state.editMode && (
                      <button 
                        onClick={() => setState(s => ({ ...s, editMode: true }))}
                        className="absolute top-12 right-12 bg-white/5 backdrop-blur-2xl text-white px-8 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 shadow-2xl hover:bg-yellow-400 hover:text-black transition-all z-50 flex items-center gap-3 active:scale-90"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Adjust Layout
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-12 opacity-5 select-none pointer-events-none">
                    <p className="text-[12px] uppercase tracking-[1.5em] font-black">Composition Stage</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="p-20 text-center opacity-10 border-t border-white/5 mt-20">
        <p className="text-[10px] uppercase tracking-[1.2em]">Flow Art Direction Engine • 2025</p>
      </footer>
    </div>
  );
};

export default App;
