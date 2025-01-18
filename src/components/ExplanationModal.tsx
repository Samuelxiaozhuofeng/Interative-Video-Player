import React, { useState } from 'react';
import { CardContent } from '../types/card';
import { Plus, Loader2, Check, X } from 'lucide-react';

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    content: {
        word: string;
        sentence: string;
        explanation: string;
        timestamp: {
            start: number;
            end: number;
        };
    };
    onAddToAnki: (content: CardContent) => Promise<void>;
    isAnkiConnected: boolean;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
    isOpen,
    onClose,
    content,
    onAddToAnki,
    isAnkiConnected
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [addStatus, setAddStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    if (!isOpen) return null;

    const handleAddToAnki = async () => {
        setIsAdding(true);
        setAddStatus('idle');
        setErrorMessage('');

        try {
            await onAddToAnki(content);
            setAddStatus('success');
            // 2秒后关闭模态框
            setTimeout(() => {
                onClose();
                setAddStatus('idle');
            }, 2000);
        } catch (error) {
            setAddStatus('error');
            setErrorMessage(error instanceof Error ? error.message : '添加失败');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-bold text-white">单词</h3>
                        <p className="text-gray-300">{content.word}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white">句子</h3>
                        <p className="text-gray-300">{content.sentence}</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-white">解释</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{content.explanation}</p>
                    </div>

                    {isAnkiConnected && (
                        <div>
                            {addStatus === 'error' && (
                                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300">
                                    <div className="flex items-center gap-2">
                                        <X size={18} />
                                        <span>错误：{errorMessage}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleAddToAnki}
                                disabled={isAdding || addStatus === 'success'}
                                className={`mt-4 flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                                    addStatus === 'success'
                                        ? 'bg-green-600 text-white'
                                        : isAdding
                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                            >
                                {isAdding ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        正在添加...
                                    </>
                                ) : addStatus === 'success' ? (
                                    <>
                                        <Check size={20} />
                                        添加成功
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        添加到 Anki
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExplanationModal; 