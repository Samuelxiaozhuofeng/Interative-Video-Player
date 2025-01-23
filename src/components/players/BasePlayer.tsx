import { RefObject } from 'react';

export interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface PlayerEventHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onError?: (error: Error) => void;
}

export interface BasePlayer {
  play(): Promise<void>;
  pause(): void;
  seekTo(time: number): void;
  setVolume(volume: number): void;
  getState(): PlayerState;
  getVideoElement(): RefObject<HTMLVideoElement | null>;
  destroy(): void;
}

export type PlayerType = 'html5' | 'youtube';