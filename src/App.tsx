import React, { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import SubtitleDisplay from './components/SubtitleDisplay';
import FileUpload from './components/FileUpload';
import AISettings from './components/AISettings';
import AnkiModal from './components/AnkiModal';
import useAnkiStore from './store/ankiStore';

function App() {
  const [isAnkiModalOpen, setIsAnkiModalOpen] = useState(false);
  const { startAutoConnect, stopAutoConnect } = useAnkiStore();

  // 应用启动时开始自动连接
  useEffect(() => {
    startAutoConnect();
    return () => stopAutoConnect();
  }, [startAutoConnect, stopAutoConnect]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Interactive Video Player
          </h1>
          <div className="space-x-4">
            <button
              onClick={() => setIsAnkiModalOpen(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Anki 设置
            </button>
          </div>
        </div>
        
        <FileUpload />
        <VideoPlayer />
        <SubtitleDisplay />
        <div className="mt-4">
          <AISettings />
        </div>
      </div>

      <AnkiModal 
        isOpen={isAnkiModalOpen}
        onClose={() => setIsAnkiModalOpen(false)}
      />
    </div>
  );
}

export default App;