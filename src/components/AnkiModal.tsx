import React, { useEffect } from 'react';
import AnkiSettings from './AnkiSettings';
import useAnkiStore from '../store/ankiStore';

interface AnkiModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AnkiModal: React.FC<AnkiModalProps> = ({ isOpen, onClose }) => {
    const { saveSettings, loadSavedSettings } = useAnkiStore();

    useEffect(() => {
        if (isOpen) {
            loadSavedSettings();
        }
    }, [isOpen, loadSavedSettings]);

    if (!isOpen) return null;

    const handleSave = () => {
        saveSettings();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-white mb-4">Anki 设置</h2>
                <AnkiSettings />
                
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                        保存设置
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnkiModal; 