import React, { useState, useRef } from 'react';
import { GenerationState, PosterLayout, PosterContent } from './types';
import { generatePosterContent, enhanceProductImage } from './geminiService';
import PosterRenderer from './components/PosterRenderer';
import html2canvas from 'html2canvas';

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
    inputs: {
      brandName: '',
      customSlogan: '',
      context: '',
      visualDescription: 'A professional commercial setup with dramatic rim lighting and a premium studio background.',
      phone: '',
      email: '',
      website: ''
    }
  });

  // Define activeLayout state to fix the "Cannot find name 'activeLayout'" error
  const [activeLayout, setActiveLayout] = useState<PosterLayout>(LAYOUTS[0]);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleDownload = async () => {
    const element = document.getElementById('poster-canvas-target');
    if (!element) return;

    setExporting(true);
    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2, // Higher quality export
        backgroundColor: '#000000',
        logging: false
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement('a');
      link.href = image;
      link.download = `${state.inputs.brandName || 'flow'}-poster.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
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
        state.inputs.context,
        {
          phone: state.inputs.phone,
          email: state.inputs.email,
          website: state.inputs.website
        }
      );

      const enhanced = await enhanceProductImage(
        base64,
        content.emotional_tone,
        state.inputs.visualDescription,
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
        error: "Generation failed. Please refine your description or try a new image."
      }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-400 selection:text-black font-['Inter']">
      <header className="px-8 py-8 flex items-center justify-between border-b border-white/5 sticky top-0 bg-neutral-950/90 backdrop-blur-2xl z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)]">
            <svg className="w-7 h-7 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-3xl font-black tracking-tighter uppercase italic block leading-none">Flow</span>
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/20">Studio Creative Engine</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto p-6 md:p-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          <div className="lg:col-span-5 space-y-12">
            <section className="space-y-12">
              <div>
                <h2 className="text-6xl font-black mb-8 uppercase tracking-tighter leading-[0.85] italic">Directing<br />Studio.</h2>
                <p className="text-white/40 text-xl leading-relaxed font-light">
                  Craft your narrative. Our AI synthesizes the vision, while you handle the refined typography and layering.
                </p>
              </div>

              <div className="space-y-10 bg-white/5 p-10 rounded-[3rem] border border-white/5 shadow-2xl">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Creative Directive</label>
                  <textarea placeholder="Describe the environment (e.g. Floating in a golden sunset cloudscape...)" value={state.inputs.visualDescription} onChange={(e) => handleInputChange('visualDescription', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-sm focus:border-yellow-400 focus:outline-none transition-all placeholder:text-white/10 min-h-[140px] resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Product Name</label>
                    <input type="text" placeholder="e.g. Vivera" value={state.inputs.brandName} onChange={(e) => handleInputChange('brandName', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-1">Campaign Mood</label>
                    <input type="text" placeholder="e.g. Luxe, Summer" value={state.inputs.context} onChange={(e) => handleInputChange('context', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-white/10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20">Metadata Details</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <input type="text" placeholder="Phone" value={state.inputs.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all" />
                    <input type="email" placeholder="Email" value={state.inputs.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all" />
                    <input type="text" placeholder="Website" value={state.inputs.website} onChange={(e) => handleInputChange('website', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-yellow-400 focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="relative group mt-8">
                  <div className={`w-full h-56 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${state.originalImage ? 'border-yellow-400 bg-yellow-400/5' : 'border-white/10 hover:border-white/20 bg-black/40'}`}>
                    {state.originalImage ? (
                      <img src={state.originalImage} className="w-full h-full object-contain p-8 animate-in zoom-in-95 duration-500" alt="Product" />
                    ) : (
                      <div className="text-center p-8 opacity-20 group-hover:opacity-40 transition-opacity">
                        <svg className="w-10 h-10 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="font-black uppercase tracking-[0.4em] text-[9px]">Select Product Image</p>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} accept="image/*" />
                  </div>
                </div>

                {!state.editMode ? (
                  <button onClick={startGeneration} disabled={!state.originalImage || state.loading} className={`w-full py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xl transition-all transform active:scale-95 flex items-center justify-center gap-5 ${state.loading ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' : 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-[0_20px_60px_-15px_rgba(250,204,21,0.5)]'}`}>
                    {state.loading ? (<><div className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" />Rendering...</>) : 'Generate Masterpiece'}
                  </button>
                ) : (
                  <div className="p-10 bg-yellow-400 text-black rounded-[3rem] animate-in zoom-in-95 duration-300 shadow-2xl">
                    <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter leading-none">Director Mode</h3>
                    <p className="text-black/60 text-[10px] uppercase tracking-widest mb-8 leading-relaxed font-bold">Drag elements to reposition. Click any text to toggle its depth effect.</p>
                    <button onClick={() => setState(s => ({ ...s, editMode: false }))} className="w-full py-6 bg-black text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-neutral-800 transition-all shadow-xl">Confirm Design</button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-7 lg:sticky lg:top-32">
            <div className="relative">
              <div className="absolute -inset-10 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-[4rem] blur-[100px] opacity-20 pointer-events-none"></div>

              <div className="relative bg-neutral-900 border border-white/5 rounded-[5rem] overflow-hidden min-h-[900px] flex items-center justify-center shadow-inner">
                {state.loading ? (
                  <div className="text-center p-12 space-y-10 animate-pulse">
                    <div className="flex justify-center gap-4">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full animate-bounce"></div>
                      <div className="w-6 h-6 bg-yellow-400 rounded-full animate-bounce [animation-delay:200ms]"></div>
                      <div className="w-6 h-6 bg-yellow-400 rounded-full animate-bounce [animation-delay:400ms]"></div>
                    </div>
                    <div>
                      <p className="text-5xl font-black uppercase italic tracking-tighter mb-2">Articulating Visuals</p>
                      <p className="text-[10px] uppercase tracking-[1em] text-white/20">Studio Engine Active</p>
                    </div>
                  </div>
                ) : state.enhancedImage && state.content ? (
                  <div className="w-full h-full p-12 relative flex flex-col items-center">
                    {/* Layout switcher UI */}
                    <div className="mb-8 flex gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 z-20">
                      {LAYOUTS.map(l => (
                        <button
                          key={l.id}
                          onClick={() => setActiveLayout(l)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeLayout.id === l.id ? 'bg-yellow-400 text-black' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                        >
                          {l.name}
                        </button>
                      ))}
                    </div>

                    <PosterRenderer originalImageUrl={state.originalImage} enhancedImageUrl={state.enhancedImage} content={state.content} layout={activeLayout} editMode={state.editMode} onUpdateContent={handleUpdateContent} />

                    <div className="mt-16 flex gap-6 w-full max-w-xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
                      {!state.editMode && (
                        <>
                          <button onClick={() => setState(s => ({ ...s, editMode: true }))} className="flex-1 bg-white/5 backdrop-blur-3xl text-white px-10 py-6 rounded-full font-black uppercase tracking-[0.2em] text-[11px] border border-white/10 shadow-2xl hover:bg-white hover:text-black transition-all flex items-center justify-center gap-4 active:scale-95">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Fine-tune Layout
                          </button>
                          <button
                            onClick={handleDownload}
                            disabled={exporting}
                            className={`flex-1 bg-yellow-400 text-black px-10 py-6 rounded-full font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_25px_60px_-10px_rgba(250,204,21,0.6)] hover:bg-yellow-300 transition-all flex items-center justify-center gap-4 active:scale-95 ${exporting ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {exporting ? (
                              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            )}
                            Export Poster
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-20 opacity-5 select-none pointer-events-none uppercase tracking-[2.5em] font-black text-xs">Awaiting Narrative</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="p-24 text-center opacity-10 border-t border-white/5 mt-20">
        <p className="text-[10px] uppercase tracking-[1.5em]">Flow Art Direction System • v9.0 • 2025</p>
      </footer>
    </div>
  );
};

export default App;
