import React, { useState } from 'react';
import useVideoStore from '../store/videoStore';
import useAnkiStore from '../store/ankiStore';
import { getWordExplanation } from '../services/aiService';
import { Brain } from 'lucide-react';
import ExplanationModal from './ExplanationModal';
import FloatingCard from './FloatingCard';
import { addNoteWithMedia } from '../services/ankiConnect';
import { CardContent } from '../types/card';
import { extractAudioFromVideo, captureVideoFrame } from '../utils/mediaUtils';

interface PreparedMedia {
  audioBlob: Blob;
  imageBlob: Blob;
}

const SubtitleDisplay: React.FC = () => {
  const { 
    currentTime, 
    subtitles, 
    selectedWord, 
    wordExplanation, 
    explanationDisplay,
    explanationPosition,
    setVideoState, 
    aiSettings, 
    videoElement,
    isPlaying
  } = useVideoStore();
  const { isConnected: isAnkiConnected, deckName, modelName, fieldMapping } = useAnkiStore();
  const [isLoading, setIsLoading] = useState(false);
  const [preparedMedia, setPreparedMedia] = useState<PreparedMedia | null>(null);

  const currentSubtitles = subtitles.filter(
    sub => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  // 准备媒体文件的函数
  const prepareMedia = async (subtitle: { startTime: number; endTime: number }) => {
    if (!videoElement) return null;
    
    try {
      // 并行处理音频提取和视频截图
      const [audioBlob, imageBlob] = await Promise.all([
        extractAudioFromVideo(
          videoElement,
          subtitle.startTime,
          subtitle.endTime
        ),
        captureVideoFrame(videoElement)
      ]);

      return { audioBlob, imageBlob };
    } catch (error) {
      console.error('准备媒体文件失败:', error);
      return null;
    }
  };

  const handleWordClick = async (event: React.MouseEvent, word: string) => {
    if (isPlaying) {
      setVideoState({ isPlaying: false });
      videoElement?.pause();
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
      // 开始准备媒体文件
      const mediaPromise = prepareMedia(currentSubtitle);
      
      // 同时获取AI解释
      const context = currentSubtitles.map(sub => sub.text).join(' ');
      const explanationPromise = getWordExplanation(word, context, aiSettings);

      try {
        // 等待两个任务都完成
        const [media, explanation] = await Promise.all([
          mediaPromise,
          explanationPromise
        ]);

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

  const handleCloseExplanation = () => {
    setVideoState({ 
      selectedWord: null, 
      wordExplanation: null,
      explanationPosition: null 
    });
    // 清理准备好的媒体文件
    setPreparedMedia(null);
    // 继续播放视频
    setVideoState({ isPlaying: true });
    videoElement?.play();
  };

  const handleAddToAnki = async (content: CardContent) => {
    if (!deckName || !modelName || !fieldMapping) {
      throw new Error('请先在设置中配置 Anki 牌组和笔记类型');
    }

    if (!videoElement) {
      throw new Error('视频元素未加载');
    }

    try {
      const currentSubtitle = currentSubtitles[0];
      if (!currentSubtitle) {
        throw new Error('未找到当前字幕');
      }

      let mediaContent: PreparedMedia;
      if (preparedMedia) {
        // 使用已准备好的媒体文件
        mediaContent = preparedMedia;
      } else {
        // 如果没有准备好的媒体文件（异常情况），重新获取
        const audioBlob = await extractAudioFromVideo(
          videoElement,
          currentSubtitle.startTime,
          currentSubtitle.endTime
        );
        const imageBlob = await captureVideoFrame(videoElement);
        mediaContent = { audioBlob, imageBlob };
      }

      const contentWithMedia: CardContent = {
        ...content,
        audioBlob: mediaContent.audioBlob,
        imageBlob: mediaContent.imageBlob
      };

      await addNoteWithMedia(
        deckName,
        modelName,
        contentWithMedia,
        fieldMapping
      );

      // 添加成功后清理媒体文件
      setPreparedMedia(null);
      
      // 继续播放视频并关闭解释
      setVideoState({ isPlaying: true });
      videoElement?.play();
      handleCloseExplanation();
    } catch (error) {
      console.error('添加到 Anki 失败:', error);
      throw error;
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="text-white text-lg mb-4">
          {currentSubtitles.map((subtitle, index) => (
            <p key={subtitle.id} className="mb-2">
              {subtitle.text.split(' ').map((word, wordIndex) => (
                <span
                  key={`${subtitle.id}-${wordIndex}`}
                  className={`cursor-pointer hover:text-blue-400 ${
                    selectedWord === word ? 'text-blue-400' : ''
                  }`}
                  onClick={(e) => handleWordClick(e, word)}
                >
                  {word}{' '}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>

      {wordExplanation && explanationPosition && explanationDisplay === 'floating' && (
        <FloatingCard
          content={{
            word: wordExplanation.word,
            sentence: currentSubtitles[0]?.text || '',
            explanation: wordExplanation.explanation,
            timestamp: {
              start: currentSubtitles[0]?.startTime || 0,
              end: currentSubtitles[0]?.endTime || 0
            }
          }}
          position={explanationPosition}
          onClose={handleCloseExplanation}
          onAddToAnki={isAnkiConnected ? handleAddToAnki : undefined}
          isAnkiConnected={isAnkiConnected}
        />
      )}

      {wordExplanation && explanationDisplay === 'modal' && (
        <ExplanationModal
          isOpen={!!wordExplanation}
          onClose={handleCloseExplanation}
          content={{
            word: wordExplanation.word,
            sentence: currentSubtitles[0]?.text || '',
            explanation: wordExplanation.explanation,
            timestamp: {
              start: currentSubtitles[0]?.startTime || 0,
              end: currentSubtitles[0]?.endTime || 0
            }
          }}
          onAddToAnki={handleAddToAnki}
          isAnkiConnected={isAnkiConnected}
        />
      )}
    </div>
  );
};

export default SubtitleDisplay;