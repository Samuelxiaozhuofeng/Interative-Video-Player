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

  const handleCloseExplanation = () => {
    setVideoState({ 
      selectedWord: null, 
      wordExplanation: null,
      explanationPosition: null 
    });
    setPreparedMedia(null);
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
        mediaContent = preparedMedia;
      } else {
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

      setPreparedMedia(null);
      setVideoState({ isPlaying: true });
      videoElement?.play();
      handleCloseExplanation();
    } catch (error) {
      console.error('添加到 Anki 失败:', error);
      throw error;
    }
  };

  return (
    <>
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
    </>
  );
};

export default SubtitleDisplay;