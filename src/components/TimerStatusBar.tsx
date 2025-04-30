import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { TimerStatus } from './SuggestionDialog';
import { format } from 'date-fns';

interface TimerCompletionData {
  activity: string;
  minutes: number;
  emotionName: string;
  playSound?: boolean;
}

const TimerStatusBar: React.FC = () => {
  const [timerStatus, setTimerStatus] = useState<TimerStatus | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loggedRef = useRef<boolean>(false);
  const navigate = useNavigate();
  const { data, updateJournalEntry, addJournalEntry } = useData();

  useEffect(() => {
    // Only log once per component mount
    if (!loggedRef.current) {
      console.log('TimerStatusBar: Setting up timer listeners');
      loggedRef.current = true;
    }
    
    // Create audio element for timer completion sound
    audioRef.current = new Audio('/timer-complete.mp3');
    
    // Listen for timer updates
    const cleanupTimer = window.electron?.onTimerUpdate((status: TimerStatus) => {
      // Only log meaningful changes in timer status
      if (!timerStatus || timerStatus.isRunning !== status.isRunning || 
          Math.floor(timerStatus.remainingSeconds / 10) !== Math.floor(status.remainingSeconds / 10)) {
        console.log('Timer update received:', status);
      }
      setTimerStatus(status);
    });
    
    // Handle timer completion - play sound
    const handleTimerCompleted = (timerData: TimerCompletionData) => {
      console.log('Timer completed:', timerData);
      
      // Play sound
      if (audioRef.current) {
        try {
          // Create a new Audio element each time to avoid issues with replaying
          audioRef.current = new Audio('/timer-complete.mp3');
          
          // Log sound play attempt
          console.log('Attempting to play timer completion sound');
          
          // Try to play the sound with aggressive error handling
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('Sound played successfully');
              })
              .catch(err => {
                console.error('Sound play error:', err);
                // Try a fallback approach
                setTimeout(() => {
                  console.log('Trying fallback sound play approach');
                  new Audio('/timer-complete.mp3').play()
                    .catch(e => console.error('Fallback sound play failed:', e));
                }, 500);
              });
          }
        } catch (err) {
          console.error('Failed to play timer sound:', err);
        }
      } else {
        console.error('No audio element available');
      }
    };
    
    // Handle journal entry update when timer completes
    const handleTimerJournalEntry = (timerData: TimerCompletionData) => {
      console.log('Adding timer completion to journal:', timerData);
      
      // Navigate to journal page
      navigate('/journal');
      
      // Get today's date in the format used for journal entries
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Add timer completion note to journal
      const timerCompletionText = `\n\nBecause I felt ${timerData.emotionName}, I did "${timerData.activity}" for ${timerData.minutes} minutes. How did it feel? `;
      
      // Find today's journal entry if it exists
      const todayEntry = data.journalEntries.find(entry => entry.date === today);
      
      if (todayEntry) {
        // Append the timer completion text to the existing journal entry
        const updatedContent = todayEntry.content + timerCompletionText;
        updateJournalEntry(todayEntry.id, updatedContent);
      } else {
        // Create a new journal entry if one doesn't exist
        addJournalEntry({
          date: today,
          content: timerCompletionText,
          emotionRecords: [],
          actions: []
        });
      }
    };
    
    // Set up IPC event listeners
    let timerJournalEntryCleanup: (() => void) | undefined;
    
    if (window.electron) {
      // Set up listener for timer-completed events
      const timerCompletedHandler = (event: Event) => {
        const customEvent = event as CustomEvent<TimerCompletionData>;
        if (customEvent.detail) {
          // Log that we received the timer completed event
          console.log('TimerStatusBar: Received timer-completed event with data:', customEvent.detail);
          handleTimerCompleted(customEvent.detail);
        }
      };
      
      // Set up listener for timer-journal-entry events from the main process
      timerJournalEntryCleanup = window.electron.onTimerJournalEntry?.(handleTimerJournalEntry);
      
      // Set up listener for timer-completed events from the main process
      document.addEventListener('timer-completed', timerCompletedHandler);
      
      return () => {
        // Clean up listeners
        if (cleanupTimer) cleanupTimer();
        if (timerJournalEntryCleanup) timerJournalEntryCleanup();
        document.removeEventListener('timer-completed', timerCompletedHandler);
      };
    } else {
      console.error('Electron API not available in window object');
    }
    
    return () => {
      // Clean up listeners
      if (cleanupTimer) cleanupTimer();
    };
  }, [navigate, updateJournalEntry, addJournalEntry, data.journalEntries]);
  
  // Don't render anything if no timer is running
  if (!timerStatus || !timerStatus.isRunning) {
    return null;
  }
  
  // Format remaining time
  const minutes = Math.floor(timerStatus.remainingSeconds / 60);
  const seconds = timerStatus.remainingSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  // We're hiding this component since we want the timer to show only in the MacOS menu bar
  // Uncomment the return statement below if you want the timer in the app too
  /*
  return (
    <div className="fixed top-0 left-0 right-0 bg-gray-800 text-white p-2 text-center z-50 flex justify-center items-center shadow-md">
      <div className="flex items-center space-x-3">
        <span className="animate-pulse text-xl">⏱️</span>
        <span className="font-medium text-lg">{timeString}</span>
        <span className="mx-2 text-gray-400">|</span>
        <span className="text-gray-200 text-sm md:text-base truncate max-w-xs">{timerStatus.activity}</span>
        <button 
          onClick={() => {
            console.log('Stopping timer');
            window.electron?.stopTimer();
          }}
          className="ml-4 bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
  */
  
  // For now, we're just returning null since we want the timer to only show in the menu bar
  return null;
};

export default TimerStatusBar; 