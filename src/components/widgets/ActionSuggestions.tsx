import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { EnhancedSuggestion } from '../../utils/api';
import { Icon } from '@iconify/react';
import mdiPencil from '@iconify-icons/mdi/pencil';
import mdiHelpCircle from '@iconify-icons/mdi/help-circle';
import { getSuggestionExplanation } from '../../utils/api';
import ExplanationDialog from '../ExplanationDialog';

interface ActionSuggestionsProps {
  suggestions: EnhancedSuggestion[];
  loading: boolean;
  selectedSuggestion: string | null;
  onSelect: (suggestion: EnhancedSuggestion) => void;
  emotionName: string;
  emotionEmoji: string;
  isPositive: boolean;
}

const ActionSuggestions: React.FC<ActionSuggestionsProps> = ({
  suggestions,
  loading,
  selectedSuggestion,
  onSelect,
  emotionName,
  emotionEmoji,
  isPositive
}) => {
  const [editingOrigIndex, setEditingOrigIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [freeText, setFreeText] = useState('');
  const [localSuggestions, setLocalSuggestions] = useState<EnhancedSuggestion[] | null>(null);
  const [explanationDialog, setExplanationDialog] = useState<{
    isOpen: boolean;
    suggestion: string;
    explanation: string;
    relatedItem?: {
      id: string;
      type: 'goal' | 'initiative';
      name: string;
    } | null;
  } | null>(null);

  // Reset localSuggestions when suggestions prop changes
  useEffect(() => {
    setLocalSuggestions(null);
  }, [suggestions]);

  // Only show suggestions with at least 6 characters
  const baseSuggestions = localSuggestions || suggestions;
  const shownSuggestions = baseSuggestions
    .map((s, i) => ({ ...s, _origIndex: i }))
    .filter(s => (s.text || '').length > 5);

  const handleEdit = (origIndex: number, text: string) => {
    setEditingOrigIndex(origIndex);
    setEditingText(text);
  };

  const handleEditSave = (origIndex: number, suggestion: EnhancedSuggestion) => {
    if (editingText.trim().length >= 6 && editingText !== suggestion.text) {
      // Update local suggestions at the original index
      const updated = [...baseSuggestions];
      updated[origIndex] = { ...suggestion, text: editingText };
      setLocalSuggestions(updated);
      onSelect({ ...suggestion, text: editingText });
    }
    setEditingOrigIndex(null);
    setEditingText('');
  };

  const handleGetExplanation = async (suggestion: EnhancedSuggestion) => {
    try {
      const explanation = await getSuggestionExplanation(
        suggestion.text,
        emotionName,
        isPositive,
        suggestion.relatedItem
      );
      
      setExplanationDialog({
        isOpen: true,
        suggestion: suggestion.text,
        explanation,
        relatedItem: suggestion.relatedItem || null
      });
    } catch (error) {
      console.error('Error getting explanation:', error);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-200 mb-4">Suggested Actions</h3>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] py-8 space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-opacity-30">
              <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-pulse"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-gray-400 text-sm animate-pulse text-center">Generating suggestions...</p>
        </div>
      ) : shownSuggestions.length > 0 ? (
        <div className="space-y-3">
          {shownSuggestions.map((suggestion, idx) => (
            <motion.div key={suggestion._origIndex} className="relative">
              {editingOrigIndex === suggestion._origIndex ? (
                <textarea
                  className="w-full p-3 rounded-md border border-primary bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary min-h-[48px] resize-y"
                  value={editingText}
                  autoFocus
                  rows={2}
                  onChange={e => setEditingText(e.target.value)}
                  onBlur={() => handleEditSave(suggestion._origIndex, suggestion)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleEditSave(suggestion._origIndex, suggestion);
                    }
                    if (e.key === 'Escape') { setEditingOrigIndex(null); setEditingText(''); }
                  }}
                />
              ) : (
            <motion.button
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
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  className="text-gray-400 hover:text-primary"
                  onClick={e => { e.stopPropagation(); handleGetExplanation(suggestion); }}
                  title="Get explanation"
                >
                  <Icon icon={mdiHelpCircle} width="18" height="18" />
                </button>
                {editingOrigIndex !== suggestion._origIndex && (
                  <button
                    className="text-gray-400 hover:text-primary"
                    onClick={e => { e.stopPropagation(); handleEdit(suggestion._origIndex, suggestion.text); }}
                    title="Edit suggestion"
                  >
                    <Icon icon={mdiPencil} width="18" height="18" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {/* Free text field as last element */}
          <div className="relative">
            <textarea
              className="w-full p-3 rounded-md border border-gray-700 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary mt-2 min-h-[48px] resize-y"
              placeholder="Nevermind, I want to ...."
              value={freeText}
              rows={2}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && freeText.trim().length >= 6) {
                  e.preventDefault();
                  onSelect({ text: freeText.trim() });
                  setFreeText('');
                }
              }}
            />
          </div>
        </div>
      ) : (
        <>
        <p className="text-gray-400 italic text-center py-4">No suggestions available.</p>
          {/* Free text field as last element even if no suggestions */}
          <div className="relative">
            <textarea
              className="w-full p-3 rounded-md border border-gray-700 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary mt-2 min-h-[48px] resize-y"
              placeholder="Nevermind, I want to ...."
              value={freeText}
              rows={2}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && freeText.trim().length >= 6) {
                  e.preventDefault();
                  onSelect({ text: freeText.trim() });
                  setFreeText('');
                }
              }}
            />
          </div>
        </>
      )}

      {explanationDialog && (
        <ExplanationDialog
          isOpen={explanationDialog.isOpen}
          onClose={() => setExplanationDialog(null)}
          explanation={explanationDialog.explanation}
          suggestion={explanationDialog.suggestion}
          emotionName={emotionName}
          emotionEmoji={emotionEmoji}
          relatedItem={explanationDialog.relatedItem}
        />
      )}
    </div>
  );
};

export default ActionSuggestions; 