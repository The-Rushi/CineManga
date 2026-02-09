
import React from 'react';
import { PanelAnalysis, TimelineEvent } from '../types';

interface AnalysisEditorProps {
  panels: PanelAnalysis[];
  onUpdate: (updatedPanels: PanelAnalysis[]) => void;
  onConfirm: () => void;
}

const AnalysisEditor: React.FC<AnalysisEditorProps> = ({ panels, onUpdate, onConfirm }) => {
  const handleChange = (pIdx: number, field: keyof PanelAnalysis, value: any) => {
    const newPanels = [...panels];
    newPanels[pIdx] = { ...newPanels[pIdx], [field]: value };
    onUpdate(newPanels);
  };

  const handleEventChange = (pIdx: number, eIdx: number, field: keyof TimelineEvent, value: any) => {
    const newPanels = [...panels];
    const newEvents = [...newPanels[pIdx].events];
    newEvents[eIdx] = { ...newEvents[eIdx], [field]: value };
    newPanels[pIdx].events = newEvents;
    onUpdate(newPanels);
  };

  const addEvent = (pIdx: number) => {
    const newPanels = [...panels];
    const lastEvent = newPanels[pIdx].events[newPanels[pIdx].events.length - 1];
    const newEvent: TimelineEvent = {
      speaker: 'Character',
      text: '',
      isNarration: false,
      mood: 'Neutral',
      voiceArchetype: 'young_heroic',
      startTime: lastEvent ? lastEvent.startTime + 2.0 : 0,
    };
    newPanels[pIdx].events = [...newPanels[pIdx].events, newEvent];
    onUpdate(newPanels);
  };

  const deleteEvent = (pIdx: number, eIdx: number) => {
    const newPanels = [...panels];
    newPanels[pIdx].events = newPanels[pIdx].events.filter((_, i) => i !== eIdx);
    onUpdate(newPanels);
  };

  return (
    <div className="max-w-[1100px] mx-auto pb-48 px-4 font-sans text-zinc-300">
      <div className="mb-12 mt-8">
        <h2 className="text-[32px] font-black text-[#6a61ff] mb-2 tracking-tight uppercase italic">Studio Review</h2>
        <p className="text-zinc-500 italic text-[16px] leading-relaxed">
          Refine the performance. Edit lines, insert new beats, and type specific emotional directions for the specialist AI cast.
        </p>
      </div>

      <div className="space-y-12">
        {panels.map((panel, pIdx) => (
          <div key={pIdx} className="bg-[#121212] rounded-2xl border border-white/5 p-8 shadow-2xl relative transition-all hover:border-white/10 group/panel">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#6a61ff]/10 border border-[#6a61ff]/20 flex items-center justify-center text-[#6a61ff] font-black">
                  {panel.id}
                </div>
                <h3 className="text-[20px] font-black text-white uppercase tracking-tight">Panel {panel.id} Configuration</h3>
              </div>
              <div className="flex items-center gap-4 bg-black/30 px-5 py-2.5 rounded-xl border border-white/5">
                <span className="text-[11px] font-black text-zinc-600 uppercase tracking-widest">Target Duration</span>
                <div className="flex items-center gap-2">
                   <input 
                    type="number" 
                    step="0.5"
                    value={panel.totalDuration}
                    onChange={(e) => handleChange(pIdx, 'totalDuration', parseFloat(e.target.value))}
                    className="w-[70px] bg-[#1a1a1a] border border-white/10 rounded-lg py-1.5 text-center text-[15px] font-bold text-white focus:border-[#6a61ff] outline-none transition-all"
                  />
                  <span className="text-[11px] font-bold text-zinc-700 uppercase">sec</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div className="flex flex-col">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.25em] block mb-4">Scene Directives</label>
                <textarea 
                  value={panel.description}
                  onChange={(e) => handleChange(pIdx, 'description', e.target.value)}
                  placeholder="Atmospheric cues for this panel..."
                  className="w-full h-44 bg-[#1a1a1a] border border-white/10 rounded-xl p-5 text-[14px] text-zinc-400 leading-relaxed focus:border-[#6a61ff] focus:text-zinc-200 outline-none transition-all resize-none shadow-inner"
                />
              </div>

              <div className="flex flex-col space-y-6">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.25em] block mb-4">Soundscape</label>
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">Background Ambience</span>
                    <input 
                      type="text"
                      value={panel.ambienceProfile}
                      onChange={(e) => handleChange(pIdx, 'ambienceProfile', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-3.5 text-[14px] text-zinc-200 focus:border-[#6a61ff] outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] text-zinc-500 font-black uppercase tracking-widest">Spot SFX (Comma separated)</span>
                    <input 
                      type="text"
                      value={panel.sfx.join(', ')}
                      onChange={(e) => handleChange(pIdx, 'sfx', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 py-3.5 text-[14px] text-zinc-200 focus:border-[#6a61ff] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-10">
              <div className="flex justify-between items-center mb-6">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.25em]">Dialogue Timeline</label>
                <button 
                  onClick={() => addEvent(pIdx)}
                  className="px-4 py-2 bg-[#6a61ff]/10 text-[#6a61ff] text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#6a61ff]/20 transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-plus"></i> Add Performance Beat
                </button>
              </div>

              <div className="space-y-4">
                {panel.events.map((event, eIdx) => (
                  <div key={eIdx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch animate-fade-in group/row">
                    <div className="md:col-span-3">
                      <div className="relative h-full">
                        <span className="absolute left-4 top-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest pointer-events-none">Speaker</span>
                        <input 
                          value={event.speaker}
                          onChange={(e) => handleEventChange(pIdx, eIdx, 'speaker', e.target.value)}
                          className="w-full h-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 pt-5 pb-2 text-[13px] font-black text-[#8a82ff] uppercase tracking-wider focus:border-[#6a61ff] outline-none transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="md:col-span-4">
                      <div className="relative h-full">
                        <span className="absolute left-4 top-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest pointer-events-none">Dialogue</span>
                        <input 
                          value={event.text}
                          onChange={(e) => handleEventChange(pIdx, eIdx, 'text', e.target.value)}
                          className="w-full h-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 pt-5 pb-2 text-[14px] text-zinc-200 focus:border-[#6a61ff] outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4">
                      <div className="relative h-full">
                        <span className="absolute left-4 top-2 text-[8px] font-black text-zinc-600 uppercase tracking-widest pointer-events-none">Tone / Performance Directive</span>
                        <input 
                          value={event.mood}
                          onChange={(e) => handleEventChange(pIdx, eIdx, 'mood', e.target.value)}
                          placeholder="e.g. Whispering frantically..."
                          className="w-full h-full bg-[#1a1a1a] border border-white/10 rounded-xl px-5 pt-5 pb-2 text-[13px] text-zinc-400 font-bold focus:border-[#6a61ff] focus:text-white outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-1 flex items-center justify-center">
                      <button 
                        onClick={() => deleteEvent(pIdx, eIdx)}
                        className="w-full h-full md:h-auto md:aspect-square flex items-center justify-center text-zinc-700 hover:text-red-500 transition-colors bg-black/20 rounded-xl border border-white/5 hover:border-red-500/30"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </div>
                ))}

                {panel.events.length === 0 && (
                  <div className="py-10 border-2 border-dashed border-white/5 rounded-xl text-center">
                    <p className="text-zinc-600 text-[12px] font-bold uppercase tracking-widest mb-4">No vocal events defined</p>
                    <button 
                      onClick={() => addEvent(pIdx)}
                      className="px-6 py-2 bg-[#6a61ff]/10 text-[#6a61ff] rounded-lg text-[10px] font-black uppercase hover:bg-[#6a61ff]/20 transition-all"
                    >
                      Insert First Beat
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-40 flex items-center justify-center bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none z-50">
        <button 
          onClick={onConfirm}
          className="pointer-events-auto bg-[#5851db] hover:bg-[#6b64f1] text-white px-24 py-5 rounded-2xl font-black uppercase text-[15px] tracking-[0.3em] shadow-[0_20px_80px_rgba(88,81,219,0.5)] transition-all transform hover:scale-[1.03] active:scale-95 flex items-center gap-4"
        >
          <span>Render Master Track</span>
          <i className="fa-solid fa-wand-magic-sparkles opacity-50"></i>
        </button>
      </div>
    </div>
  );
};

export default AnalysisEditor;
