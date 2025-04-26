// Preload script
import { contextBridge, ipcRenderer } from 'electron';

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
    }
  }
); 