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
      videoSourceType: 'local',
      youtubeVideoId: null,
      youtubeCaptions: [],
      youtubePlayer: null,
      youtubeSettings: {
        apiKey: '',
        enableCORSProxy: false,
      },
      setVideoState: (state) => set(state),
      setYoutubeVideoId: (videoId: string) => set({ youtubeVideoId: videoId }),
      setYoutubePlayer: (player: YT.Player | null) => set({ youtubePlayer: player }),
      switchVideoSource: (sourceType: 'local' | 'youtube') => {
        set({ videoSourceType: sourceType });
        if (sourceType === 'local') {
          set({ youtubeVideoId: null, youtubeCaptions: [] });
        }
      },
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
        videoSourceType: state.videoSourceType,
        youtubeSettings: state.youtubeSettings,
      }),
    }
  )
);

export default useVideoStore;