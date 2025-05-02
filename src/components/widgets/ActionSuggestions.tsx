import React from 'react';
import { motion } from 'framer-motion';
import { EnhancedSuggestion } from '../../utils/api';

interface ActionSuggestionsProps {
  suggestions: EnhancedSuggestion[];
  loading: boolean;
  selectedSuggestion: string | null;
  onSelect: (suggestion: EnhancedSuggestion) => void;
}

const ActionSuggestions: React.FC<ActionSuggestionsProps> = ({
  suggestions,
  loading,
  selectedSuggestion,
  onSelect,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-200 mb-4">Suggested Actions</h3>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-opacity-50 border-t-primary"></div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              className={`w-full text-left p-4 rounded-md border transition-colors ${
                selectedSuggestion === suggestion.text
                  ? 'bg-primary bg-opacity-20 border-primary text-white'
                  : 'bg-gray-900 hover:bg-gray-800 border-gray-800 hover:border-gray-700 text-gray-200'
              }`}
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(suggestion)}
            >
              <div className="flex flex-col space-y-2">
                <span>{suggestion.text}</span>
                {suggestion.relatedItem && (
                  <div className="flex items-center mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      suggestion.relatedItem.type === 'initiative' 
                        ? 'bg-blue-900 text-blue-200' 
                        : 'bg-green-900 text-green-200'
                    }`}>
                      {suggestion.relatedItem.type === 'initiative' ? '⭐ Initiative: ' : '🎯 Goal: '}
                      {suggestion.relatedItem.name}
                    </span>
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 italic text-center py-4">No suggestions available.</p>
      )}
    </div>
  );
};

export default ActionSuggestions; 