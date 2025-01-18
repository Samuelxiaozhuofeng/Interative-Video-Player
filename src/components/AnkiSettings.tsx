import React, { useEffect, useState } from 'react';
import { testConnection, getDeckNames, getModelNames, getModelFieldNames } from '../services/ankiConnect';
import { CardFieldMapping } from '../types/card';
import useAnkiStore from '../store/ankiStore';

const AnkiSettings: React.FC = () => {
    const { setAnkiSettings, setIsConnected, isConnected, deckName: savedDeckName, modelName: savedModelName, fieldMapping: savedFieldMapping } = useAnkiStore();
    const [decks, setDecks] = useState<string[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [selectedDeck, setSelectedDeck] = useState(savedDeckName);
    const [selectedModel, setSelectedModel] = useState(savedModelName);
    const [fields, setFields] = useState<string[]>([]);
    const [fieldMapping, setFieldMapping] = useState<CardFieldMapping>(savedFieldMapping);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 组件加载时自动连接
    useEffect(() => {
        checkConnection();
    }, []);

    // 当选择改变时更新设置
    useEffect(() => {
        if (selectedDeck && selectedModel) {
            setAnkiSettings({
                deckName: selectedDeck,
                modelName: selectedModel,
                fieldMapping
            });
        }
    }, [selectedDeck, selectedModel, fieldMapping, setAnkiSettings]);

    // 当连接状态改变时，重新加载数据
    useEffect(() => {
        if (isConnected) {
            loadDecksAndModels();
            if (savedModelName && savedModelName.length > 0) {
                loadModelFields(savedModelName);
            }
        }
    }, [isConnected, savedModelName]);

    const loadModelFields = async (modelName: string) => {
        try {
            const fieldNames = await getModelFieldNames(modelName);
            setFields(fieldNames);
        } catch (err) {
            console.error('Failed to load model fields:', err);
        }
    };

    const checkConnection = async () => {
        setLoading(true);
        setError(null);
        try {
            const connected = await testConnection();
            setIsConnected(connected);
            if (!connected) {
                setError('Anki 连接失败：无法获取版本信息');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            let userMessage = '无法连接到 Anki。';
            
            if (errorMessage.includes('Failed to fetch')) {
                userMessage += '\n请确保：\n1. Anki 已启动\n2. AnkiConnect 插件已安装并正确配置\n3. 已在 AnkiConnect 配置中添加了 CORS 设置';
            } else {
                userMessage += '\n错误信息：' + errorMessage;
            }
            
            setError(userMessage);
            setIsConnected(false);
        }
        setLoading(false);
    };

    const loadDecksAndModels = async () => {
        try {
            const [deckList, modelList] = await Promise.all([
                getDeckNames(),
                getModelNames()
            ]);
            setDecks(deckList);
            setModels(modelList);
        } catch (err) {
            setError('加载牌组和笔记类型失败');
        }
    };

    const handleModelChange = async (modelName: string) => {
        setSelectedModel(modelName);
        try {
            const fieldNames = await getModelFieldNames(modelName);
            setFields(fieldNames);
            // 保持现有的字段映射
            const newFieldMapping = { ...fieldMapping };
            // 移除不存在的字段的映射
            Object.entries(newFieldMapping).forEach(([key, value]) => {
                if (!fieldNames.includes(value)) {
                    delete newFieldMapping[key];
                }
            });
            setFieldMapping(newFieldMapping);
        } catch (err) {
            setError('加载字段失败');
        }
    };

    const handleFieldMappingChange = (fieldName: string, mappingType: keyof CardFieldMapping) => {
        setFieldMapping(prev => {
            const newMapping = { ...prev };
            
            Object.entries(prev).forEach(([key, value]) => {
                if (value === fieldName) {
                    delete newMapping[key];
                }
            });
            
            if (mappingType) {
                newMapping[mappingType] = fieldName;
            }
            
            return newMapping;
        });
    };

    if (loading) {
        return <div className="p-4 text-white">正在连接 Anki...</div>;
    }

    return (
        <div className="p-4 bg-gray-800 rounded-lg text-white">
            <div className="mb-4 flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>{isConnected ? 'Anki 已连接' : 'Anki 未连接'}</span>
                {!isConnected && (
                    <button
                        onClick={checkConnection}
                        className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                        重试连接
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6">
                    <div className="p-4 bg-red-600 text-white rounded-lg">
                        <h3 className="text-lg font-bold mb-2">连接失败</h3>
                        <p className="whitespace-pre-line">{error}</p>
                    </div>
                </div>
            )}
            
            <div className="space-y-4">
                <div>
                    <label className="block mb-2">选择牌组</label>
                    <select
                        value={selectedDeck}
                        onChange={(e) => setSelectedDeck(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded"
                        disabled={!isConnected}
                    >
                        <option value="">选择牌组...</option>
                        {decks.map(deck => (
                            <option key={deck} value={deck}>{deck}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block mb-2">选择笔记类型</label>
                    <select
                        value={selectedModel}
                        onChange={(e) => handleModelChange(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded"
                        disabled={!isConnected}
                    >
                        <option value="">选择笔记类型...</option>
                        {models.map(model => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                {fields.length > 0 && (
                    <div>
                        <label className="block mb-2">字段映射</label>
                        <div className="space-y-2">
                            {fields.map(field => (
                                <div key={field} className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                                    <span className="flex-1">{field}</span>
                                    <select
                                        value={Object.entries(fieldMapping).find(([_, v]) => v === field)?.[0] || ''}
                                        onChange={(e) => handleFieldMappingChange(field, e.target.value as keyof CardFieldMapping)}
                                        className="bg-gray-600 p-1 rounded"
                                        disabled={!isConnected}
                                    >
                                        <option value="">不映射</option>
                                        <option value="word">单词</option>
                                        <option value="sentence">句子</option>
                                        <option value="explanation">解释</option>
                                        <option value="audio">音频</option>
                                        <option value="image">图片</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnkiSettings; 