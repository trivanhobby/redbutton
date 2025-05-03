// Type definitions for Electron APIs
import { TimerStatus } from '../components/SuggestionDialog';

interface TimerCompletionData {
  activity: string;
  minutes: number;
  emotionName: string;
}

declare global {
  interface Window {
    electron?: {
      saveData: (data: any) => Promise<any>;
      getData: () => Promise<any>;
      showMainWindow: (page?: string) => void;
      selectEmotion: (data: {id: string, isPositive: boolean, name: string, emoji: string, time: number, action?: string}) => void;
      onEmotionSelected: (callback: (data: {id: string, isPositive: boolean, name: string, emoji: string, time?: number, action?: string}) => void) => (() => void);
      resizeWindow: (width: number, height: number) => void;
      startTimer: (timerStatus: TimerStatus) => void;
      onTimerUpdate: (callback: (data: TimerStatus) => void) => (() => void);
      stopTimer: () => void;
      onTimerJournalEntry: (callback: (data: TimerCompletionData) => void) => (() => void);
            // New methods for tray icon status
      checkTrayIconStatus: () => Promise<{
        visible: boolean;
        error?: string;
      }>;
      onTrayIconStatusUpdate: (
        callback: (status: {
          visible: boolean;
          error?: string;
        }) => void
      ) => () => void;      
    };
  }
}

// This export is needed to make this a module
export {}; 