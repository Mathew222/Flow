
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

  const startGeneration = async () => {
    if (!state.originalImage) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const base64 = state.originalImage.split(',')[1];
      
      // 1. Generate text content (Slogans)
      const content = await generatePosterContent(base64);
      
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
        error: "Failed to generate poster. Please try a different image." 
      }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white selection:bg-yellow-400 selection:text-black">
      {/* Header */}
      <header className="px-6 py-8 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
             <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase italic">Flow</span>
        </div>
        <div className="hidden md:block text-xs uppercase tracking-widest text-white/50">
          Professional Poster Generation System
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Left Column: Upload and Controls */}
          <div className="space-y-12">
            <section>
              <h2 className="text-4xl font-black mb-4 uppercase tracking-tight">Create Impact.</h2>
              <p className="text-white/60 text-lg mb-8 leading-relaxed">
                Upload your product image and let our AI-driven design system craft professional marketing visuals in seconds.
              </p>

              <div className="space-y-6">
                <div className="relative group">
                  <div className={`w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden
                    ${state.originalImage ? 'border-yellow-400/50' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}`}>
                    
                    {state.originalImage ? (
                      <img src={state.originalImage} className="w-full h-full object-contain p-4" alt="Uploaded" />
                    ) : (
                      <div className="text-center p-8">
                        <svg className="w-12 h-12 mx-auto text-white/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="font-medium">Drop your product photo here</p>
                        <p className="text-sm text-white/40 mt-1">PNG, JPG up to 10MB</p>
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
                      className="absolute -top-3 -right-3 bg-red-500 rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <button 
                  onClick={startGeneration}
                  disabled={!state.originalImage || state.loading}
                  className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-lg transition-all transform active:scale-95 flex items-center justify-center gap-3
                    ${state.loading ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-xl shadow-yellow-400/20'}`}>
                  {state.loading ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                      Processing Visuals...
                    </>
                  ) : (
                    'Generate Poster'
                  )}
                </button>
              </div>
            </section>

            {state.content && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white/40 mb-6">Choose Layout</h3>
                <div className="grid grid-cols-2 gap-4">
                  {LAYOUTS.map(layout => (
                    <button
                      key={layout.id}
                      onClick={() => setActiveLayout(layout)}
                      className={`p-4 rounded-xl border text-left transition-all group ${
                        activeLayout.id === layout.id 
                        ? 'border-yellow-400 bg-yellow-400/10' 
                        : 'border-white/10 hover:border-white/30'
                      }`}>
                      <span className="block text-sm font-bold uppercase tracking-tight group-hover:translate-x-1 transition-transform">{layout.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {state.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400">
                <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium">{state.error}</p>
              </div>
            )}
          </div>

          {/* Right Column: Preview Area */}
          <div className="sticky top-12">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              
              <div className="relative bg-neutral-800 rounded-2xl overflow-hidden min-h-[600px] flex items-center justify-center">
                {state.loading ? (
                  <div className="text-center p-12 space-y-4">
                    <div className="flex justify-center gap-2 mb-4">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
                    </div>
                    <p className="text-xl font-bold italic">Crafting your vision...</p>
                    <p className="text-white/40 max-w-xs mx-auto">Gemini is analyzing your product and generating high-impact marketing slogans.</p>
                  </div>
                ) : state.enhancedImage && state.content ? (
                  <PosterRenderer 
                    imageUrl={state.enhancedImage} 
                    content={state.content} 
                    layout={activeLayout} 
                  />
                ) : (
                  <div className="text-center p-12 text-white/20">
                    <svg className="w-20 h-20 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <p className="text-sm uppercase tracking-widest font-bold">Poster Preview</p>
                    <p className="mt-2 text-xs">Upload an image to begin</p>
                  </div>
                )}
              </div>
            </div>

            {state.content && !state.loading && (
              <div className="mt-8 flex justify-center gap-4">
                <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">
                  Download HD
                </button>
                <button className="flex-1 py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-colors">
                  Share Design
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-24 p-12 border-t border-white/10 text-center">
        <p className="text-white/20 text-xs uppercase tracking-widest">
          Powered by Gemini AI • Built with Flow Poster Engine v3.0
        </p>
      </footer>
    </div>
  );
};

export default App;
