import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useData, EmotionRecord } from '../context/DataContext';
import { getSuggestionsForEmotion, EnhancedSuggestion } from '../utils/api';
import ActionSuggestions from './widgets/ActionSuggestions';
import { format } from 'date-fns';

// Define interfaces for the emotion data passed from the menu bar
interface EmotionData {
  id: string;
  isPositive: boolean;
  name: string;
  emoji: string;
  time?: number;
  action?: string;
}

// Timer status for IPC communication
export interface TimerStatus {
  isRunning: boolean;
  remainingSeconds: number;
  totalMinutes: number;
  activity: string;
  emotionName: string;
}

const SuggestionDialog: React.FC = () => {
  const navigate = useNavigate();
  const { data, addEmotionToJournal, updateJournalEntry, addCheckIn } = useData();
  
  // State for emotion data received from the menu bar
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null);
  
  // States for suggestions
  const [suggestions, setSuggestions] = useState<EnhancedSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [journalEntryId, setJournalEntryId] = useState<string | null>(null);
  const [initialEmotionTimestamp, setInitialEmotionTimestamp] = useState<string | null>(null);

  // Listen for emotion-selected events from the menu bar
  useEffect(() => {
    
    const handleEmotionSelected = (data: {
      id: string, 
      isPositive: boolean, 
      name: string, 
      emoji: string, 
      time?: number,
      action?: string
    }) => {
      console.log('Emotion selected:', data);
      setEmotionData(data);
      setShowSuggestions(true);
      
      // Record the emotion selection in the journal right away
      const today = format(new Date(), 'yyyy-MM-dd');
      const timestamp = new Date().toISOString();
      setInitialEmotionTimestamp(timestamp);
      
      const emotionRecord: EmotionRecord = {
        emotionId: data.id,
        timestamp: timestamp,
        timeInMinutes: data.time || 10, // Default to 10 minutes if not specified
        action: data.action // Make sure action is included
      };
      
      console.log('Recording emotion with action:', emotionRecord.action, 'and time:', emotionRecord.timeInMinutes);
      
      const entryId = addEmotionToJournal(today, emotionRecord);
      setJournalEntryId(entryId);
      
      // Then load suggestions
      loadSuggestions(data);
    };

    // Add listener for emotion-selected events
    const cleanup = window.electron?.onEmotionSelected(handleEmotionSelected);
    
    return () => {
      // Clean up the listener when component unmounts
      if (cleanup) {
        cleanup();
      }
    };
  }, [addEmotionToJournal]);

  // Load suggestions when an emotion is selected
  const loadSuggestions = async (emotionData: EmotionData) => {
    setIsLoading(true);
    
    try {
      // Use getSuggestionsForEmotion which returns enhanced suggestions with relatedItem information
      const generatedSuggestions = await getSuggestionsForEmotion(
        emotionData.id,
        emotionData.time || 10,
        data,
        emotionData.action
      );
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([
        { text: 'Take a deep breath and count to 10' },
        { text: 'Write down what you are feeling right now' },
        { text: 'Drink a glass of water and stretch' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selecting a suggestion
  const handleSuggestionSelect = (suggestion: EnhancedSuggestion) => {
    const suggestionText = suggestion.text;
    setSelectedSuggestion(suggestionText === selectedSuggestion ? null : suggestionText);
    
    if (suggestionText && journalEntryId && emotionData && initialEmotionTimestamp) {
      // Find the current journal entry
      const record = data.journalEntries.find(entry => entry.id === journalEntryId);
      if (record) {
        const emotion = record.emotionRecords[record.emotionRecords.length - 1];
        if (emotion) {
          emotion.suggestionSelected = suggestionText;
          updateJournalEntry(journalEntryId, record.content);
          
          // Store for followup popup on next app open
          window.localStorage.setItem('redbutton_followup', JSON.stringify({
            entryId: journalEntryId,
            timestamp: emotion.timestamp,
            suggestion: suggestionText,
            emotion: emotionData,
            relatedItem: suggestion.relatedItem || null
          }));
          
          // If the suggestion is related to a goal or initiative, add a check-in
          if (suggestion.relatedItem) {
            const now = new Date();            
            // Create a check-in with the suggestion text and emotion context
            const checkInContent = `${suggestionText} (Selected when feeling ${emotionData.name})`;
            
            // Add the check-in to the related goal or initiative
            addCheckIn(
              checkInContent,
              suggestion.relatedItem.id,
              suggestion.relatedItem.type
            );
            
            console.log(`Added check-in for ${suggestion.relatedItem.type} "${suggestion.relatedItem.name}"`);
          }
        }
      }
    }
  };

  // Handle the "I want more" button click
  const handleMoreSuggestions = async () => {
    if (emotionData) {
      await loadSuggestions(emotionData);
    }
  };

  // Handle starting a timer for the selected suggestion
  const handleStartTimer = () => {
    if (selectedSuggestion && emotionData) {
      const duration = emotionData.time || 10;
      console.log(`Initiating timer for ${duration} minutes with activity: "${selectedSuggestion}"`);
      
      // Create timer status object
      const timerStatus: TimerStatus = {
        isRunning: true,
        remainingSeconds: duration * 60,
        totalMinutes: duration,
        activity: selectedSuggestion,
        emotionName: emotionData.name
      };
      
      // Tell the main process to start the timer
      if (window.electron) {
        window.electron.startTimer(timerStatus);
        console.log(`Sent timer request to main process: ${duration} minutes for "${selectedSuggestion}"`);
        
        // Listen for a one-time timer-started event as confirmation
        const handleTimerStarted = (event: Event) => {
          console.log('Timer started confirmation received');
          document.removeEventListener('timer-started', handleTimerStarted);
        };
        document.addEventListener('timer-started', handleTimerStarted);
      } else {
        console.error('Electron API not available, cannot start timer');
      }
      
      // Close the dialog
      handleCloseDialog();
    }
  };

  // Handle the "Open App" button click
  const handleOpenApp = () => {
    // Call the electron API to show the main window
    if (window.electron) {
      window.electron.showMainWindow('journal');
    }
    // Close the dialog
    handleCloseDialog();
  };

  // Close the dialog
  const handleCloseDialog = () => {
    setShowSuggestions(false);
    setSelectedSuggestion(null);
    setEmotionData(null);
    setJournalEntryId(null);
    setInitialEmotionTimestamp(null);
  };

  if (!showSuggestions) {
    return null;
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleCloseDialog}
    >
      <motion.div
        className="bg-gray-950 border border-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 text-gray-200"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside from closing
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{emotionData?.emoji}</span>
            Feeling {emotionData?.name}
          </h2>
          <button
            onClick={handleCloseDialog}
            className="text-gray-400 hover:text-gray-200 rounded-full h-8 w-8 flex items-center justify-center hover:bg-gray-800"
          >
            ✕
          </button>
        </div>
        
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
          <ActionSuggestions
            suggestions={suggestions}
            loading={isLoading}
            selectedSuggestion={selectedSuggestion}
            onSelect={handleSuggestionSelect}
            emotionName={emotionData?.name || ''}
            emotionEmoji={emotionData?.emoji || ''}
            isPositive={emotionData?.isPositive || false}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleMoreSuggestions}
            className="py-2.5 px-4 bg-gray-900 border border-gray-700 rounded-md hover:bg-gray-800 transition-colors text-gray-200"
          >
            I want more
          </button>
          
          {selectedSuggestion ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStartTimer}
                className="py-2.5 px-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center"
                disabled={!selectedSuggestion}
                title={`Timer for ${emotionData?.time || 10} minutes`}
              >
                <span className="text-sm sm:text-base whitespace-nowrap">⏱️ Run Timer!</span>
              </button>
              <button
                onClick={handleOpenApp}
                className="py-2.5 px-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                <span className="text-sm sm:text-base">Let's do!</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenApp}
              className="py-2.5 px-4 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              Thank you
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// To update entire journal entry including emotion records
const setData = (updater: (prev: any) => any) => {
  // Get localStorage data
  const savedData = localStorage.getItem('redButtonData');
  if (savedData) {
    try {
      const parsedData = JSON.parse(savedData);
      const newData = updater(parsedData);
      localStorage.setItem('redButtonData', JSON.stringify(newData));
      // Force a refresh of the application state
      window.dispatchEvent(new Event('storage'));
    } catch (e: unknown) {
      console.error('Failed to update data', e);
    }
  }
};

export default SuggestionDialog; 