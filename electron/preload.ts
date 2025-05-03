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

// Type definitions for the tray icon status
interface TrayIconStatus {
  visible: boolean;
  error?: string;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    saveData: (data: any) => ipcRenderer.invoke('save-data', data),
    getData: () => ipcRenderer.invoke('get-data'),
    showMainWindow: (page?: string) => ipcRenderer.send('show-main-window', page ),
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
      const subscription = (_: any, data: TimerStatus) => callback(data);
      ipcRenderer.on('timer-update', subscription);
      
      return () => {
        ipcRenderer.removeListener('timer-update', subscription);
      };
    },
    stopTimer: () => {
      ipcRenderer.send('stop-timer');
    },
    // Timer journal entry function
    onTimerJournalEntry: (callback: (data: TimerCompletionData) => void) => {
      const subscription = (_: any, data: TimerCompletionData) => callback(data);
      ipcRenderer.on('timer-journal-entry', subscription);
      
      return () => {
        ipcRenderer.removeListener('timer-journal-entry', subscription);
      };
    },
    // Check if tray icon is working
    checkTrayIconStatus: (): Promise<TrayIconStatus> => ipcRenderer.invoke('check-tray-icon'),
    // Listen for tray icon status updates
    onTrayIconStatusUpdate: (callback: (status: TrayIconStatus) => void) => {
      const subscription = (_: any, status: TrayIconStatus) => callback(status);
      ipcRenderer.on('tray-icon-status-update', subscription);
      
      // Return an unsubscribe function
      return () => {
        ipcRenderer.removeListener('tray-icon-status-update', subscription);
      };
    }
  }
); 