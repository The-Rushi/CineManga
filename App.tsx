
import React, { useState, useRef } from 'react';
import { AppState, MangaScene, PanelAnalysis } from './types';
import { CineMangaService } from './services/geminiService';
import AnalysisEditor from './components/AnalysisEditor';
import CinematicPlayer from './components/CinematicPlayer';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [scenes, setScenes] = useState<MangaScene[]>([]);
  const [instructions, setInstructions] = useState('');
  const [loadingMsg, setLoadingMsg] = useState('');
  
  const service = new CineMangaService();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newScenes: MangaScene[] = [];
      let loaded = 0;
      (Array.from(files) as File[]).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          newScenes.push({ id: file.name, imageUrl: reader.result as string, panels: [] });
          if (++loaded === files.length) {
            newScenes.sort((a, b) => a.id.localeCompare(b.id));
            setScenes(newScenes);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUpdatePanels = (updatedPanels: PanelAnalysis[]) => {
    const updatedScenes = [...scenes];
    updatedScenes[0].panels = updatedPanels;
    setScenes(updatedScenes);
  };

  const startProduction = async () => {
    setState(AppState.ANALYZING);
    try {
      const updatedScenes = [...scenes];
      for (let i = 0; i < updatedScenes.length; i++) {
        setLoadingMsg(`Directing Page ${i + 1}/${updatedScenes.length}...`);
        const base64 = updatedScenes[i].imageUrl.split(',')[1];
        updatedScenes[i].panels = await service.analyzeMangaPage(base64, instructions);
      }
      setScenes(updatedScenes);
      setState(AppState.REVIEWING);
    } catch (e) {
      alert("Direction failed. Please try a different page.");
      setState(AppState.IDLE);
    }
  };

  const finalizeProduction = async () => {
    setState(AppState.PREPARING_AUDIO);
    try {
      const voiceMap = new Map<string, string>();
      const casting = ['Fenrir', 'Charon', 'Puck', 'Kore', 'Zephyr'];
      let castIdx = 0;

      for (let s = 0; s < scenes.length; s++) {
        for (let p = 0; p < scenes[s].panels.length; p++) {
          for (let e = 0; e < scenes[s].panels[p].events.length; e++) {
            const event = scenes[s].panels[p].events[e];
            if (!voiceMap.has(event.speaker)) {
              let vName = casting[castIdx++ % casting.length];
              if (event.voiceArchetype.includes('deep')) vName = 'Fenrir';
              if (event.voiceArchetype.includes('narrator')) vName = 'Zephyr';
              if (event.voiceArchetype.includes('female')) vName = 'Kore';
              if (event.voiceArchetype.includes('friend')) vName = 'Puck';
              voiceMap.set(event.speaker, vName);
            }
            
            setLoadingMsg(`Recording: ${event.speaker}...`);
            scenes[s].panels[p].events[e].audioData = await service.generateVoice(event, voiceMap.get(event.speaker)!);
          }
        }
      }
      setState(AppState.PLAYING);
    } catch (e) {
      alert("Audio production failed.");
      setState(AppState.REVIEWING);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Studio Header */}
      <header className="fixed top-0 left-0 right-0 h-16 border-b border-white/5 bg-black z-[100] flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#5851db] rounded flex items-center justify-center font-black text-white text-lg shadow-lg">C</div>
          <span className="text-sm font-black tracking-widest uppercase">CineManga</span>
        </div>
        <div className="flex items-center gap-8 text-[11px] font-black tracking-[0.2em] text-zinc-500 uppercase">
          <span className="text-white cursor-pointer transition-colors border-b-2 border-[#5851db] pb-1">Studio</span>
          <span className="hover:text-white cursor-pointer transition-colors">Library</span>
          <span className="hover:text-white cursor-pointer transition-colors">Settings</span>
        </div>
      </header>

      <main className="pt-16 min-h-screen">
        {state === AppState.IDLE && (
          <div className="max-w-4xl mx-auto py-24 px-6 animate-fade-in text-center">
            <div className="inline-block px-4 py-1 rounded-full border border-[#5851db]/30 text-[#5851db] text-[10px] font-black tracking-widest uppercase mb-6">
              Director Engine v3.0
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-6 italic tracking-tighter uppercase">
              CINE<span className="text-[#5851db]">MANGA.</span>
            </h1>
            <p className="text-xl text-zinc-500 mb-12 max-w-2xl mx-auto font-medium italic">
              Experience the flow of time within the static frame.
            </p>

            <div className="grid md:grid-cols-2 gap-8 items-start text-left">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[3/4] border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-900 transition-all group overflow-hidden bg-[#0f0f0f]"
              >
                {scenes.length > 0 ? (
                  <div className="p-4 grid grid-cols-3 gap-2 w-full h-full overflow-y-auto">
                    {scenes.map((s, i) => (
                      <img key={i} src={s.imageUrl} className="w-full aspect-[3/4] object-cover rounded-lg shadow-2xl border border-white/10" alt={`Page ${i + 1}`} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-12">
                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-zinc-700 mb-4 group-hover:text-[#5851db] transition-colors"></i>
                    <p className="font-bold text-zinc-400">Upload Manga Script</p>
                    <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-widest">Select chapter pages (JPG/PNG)</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple className="hidden" />
              </div>

              <div className="space-y-6">
                <div className="bg-[#121212] p-6 rounded-2xl border border-white/5">
                  <label className="text-[10px] font-black uppercase text-zinc-600 tracking-widest block mb-4">Production Notes</label>
                  <textarea 
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Describe character voices or specific panel moods..."
                    className="w-full h-48 bg-black border border-zinc-800 rounded-xl p-4 text-sm focus:border-[#5851db] outline-none transition-all placeholder:text-zinc-800"
                  />
                </div>
                <button 
                  disabled={scenes.length === 0}
                  onClick={startProduction}
                  className="w-full py-5 bg-[#5851db] hover:bg-[#6b64f1] disabled:opacity-30 disabled:grayscale font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-indigo-600/20 rounded-xl transition-all"
                >
                  Start Production Analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {(state === AppState.ANALYZING || state === AppState.PREPARING_AUDIO) && (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-50 p-12">
            <div className="w-64 h-1 bg-zinc-900 rounded-full overflow-hidden mb-8">
              <div className="h-full bg-[#5851db] animate-[progress_1.5s_infinite_ease-in-out]"></div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-[#5851db]">
              {state === AppState.ANALYZING ? 'Mapping Frames' : 'Producing Soundtrack'}
            </h2>
            <p className="text-zinc-600 mt-4 font-mono text-[10px] uppercase tracking-[0.2em]">{loadingMsg}</p>
          </div>
        )}

        {state === AppState.REVIEWING && (
          <div className="pt-24 px-6">
            <AnalysisEditor 
              panels={scenes[0].panels} 
              onUpdate={handleUpdatePanels}
              onConfirm={finalizeProduction} 
            />
          </div>
        )}

        {state === AppState.PLAYING && (
          <CinematicPlayer scenes={scenes} onFinish={() => setState(AppState.IDLE)} />
        )}
      </main>

      <style>{`
        @keyframes progress { 0% { width: 0%; left: 0%; } 50% { width: 100%; left: 0%; } 100% { width: 0%; left: 100%; } }
        .animate-fade-in { animation: fadeIn 1s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #222; }
      `}</style>
    </div>
  );
};

export default App;
