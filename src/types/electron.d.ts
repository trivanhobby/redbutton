// Type definitions for Electron APIs
declare global {
  interface Window {
    electron?: {
      saveData: (data: any) => Promise<any>;
      getData: () => Promise<any>;
      showMainWindow: () => void;
      selectEmotion: (data: {id: string, isPositive: boolean, name: string, emoji: string, time: number, action?: string}) => void;
      onEmotionSelected: (callback: (data: {id: string, isPositive: boolean, name: string, emoji: string, time?: number, action?: string}) => void) => (() => void);
      resizeWindow: (width: number, height: number) => void;
    };
  }
}

// This export is needed to make this a module
export {}; 