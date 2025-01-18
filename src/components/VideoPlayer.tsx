import React, { useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import useVideoStore from '../store/videoStore';

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { currentTime, duration, isPlaying, volume, setVideoState } = useVideoStore();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (videoRef.current) {
      setVideoState({ videoElement: videoRef.current });
    }
    return () => {
      setVideoState({ videoElement: null });
    };
  }, [setVideoState]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoState({ currentTime: videoRef.current.currentTime });
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setVideoState({ isPlaying: !isPlaying });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVideoState({ volume: newVolume });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
      <video
        ref={videoRef}
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setVideoState({ duration: videoRef.current.duration });
          }
        }}
      />
      
      <div className="p-4 bg-gray-800">
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full hover:bg-gray-700 text-white"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          
          <div className="flex items-center gap-2 text-white">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Volume2 size={20} className="text-white" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>

        <div className="mt-2">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                const time = parseFloat(e.target.value);
                videoRef.current.currentTime = time;
                setVideoState({ currentTime: time });
              }
            }}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;