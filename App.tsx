
import React, { useState, useCallback } from 'react';
import { GenerationState, PosterLayout, EmotionalTone } from './types';
import { generatePosterContent, enhanceProductImage } from './geminiService';
import PosterRenderer from './components/PosterRenderer';

const LAYOUTS: PosterLayout[] = [
  { id: '1', name: 'Minimalist', fontFamily: 'Inter', sloganColor: '#FFFFFF', positioning: 'center' },
  { id: '2', name: 'Editorial', fontFamily: 'Playfair Display', sloganColor: '#FFFFFF', positioning: 'overlay' },
  { id: '3', name: 'Modern Bold', fontFamily: 'Bebas Neue', sloganColor: '#FACC15', positioning: 'bottom' },
  { id: '4', name: 'Header Focus', fontFamily: 'Inter', sloganColor: '#FFFFFF', positioning: 'top' },
];

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({
    originalImage: null,
    enhancedImage: null,
    content: null,
    loading: false,
    error: null,
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

  const startGeneration = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const base64 = state.originalImage.split(',')[1];
      
      // 1. Generate text content (Slogans) using inputs
      const content = await generatePosterContent(
        base64, 
        state.inputs.brandName, 
        state.inputs.customSlogan, 
        state.inputs.context
      );
      
      // 2. Enhance image
      const enhanced = await enhanceProductImage(base64, content.emotional_tone);

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
        error: "Failed to generate poster. Please try a different image or context." 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-400 selection:text-black">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-400/20">
             <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">Flow</span>
        </div>
        <div className="hidden md:block text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">
          Professional Poster Generation System
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          
          {/* Left Column: Form and Upload */}
          <div className="space-y-12">
            <section>
              <h2 className="text-5xl font-black mb-6 uppercase tracking-tight leading-none italic">Brand<br/>Intelligence.</h2>
              <p className="text-white/50 text-lg mb-10 leading-relaxed max-w-md">
                Fuel our AI engine with your vision. Upload a photo and refine the narrative to create studio-quality marketing assets.
              </p>

              <div className="space-y-8">
                {/* Image Upload Area */}
                <div className="relative group">
                  <div className={`w-full h-72 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
                    ${state.originalImage ? 'border-yellow-400/50 bg-yellow-400/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}>
                    
                    {state.originalImage ? (
                      <img src={state.originalImage} className="w-full h-full object-contain p-6 drop-shadow-2xl" alt="Uploaded" />
                    ) : (
                      <div className="text-center p-8 group-hover:scale-110 transition-transform">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                           <svg className="w-8 h-8 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                        </div>
                        <p className="font-bold uppercase tracking-widest text-xs">Drop Product Visual</p>
                        <p className="text-[10px] text-white/30 mt-2 tracking-widest uppercase">Studio ready assets only</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleFileUpload}
                      accept="image/*"
                    />
                  </div>
                  {state.originalImage && (
                    <button 
                      onClick={() => setState(p => ({ ...p, originalImage: null, enhancedImage: null, content: null }))}
                      className="absolute -top-3 -right-3 bg-red-500 rounded-full p-2 shadow-xl hover:bg-red-600 transition-colors z-10">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Text Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Brand/Product Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Zenit Audio"
                      value={state.inputs.brandName}
                      onChange={(e) => handleInputChange('brandName', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Preferred Slogan</label>
                    <input 
                      type="text" 
                      placeholder="Optional"
                      value={state.inputs.customSlogan}
                      onChange={(e) => handleInputChange('customSlogan', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Context / Campaign Idea</label>
                  <textarea 
                    placeholder="Describe the vibe, target audience, or specific features you want to highlight..."
                    value={state.inputs.context}
                    onChange={(e) => handleInputChange('context', e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder:text-white/10 resize-none"
                  />
                </div>

                <button 
                  onClick={startGeneration}
                  disabled={!state.originalImage || state.loading}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-all transform active:scale-95 flex items-center justify-center gap-4
                    ${state.loading ? 'bg-white/10 text-white/40 cursor-not-allowed border border-white/5' : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-2xl shadow-yellow-400/30'}`}>
                  {state.loading ? (
                    <>
                      <div className="w-5 h-5 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                      Synthesizing Assets...
                    </>
                  ) : (
                    'Compose Poster'
                  )}
                </button>
              </div>
            </section>

            {state.content && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                  <h3 className="text-[10px] uppercase tracking-[0.5em] font-black text-white/40 whitespace-nowrap">Switch Perspective</h3>
                  <div className="h-[1px] flex-1 bg-white/10"></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {LAYOUTS.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setActiveLayout(layout)}
                      className={`p-4 rounded-xl border text-left transition-all group relative overflow-hidden ${
                        activeLayout.id === layout.id 
                        ? 'border-yellow-400 bg-yellow-400/5' 
                        : 'border-white/5 hover:border-white/20 bg-white/[0.02]'
                      }`}>
                      <span className="block text-[11px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform relative z-10">{layout.name}</span>
                      {activeLayout.id === layout.id && <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400/10 rounded-bl-full" />}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {state.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-4 text-red-400 animate-pulse">
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs font-bold uppercase tracking-wider leading-relaxed">{state.error}</p>
              </div>
            )}
          </div>

          {/* Right Column: High Fidelity Preview Area */}
          <div className="lg:sticky lg:top-32">
            <div className="relative group">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-3xl blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              
              <div className="relative bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden min-h-[640px] flex items-center justify-center shadow-inner">
                {state.loading ? (
                  <div className="text-center p-12 space-y-6">
                    <div className="flex justify-center gap-3 mb-4">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-black uppercase italic tracking-tighter">Director's Cut</p>
                      <p className="text-white/30 text-xs font-bold uppercase tracking-[0.3em]">Processing Visual Narratives</p>
                    </div>
                  </div>
                ) : state.enhancedImage && state.content ? (
                  <div className="w-full h-full p-4">
                    <PosterRenderer 
                      imageUrl={state.enhancedImage} 
                      content={state.content} 
                      layout={activeLayout} 
                    />
                  </div>
                ) : (
                  <div className="text-center p-12 text-white/5">
                    <div className="w-24 h-24 mx-auto mb-10 opacity-20 relative">
                       <svg className="w-full h-full animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                       </svg>
                    </div>
                    <p className="text-xs uppercase tracking-[0.8em] font-black mb-2">Stage Waiting</p>
                    <p className="text-[10px] text-white/10 uppercase tracking-[0.4em]">Awaiting creative input</p>
                  </div>
                )}
              </div>
            </div>

            {state.content && !state.loading && (
              <div className="mt-10 grid grid-cols-2 gap-4">
                <button className="py-4 bg-white/5 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all hover:border-white/10">
                  Export 4K
                </button>
                <button className="py-4 bg-white/5 border border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] hover:bg-white/10 transition-all hover:border-white/10">
                  Save Version
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-32 p-20 border-t border-white/5 text-center bg-black/40">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-2 opacity-30">
             <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.6em]">Flow Engine Active</span>
          </div>
          <p className="text-white/10 text-[9px] uppercase tracking-[0.8em]">
            Precision Aesthetics • Neural Design Architecture • 2025
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
