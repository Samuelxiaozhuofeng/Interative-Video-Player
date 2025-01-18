import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VideoState } from '../types/subtitle';

interface VideoStore extends VideoState {
  setVideoState: (state: Partial<VideoState>) => void;
}

const useVideoStore = create<VideoStore>()(
  persist(
    (set) => ({
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      volume: 1,
      subtitles: [],
      selectedWord: null,
      wordExplanation: null,
      videoElement: null,
      explanationDisplay: 'floating',
      explanationPosition: null,
      aiSettings: {
        apiKey: '',
        apiEndpoint: '',
        model: 'gpt-3.5-turbo',
        isConfigured: false,
      },
      setVideoState: (state) => set(state),
    }),
    {
      name: 'video-storage',
      partialize: (state) => ({
        currentTime: state.currentTime,
        duration: state.duration,
        isPlaying: state.isPlaying,
        volume: state.volume,
        subtitles: state.subtitles,
        selectedWord: state.selectedWord,
        wordExplanation: state.wordExplanation,
        aiSettings: state.aiSettings,
        explanationDisplay: state.explanationDisplay,
      }),
    }
  )
);

export default useVideoStore;