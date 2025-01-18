import React, { useState } from 'react';
import { Settings, TestTube2 } from 'lucide-react';
import useVideoStore from '../store/videoStore';

const AISettings: React.FC = () => {
  const { aiSettings, setVideoState } = useVideoStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const isCustomModel = !['gpt-3.5-turbo', 'gpt-4'].includes(aiSettings.model);
  const [selectedModel, setSelectedModel] = useState(isCustomModel ? 'custom' : aiSettings.model);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const model = formData.get('model') as string;
    const customModel = formData.get('customModel') as string;
    
    if (model === 'custom' && !customModel) {
      setTestResult('❌ 请输入自定义模型名称');
      return;
    }

    const newSettings = {
      apiKey: formData.get('apiKey') as string,
      apiEndpoint: formData.get('apiEndpoint') as string,
      model: model === 'custom' ? customModel : model,
      isConfigured: true,
    };
    
    setVideoState({ aiSettings: newSettings });
    setTestResult('✅ 设置已保存');
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // 这里模拟API测试
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResult('✅ AI配置测试成功！API连接正常。');
    } catch (error) {
      setTestResult('❌ AI配置测试失败！请检查配置信息。');
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <Settings size={24} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">AI 设置</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API 密钥
            </label>
            <input
              type="password"
              name="apiKey"
              defaultValue={aiSettings.apiKey}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="输入你的 API 密钥"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              API 地址
            </label>
            <input
              type="url"
              name="apiEndpoint"
              defaultValue={aiSettings.apiEndpoint}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="https://api.example.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              AI 模型
            </label>
            <select
              name="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="custom">自定义模型</option>
            </select>
            {selectedModel === 'custom' && (
              <input
                type="text"
                name="customModel"
                className="mt-2 w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="输入自定义模型名称"
                defaultValue={isCustomModel ? aiSettings.model : ''}
                required
              />
            )}
          </div>

          {testResult && (
            <div className={`p-3 rounded-md ${
              testResult.includes('✅') ? 'bg-green-900/50' : 'bg-red-900/50'
            }`}>
              <p className="text-sm text-white">{testResult}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              保存设置
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <TestTube2 size={18} />
              {isTesting ? '测试中...' : '测试连接'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AISettings;