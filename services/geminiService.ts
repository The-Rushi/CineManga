
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { PanelAnalysis, TimelineEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export class CineMangaService {
  async analyzeMangaPage(base64Image: string, instructions: string): Promise<PanelAnalysis[]> {
    const prompt = `
      ACT AS A WORLD-CLASS CINEMATIC MANGA DIRECTOR. 
      Analyze this page for a "CineManga" adaptation. 
      Identify every panel, trace speech bubble tails to find speakers, and plan a cinematic sequence.

      OUTPUT JSON ARRAY OF PANELS. 
      For 'mood', write a performative instruction (e.g. "Whispering with terror", "Cold and monotonous").
      For 'voiceArchetype', select from: 'deep_authoritative', 'young_heroic', 'female_sharp', 'raspy_villain', 'narrator_neutral', 'cheerful_friend'.
      
      DIRECTOR'S NOTES: ${instructions}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/png' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              box: {
                type: Type.OBJECT,
                properties: {
                  ymin: { type: Type.NUMBER },
                  xmin: { type: Type.NUMBER },
                  ymax: { type: Type.NUMBER },
                  xmax: { type: Type.NUMBER }
                },
                required: ['ymin', 'xmin', 'ymax', 'xmax']
              },
              description: { type: Type.STRING },
              atmosphere: { type: Type.STRING },
              narrativeWeight: { type: Type.STRING, enum: ['low', 'medium', 'high', 'climax'] },
              microMotion: { type: Type.STRING, enum: ['slow-zoom', 'pan-right', 'pan-left', 'breathe', 'flicker', 'shake', 'static'] },
              ambienceProfile: { type: Type.STRING },
              sfx: { type: Type.ARRAY, items: { type: Type.STRING } },
              totalDuration: { type: Type.NUMBER },
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isNarration: { type: Type.BOOLEAN },
                    mood: { type: Type.STRING },
                    voiceArchetype: { type: Type.STRING },
                    startTime: { type: Type.NUMBER }
                  },
                  required: ['speaker', 'text', 'isNarration', 'mood', 'voiceArchetype', 'startTime']
                }
              }
            },
            required: ['id', 'box', 'description', 'events', 'totalDuration', 'microMotion', 'ambienceProfile', 'sfx', 'atmosphere', 'narrativeWeight']
          }
        }
      }
    });

    try {
      return JSON.parse(response.text || "[]");
    } catch (e) {
      console.error("Analysis Parse Error", e);
      return [];
    }
  }

  async generateVoice(event: TimelineEvent, voiceName: string): Promise<Uint8Array> {
    // TREAT GEMINI AS THE SPECIALIST VOICE ACTOR
    const instruction = `VOICE PERFORMANCE SPECIALIST: Act as ${event.speaker}. 
    DIRECTION: ${event.mood}. 
    LINE: "${event.text}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: instruction }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } }
        }
      }
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("TTS Modal provided empty response");

    // Standard base64 to Uint8Array for PCM consumption
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}
