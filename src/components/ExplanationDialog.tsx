import React from 'react';
import { motion } from 'framer-motion';

interface ExplanationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string;
  suggestion: string;
  emotionName: string;
  emotionEmoji: string;
  relatedItem?: {
    id: string;
    type: 'goal' | 'initiative';
    name: string;
  } | null;
}

const ExplanationDialog: React.FC<ExplanationDialogProps> = ({
  isOpen,
  onClose,
  explanation,
  suggestion,
  emotionName,
  emotionEmoji,
  relatedItem
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-gray-950 border border-gray-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6 text-gray-200"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{emotionEmoji}</span>
            How to do this
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <p className="text-white font-medium">{suggestion}</p>
            {relatedItem && (
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  relatedItem.type === 'initiative' 
                    ? 'bg-blue-900 text-blue-200' 
                    : 'bg-green-900 text-green-200'
                }`}>
                  {relatedItem.type === 'initiative' ? '⭐ Initiative: ' : '🎯 Goal: '}
                  {relatedItem.name}
                </span>
              </div>
            )}
          </div>

          <div className="prose prose-invert max-w-none">
            {explanation.split('\n').map((paragraph, index) => (
              <p key={index} className="text-gray-300 mb-4">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="py-2 px-4 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExplanationDialog; 