import { BasePlayer, PlayerState } from './BasePlayer';
import { RefObject } from 'react';

export class Html5Player implements BasePlayer {
  private videoRef: RefObject<HTMLVideoElement>;

  constructor(videoRef: RefObject<HTMLVideoElement>) {
    this.videoRef = videoRef;
    if (!this.videoRef.current) {
      throw new Error('Video element not found');
    }
  }

  async play(): Promise<void> {
    await this.videoRef.current?.play();
  }

  pause(): void {
    this.videoRef.current?.pause();
  }

  seekTo(time: number): void {
    if (this.videoRef.current) {
      this.videoRef.current.currentTime = time;
    }
  }

  setVolume(volume: number): void {
    if (this.videoRef.current) {
      this.videoRef.current.volume = volume;
    }
  }

  getState(): PlayerState {
    const video = this.videoRef.current;
    return {
      isPlaying: video ? !video.paused : false,
      currentTime: video?.currentTime || 0,
      duration: video?.duration || 0,
      volume: video?.volume || 1,
    };
  }

  getVideoElement(): RefObject<HTMLVideoElement> {
    return this.videoRef;
  }

  destroy(): void {
    if (this.videoRef.current) {
      this.videoRef.current.pause();
      this.videoRef.current.removeAttribute('src');
      this.videoRef.current.load();
    }
  }
}

export default Html5Player;