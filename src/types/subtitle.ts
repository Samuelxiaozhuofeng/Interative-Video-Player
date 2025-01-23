export interface Subtitle {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface WordExplanation {
  word: string;
  explanation: string;
  examples: string[];
}

export interface AISettings {
  apiKey: string;
  apiEndpoint: string;
  model: string;
  isConfigured: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export type ExplanationDisplayType = 'modal' | 'floating';

export interface YoutubeSettings {
  apiKey: string;
  enableCORSProxy: boolean;
}

export interface VideoState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  subtitles: Subtitle[];
  selectedWord: string | null;
  wordExplanation: WordExplanation | null;
  aiSettings: AISettings;
  videoElement: HTMLVideoElement | null;
  explanationDisplay: ExplanationDisplayType;
  explanationPosition: Position | null;
  videoSourceType: 'local' | 'youtube';
  youtubeVideoId: string | null;
  youtubeCaptions: Subtitle[];
  youtubePlayer: YT.Player | null;
  youtubeSettings: YoutubeSettings;
}