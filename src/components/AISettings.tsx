import React, { useState } from 'react';
import useVideoStore from '../store/videoStore';
import { Settings2 } from 'lucide-react';

const AISettings: React.FC = () => {
  const { aiSettings, explanationDisplay, setVideoState } = useVideoStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    setVideoState({
      aiSettings: {
        apiKey: formData.get('apiKey') as string,
        apiEndpoint: formData.get('apiEndpoint') as string,
        model: formData.get('model') as string,
        isConfigured: true,
      }
    });
    setIsOpen(false);
  };

  const handleDisplayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVideoState({
      explanationDisplay: e.target.value as 'modal' | 'floating'
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
      >
        <Settings2 className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">设置</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API Key
            </label>
            <input
              type="password"
              name="apiKey"
              defaultValue={aiSettings.apiKey}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API Endpoint
            </label>
            <input
              type="url"
              name="apiEndpoint"
              defaultValue={aiSettings.apiEndpoint}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Model
            </label>
            <input
              type="text"
              name="model"
              defaultValue={aiSettings.model}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              解释显示方式
            </label>
            <select
              value={explanationDisplay}
              onChange={handleDisplayChange}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 text-white"
            >
              <option value="floating">悬浮卡片</option>
              <option value="modal">模态框</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettings;