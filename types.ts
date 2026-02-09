
export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  REVIEWING = 'REVIEWING',
  PREPARING_AUDIO = 'PREPARING_AUDIO',
  PLAYING = 'PLAYING'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export type MicroMotionType = 'slow-zoom' | 'pan-right' | 'pan-left' | 'breathe' | 'flicker' | 'shake' | 'static';

export interface TimelineEvent {
  speaker: string;
  text: string;
  isNarration: boolean;
  mood: string;
  voiceArchetype: string;
  audioData?: Uint8Array;
  startTime: number; // offset from panel start
  duration?: number;
}

export interface PanelAnalysis {
  id: number;
  box: BoundingBox;
  description: string;
  atmosphere: string;
  narrativeWeight: 'low' | 'medium' | 'high' | 'climax';
  microMotion: MicroMotionType;
  events: TimelineEvent[];
  totalDuration: number;
  ambienceProfile: string;
  sfx: string[];
}

export interface MangaScene {
  id: string;
  imageUrl: string;
  panels: PanelAnalysis[];
}

export interface CharacterVoiceMapping {
  name: string;
  voiceName: string;
  archetype: string;
}
