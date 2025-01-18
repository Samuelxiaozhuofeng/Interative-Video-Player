import React, { useRef, useEffect } from 'react';
import { CardContent } from '../types/card';
import { Plus, Loader2, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingCardProps {
  content: {
    word: string;
    sentence: string;
    explanation: string;
    timestamp: {
      start: number;
      end: number;
    };
  };
  position: {
    x: number;
    y: number;
  };
  onClose: () => void;
  onAddToAnki?: (content: CardContent) => Promise<void>;
  isAnkiConnected?: boolean;
}

const FloatingCard: React.FC<FloatingCardProps> = ({
  content,
  position,
  onClose,
  onAddToAnki,
  isAnkiConnected
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={cardRef}
      className="fixed bg-gray-800/90 rounded-lg p-4 shadow-lg w-80 backdrop-blur-sm border border-gray-700"
      style={{ left: position.x, top: position.y }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <X size={16} />
      </button>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-white">{content.word}</h3>
          <p className="text-xs text-gray-300">{content.sentence}</p>
        </div>

        <div>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{content.explanation}</p>
        </div>

        {isAnkiConnected && onAddToAnki && (
          <button
            onClick={() => onAddToAnki(content)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Plus size={14} />
            添加到Anki
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FloatingCard; 