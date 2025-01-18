import React, { useState } from 'react';
import useVideoStore from '../store/videoStore';
import useAnkiStore from '../store/ankiStore';
import { getWordExplanation } from '../services/aiService';
import { Brain } from 'lucide-react';
import ExplanationModal from './ExplanationModal';
import { addNoteWithMedia } from '../services/ankiConnect';
import { CardContent } from '../types/card';
import { extractAudioFromVideo, captureVideoFrame } from '../utils/mediaUtils';

const SubtitleDisplay: React.FC = () => {
  const { currentTime, subtitles, selectedWord, wordExplanation, setVideoState, aiSettings, videoElement } = useVideoStore();
  const { isConnected: isAnkiConnected, deckName, modelName, fieldMapping } = useAnkiStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentSubtitles = subtitles.filter(
    sub => currentTime >= sub.startTime && currentTime <= sub.endTime
  );

  const handleWordClick = async (word: string) => {
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

    setIsLoading(true);
    setVideoState({ selectedWord: word });

    const context = currentSubtitles.map(sub => sub.text).join(' ');

    try {
      const explanation = await getWordExplanation(word, context, aiSettings);
      setVideoState({ wordExplanation: explanation });
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToAnki = async (content: CardContent) => {
    if (!deckName || !modelName || !fieldMapping) {
      throw new Error('请先在设置中配置 Anki 牌组和笔记类型');
    }

    if (!videoElement) {
      throw new Error('视频元素未加载');
    }

    try {
      // 获取当前字幕的时间范围
      const currentSubtitle = currentSubtitles[0];
      if (!currentSubtitle) {
        throw new Error('未找到当前字幕');
      }

      // 提取音频
      const audioBlob = await extractAudioFromVideo(
        videoElement,
        currentSubtitle.startTime,
        currentSubtitle.endTime
      );

      // 捕获当前视频帧
      const imageBlob = await captureVideoFrame(videoElement);

      // 添加音频和图片到内容中
      const contentWithMedia: CardContent = {
        ...content,
        audioBlob,
        imageBlob
      };

      // 添加到 Anki
      await addNoteWithMedia(
        deckName,
        modelName,
        contentWithMedia,
        fieldMapping
      );
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
                  key={wordIndex}
                  onClick={() => handleWordClick(word)}
                  className={`cursor-pointer transition-colors px-1 rounded ${
                    selectedWord === word 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'hover:text-blue-400'
                  }`}
                >
                  {word}
                </span>
              ))}
            </p>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-4 bg-gray-700/50 rounded-lg">
            <Brain className="w-6 h-6 text-indigo-400 animate-pulse" />
            <span className="ml-2 text-white">正在分析中...</span>
          </div>
        )}

        {wordExplanation && (
          <ExplanationModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            content={{
              word: wordExplanation.word,
              sentence: currentSubtitles[0]?.text || '',
              explanation: wordExplanation.explanation,
              timestamp: {
                start: currentTime,
                end: currentTime + 5
              }
            }}
            onAddToAnki={handleAddToAnki}
            isAnkiConnected={isAnkiConnected}
          />
        )}
      </div>
    </div>
  );
};

export default SubtitleDisplay;