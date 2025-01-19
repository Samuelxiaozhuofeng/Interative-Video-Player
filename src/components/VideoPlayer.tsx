import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2, Maximize, Minimize } from 'lucide-react';
import useVideoStore from '../store/videoStore';
import { getWordExplanation } from '../services/aiService';
import { extractAudioFromVideo, captureVideoFrame } from '../utils/mediaUtils';

interface PreparedMedia {
  audioBlob: Blob;
  imageBlob: Blob;
}

const VideoPlayer: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { 
    currentTime, 
    duration, 
    isPlaying, 
    volume, 
    subtitles, 
    selectedWord,
    aiSettings,
    setVideoState 
  } = useVideoStore();
  const [isLoading, setIsLoading] = useState(false);
  const [preparedMedia, setPreparedMedia] = useState<PreparedMedia | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const currentSubtitles = subtitles.filter(
    sub => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  const handleWordClick = async (event: React.MouseEvent, word: string) => {
    event.preventDefault();
    if (isPlaying) {
      videoRef.current?.pause();
      setVideoState({ isPlaying: false });
    }

    if (!aiSettings.isConfigured) {
      setVideoState({
        selectedWord: word,
        wordExplanation: {
          word,
          explanation: '请先配置AI设置',
          examples: ['点击右下角的设置图标来配置AI']
        }
      });
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const position = {
      x: rect.left,
      y: rect.bottom + window.scrollY
    };

    setIsLoading(true);
    setVideoState({ 
      selectedWord: word,
      explanationPosition: position
    });

    const currentSubtitle = currentSubtitles[0];
    if (currentSubtitle) {
      try {
        // 准备媒体文件
        const media = await prepareMedia(currentSubtitle);
        
        // 获取AI解释
        const context = currentSubtitles.map(sub => sub.text).join(' ');
        const explanation = await getWordExplanation(word, context, aiSettings);

        if (media) {
          setPreparedMedia(media);
        }
        setVideoState({ wordExplanation: explanation });
      } catch (error) {
        console.error('处理失败:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const prepareMedia = async (subtitle: { startTime: number; endTime: number }) => {
    if (!videoRef.current) return null;
    
    try {
      const [audioBlob, imageBlob] = await Promise.all([
        extractAudioFromVideo(
          videoRef.current,
          subtitle.startTime,
          subtitle.endTime
        ),
        captureVideoFrame(videoRef.current)
      ]);

      return { audioBlob, imageBlob };
    } catch (error) {
      console.error('准备媒体文件失败:', error);
      return null;
    }
  };

  // 添加全屏相关的useEffect
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement !== null);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('全屏切换失败:', error);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="bg-gray-800 rounded-lg overflow-hidden shadow-xl relative"
    >
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
      
      {/* 字幕显示区域 */}
      <div className={`absolute ${isFullscreen ? 'bottom-[100px]' : 'bottom-[70px]'} left-0 right-0 flex justify-center pointer-events-none`}>
        <div className="max-w-[80%] text-center pointer-events-auto">
          {currentSubtitles.map((subtitle) => (
            <p 
              key={subtitle.id} 
              className={`mb-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg ${isFullscreen ? 'text-2xl' : 'text-lg'}`}
            >
              {subtitle.text.split(' ').map((word, wordIndex) => (
                <span
                  key={`${subtitle.id}-${wordIndex}`}
                  className={`cursor-pointer hover:text-blue-400 ${
                    selectedWord === word ? 'text-blue-400' : 'text-white'
                  } ${isLoading ? 'animate-pulse' : ''}`}
                  onClick={(e) => handleWordClick(e, word)}
                >
                  {word}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      <div className={`p-4 bg-gray-800 ${isFullscreen ? 'absolute bottom-0 left-0 right-0 bg-opacity-90' : ''}`}>
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
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-gray-700 text-white"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
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