import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';

interface FollowupData {
  entryId: string;
  timestamp: string;
  suggestion: string;
  emotion: {
    id: string;
    name: string;
    emoji: string;
    isPositive: boolean;
  };
  relatedItem?: {
    id: string;
    name: string;
    type: 'goal' | 'initiative';
  } | null;
}

const FollowupDialog: React.FC = () => {
  const { data, updateEmotionRecordFollowup } = useData();
  const [followupData, setFollowupData] = useState<FollowupData | null>(null);
  const [followupText, setFollowupText] = useState('');
  const [feedback, setFeedback] = useState<boolean | string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Check for followup data when component mounts
  useEffect(() => {
    const checkFollowup = () => {
      const stored = localStorage.getItem('redbutton_followup');
      if (stored) {
        try {
          const data = JSON.parse(stored);
          setFollowupData(data);
          setIsVisible(true);
        } catch (e) {
          console.error('Failed to parse followup data:', e);
        }
      }
    };

    // Check immediately
    checkFollowup();

    // Also check when window gains focus
    const handleFocus = () => {
      checkFollowup();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleSubmit = () => {
    if (followupData && (followupText.trim() || feedback !== null)) {
      // Update the emotion record with followup and feedback
      updateEmotionRecordFollowup(
        followupData.entryId,
        followupData.timestamp,
        followupText.trim(),
        feedback === null ? '' : feedback
      );

      // Clear the stored followup data
      localStorage.removeItem('redbutton_followup');
      
      // Close the dialog
      setIsVisible(false);
      setFollowupData(null);
      setFollowupText('');
      setFeedback(null);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('redbutton_followup');
    setIsVisible(false);
    setFollowupData(null);
    setFollowupText('');
    setFeedback(null);
  };

  if (!isVisible || !followupData) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-gray-950 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 text-gray-200"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{followupData.emotion.emoji}</span>
            Follow-up
          </h2>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-200 rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            How did it go with:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 mb-4">
            <p className="text-white">{followupData.suggestion}</p>
            {followupData.relatedItem && (
              <div className="mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  followupData.relatedItem.type === 'initiative' 
                    ? 'bg-blue-900 text-blue-200' 
                    : 'bg-green-900 text-green-200'
                }`}>
                  {followupData.relatedItem.type === 'initiative' ? '⭐ Initiative: ' : '🎯 Goal: '}
                  {followupData.relatedItem.name}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Did this help?
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFeedback(true)}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  feedback === true
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                👍 Yes
              </button>
              <button
                onClick={() => setFeedback(false)}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  feedback === false
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                👎 No
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tell us more (optional)
            </label>
            <textarea
              className="w-full p-3 rounded-md border border-gray-700 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
              value={followupText}
              onChange={(e) => setFollowupText(e.target.value)}
              placeholder="How did it go? What did you learn?"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleSkip}
              className="py-2 px-4 bg-gray-800 text-gray-300 rounded-md hover:bg-gray-700"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={!followupText.trim() && feedback === null}
              className={`py-2 px-4 rounded-md ${
                followupText.trim() || feedback !== null
                  ? 'bg-primary text-white hover:bg-opacity-90'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FollowupDialog; 