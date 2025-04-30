// Preload script
import { contextBridge, ipcRenderer } from 'electron';

// Timer status interface
interface TimerStatus {
  isRunning: boolean;
  remainingSeconds: number;
  totalMinutes: number;
  activity: string;
  emotionName: string;
}

// Timer completion data interface
interface TimerCompletionData {
  activity: string;
  minutes: number;
  emotionName: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    saveData: (data: any) => ipcRenderer.invoke('save-data', data),
    getData: () => ipcRenderer.invoke('get-data'),
    showMainWindow: () => ipcRenderer.send('show-main-window'),
    selectEmotion: (data: {
      id: string, 
      isPositive: boolean, 
      name: string, 
      emoji: string, 
      time: number,
      action?: string
    }) => {
      ipcRenderer.send('select-emotion', data);
    },
    onEmotionSelected: (callback: (data: {
      id: string, 
      isPositive: boolean, 
      name: string, 
      emoji: string, 
      time?: number,
      action?: string
    }) => void) => {
      ipcRenderer.on('emotion-selected', (_, data) => callback(data));
      return () => {
        ipcRenderer.removeAllListeners('emotion-selected');
      };
    },
    resizeWindow: (width: number, height: number) => {
      ipcRenderer.send('resize-window', { width, height });
    },
    // Timer functions
    startTimer: (timerStatus: TimerStatus) => {
      ipcRenderer.send('start-timer', timerStatus);
      
      // Create and dispatch a custom event when timer is started
      ipcRenderer.once('timer-started', (_, data) => {
        console.log('Timer started confirmed by main process:', data);
        const event = new CustomEvent('timer-started', { detail: data });
        document.dispatchEvent(event);
      });
    },
    onTimerUpdate: (callback: (data: TimerStatus) => void) => {
      ipcRenderer.on('timer-update', (_, data) => callback(data));
      return () => {
        ipcRenderer.removeAllListeners('timer-update');
      };
    },
    stopTimer: () => {
      ipcRenderer.send('stop-timer');
    },
    // Timer journal entry function
    onTimerJournalEntry: (callback: (data: TimerCompletionData) => void) => {
      ipcRenderer.on('timer-journal-entry', (_, data) => callback(data));
      return () => {
        ipcRenderer.removeAllListeners('timer-journal-entry');
      };
    }
  }
); 