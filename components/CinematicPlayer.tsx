
import React, { useState, useEffect, useRef } from 'react';
import { MangaScene } from '../types';
import { decodeAudio, CinematicSoundEngine } from '../utils/audioUtils';

interface CinematicPlayerProps {
  scenes: MangaScene[];
  onFinish: () => void;
}

const CinematicPlayer: React.FC<CinematicPlayerProps> = ({ scenes, onFinish }) => {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [panelIdx, setPanelIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<{ name: string; isNarration: boolean } | null>(null);
  
  const audioCtx = useRef<AudioContext | null>(null);
  const soundEngine = useRef<CinematicSoundEngine | null>(null);
  const activePanel = scenes[sceneIdx]?.panels[panelIdx];

  useEffect(() => {
    audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    soundEngine.current = new CinematicSoundEngine(audioCtx.current);
    return () => {
      soundEngine.current?.stopAmbience();
      audioCtx.current?.close();
    };
  }, []);

  const playMoment = async () => {
    if (!audioCtx.current || !soundEngine.current || !activePanel) return;
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') await ctx.resume();

    soundEngine.current.setAmbience(activePanel.ambienceProfile, activePanel.narrativeWeight);

    let panelTime = ctx.currentTime;

    for (const event of activePanel.events) {
      const waitTime = (panelTime + event.startTime - ctx.currentTime) * 1000;
      
      if (event.audioData) {
        const buffer = await decodeAudio(event.audioData, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        setTimeout(() => {
          source.start();
          setActiveSpeaker({ name: event.speaker, isNarration: event.isNarration });
          source.onended = () => {
            setTimeout(() => setActiveSpeaker(null), 300);
          };
        }, waitTime);

        panelTime += Math.max(buffer.duration + 0.5, 2.0); 
      } else {
        setTimeout(() => {
          setActiveSpeaker({ name: event.speaker, isNarration: event.isNarration });
          setTimeout(() => setActiveSpeaker(null), 2500);
        }, waitTime);
        panelTime += 3.0;
      }
    }

    const totalDuration = Math.max(activePanel.totalDuration, (panelTime - ctx.currentTime) + 1);
    
    setTimeout(() => {
      nextMoment();
    }, totalDuration * 1000);
  };

  const nextMoment = () => {
    if (panelIdx + 1 < scenes[sceneIdx].panels.length) {
      setPanelIdx(prev => prev + 1);
    } else if (sceneIdx + 1 < scenes.length) {
      setSceneIdx(prev => prev + 1);
      setPanelIdx(0);
    } else {
      setIsPlaying(false);
      onFinish();
    }
  };

  useEffect(() => {
    if (isPlaying) playMoment();
  }, [panelIdx, sceneIdx, isPlaying]);

  const getLensStyle = () => {
    if (!activePanel) return {};
    const { box } = activePanel;
    const cx = (box.xmin + box.xmax) / 2;
    const cy = (box.ymin + box.ymax) / 2;
    const w = box.xmax - box.xmin;
    const h = box.ymax - box.ymin;
    
    // Adjust scale for panel focus
    const scale = Math.min(100 / Math.max(w, h), 4.5);
    
    return {
      transform: `translate(${50 - cx}%, ${50 - cy}%) scale(${scale})`,
      transformOrigin: '50% 50%',
    };
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center overflow-hidden">
      {!isPlaying && (
        <div className="z-[110] text-center">
          <button 
            onClick={() => setIsPlaying(true)}
            className="group relative px-24 py-12 bg-white text-black font-black text-4xl uppercase tracking-tighter hover:bg-[#5851db] hover:text-white transition-all overflow-hidden shadow-2xl"
          >
            <span className="relative z-10 italic">Start Experience</span>
            <div className="absolute inset-0 bg-[#5851db] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
          </button>
        </div>
      )}

      {/* Cinematic Frame */}
      <div className="relative w-full h-full max-w-[1400px] mx-auto overflow-hidden">
        <div 
          className="absolute inset-0 transition-transform duration-[3000ms] ease-in-out"
          style={getLensStyle()}
        >
          <img 
            src={scenes[sceneIdx].imageUrl}
            className={`w-full h-full object-contain ${isPlaying ? `animate-${activePanel?.microMotion}` : ''}`}
            alt="Manga Artwork"
          />
        </div>

        {/* Dynamic Speaker ID Card */}
        <div className="absolute left-12 bottom-12 flex flex-col items-start pointer-events-none z-[120]">
          <div className={`
            px-10 py-4 backdrop-blur-2xl border border-white/5 rounded-2xl transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) transform shadow-[0_30px_90px_rgba(0,0,0,0.8)]
            ${activeSpeaker ? 'opacity-100 translate-x-0 rotate-0 scale-100' : 'opacity-0 -translate-x-12 -rotate-2 scale-90'}
            ${activeSpeaker?.isNarration ? 'bg-amber-950/40 border-l-[6px] border-l-amber-400' : 'bg-black/60 border-l-[6px] border-l-[#5851db]'}
          `}>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 block mb-1.5 opacity-60">Speaker Context</span>
            <p className="text-3xl font-black text-white italic tracking-tight uppercase leading-none">
              {activeSpeaker?.name || ''}
            </p>
          </div>
        </div>

        {/* Artistic Overlay Layers */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.6)_130%)]"></div>
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${activePanel?.microMotion === 'flicker' ? 'animate-vignette-flicker' : 'opacity-0'}`}></div>
      </div>

      {/* Chapter Progress */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-950 z-[130]">
        <div 
          className="h-full bg-gradient-to-r from-[#5851db] via-[#8a82ff] to-[#5851db] transition-all duration-1000 shadow-[0_0_20px_rgba(88,81,219,0.8)]"
          style={{ width: `${((panelIdx + 1) / scenes[sceneIdx].panels.length) * 100}%` }}
        />
      </div>

      <style>{`
        /* Enhanced Subtle Micro-Motions */
        @keyframes slow-zoom { 0% { transform: scale(1.0); } 100% { transform: scale(1.12); } }
        @keyframes pan-right { 0% { transform: translateX(-2%) scale(1.05); } 100% { transform: translateX(2%) scale(1.05); } }
        @keyframes pan-left { 0% { transform: translateX(2%) scale(1.05); } 100% { transform: translateX(-2%) scale(1.05); } }
        @keyframes breathe { 0%, 100% { transform: scale(1.0); } 50% { transform: scale(1.04); } }
        @keyframes flicker { 0%, 100% { filter: brightness(1.0); opacity: 1; } 50% { filter: brightness(0.92); opacity: 0.98; } }
        @keyframes shake { 0% { transform: translate(0, 0); } 25% { transform: translate(2px, -2px); } 50% { transform: translate(-2px, 2px); } 75% { transform: translate(1px, 1px); } }
        @keyframes vignette-flicker { 0%, 100% { background: rgba(0,0,0,0); } 50% { background: rgba(0,0,0,0.15); } }

        .animate-slow-zoom { animation: slow-zoom 18s cubic-bezier(0.1, 0, 0.9, 1) forwards; }
        .animate-pan-right { animation: pan-right 18s ease-in-out forwards; }
        .animate-pan-left { animation: pan-left 18s ease-in-out forwards; }
        .animate-breathe { animation: breathe 12s ease-in-out infinite; }
        .animate-flicker { animation: flicker 0.2s infinite; }
        .animate-shake { animation: shake 0.15s infinite; }
        .animate-vignette-flicker { animation: vignette-flicker 0.3s infinite; }
      `}</style>
    </div>
  );
};

export default CinematicPlayer;
