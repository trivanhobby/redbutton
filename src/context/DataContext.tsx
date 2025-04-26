import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format } from 'date-fns';

// Types for our data
export interface Emotion {
  id: string;
  name: string;
  emoji: string;
  isPositive: boolean;
}

export interface Action {
  id: string;
  text: string;
  completed: boolean;
  timestamp: string;
  emotionId: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  emotions: string[]; // IDs of emotions
  actions: string[]; // IDs of actions
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface JournalRequest {
  emotionId: string;
  timeInMinutes: number;
}

export interface AppData {
  emotions: Emotion[];
  actions: Action[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  settings: {
    customEmotions: boolean;
    theme: 'light' | 'dark';
    aiEnabled: boolean;
  };
}

// Initial emotions data
const initialEmotions: Emotion[] = [
  { id: 'e1', name: 'Anxious', emoji: '😰', isPositive: false },
  { id: 'e2', name: 'Worried', emoji: '😟', isPositive: false },
  { id: 'e3', name: 'Stressed', emoji: '😫', isPositive: false },
  { id: 'e4', name: 'Exhausted', emoji: '😩', isPositive: false },
  { id: 'e5', name: 'Overwhelmed', emoji: '🥵', isPositive: false },
  { id: 'e6', name: 'Sad', emoji: '😢', isPositive: false },
  { id: 'e7', name: 'Angry', emoji: '😠', isPositive: false },
  { id: 'e8', name: 'Frustrated', emoji: '😤', isPositive: false },
  
  { id: 'e9', name: 'Happy', emoji: '😊', isPositive: true },
  { id: 'e10', name: 'Motivated', emoji: '💪', isPositive: true },
  { id: 'e11', name: 'Grateful', emoji: '🙏', isPositive: true },
  { id: 'e12', name: 'Inspired', emoji: '✨', isPositive: true },
  { id: 'e13', name: 'Energetic', emoji: '⚡', isPositive: true },
  { id: 'e14', name: 'Calm', emoji: '😌', isPositive: true },
  { id: 'e15', name: 'Focused', emoji: '🎯', isPositive: true },
  { id: 'e16', name: 'Proud', emoji: '🥇', isPositive: true },
];

// Initial data
const initialData: AppData = {
  emotions: initialEmotions,
  actions: [],
  journalEntries: [],
  goals: [
    {
      id: 'g1',
      text: 'Practice mindfulness for 10 minutes each day',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g2',
      text: 'Complete one important task before checking email',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g3',
      text: 'Take a short walk after lunch',
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ],
  settings: {
    customEmotions: false,
    theme: 'light',
    aiEnabled: true,
  },
};

// Create context with default value
interface DataContextType {
  data: AppData;
  addEmotion: (emotion: Omit<Emotion, 'id'>) => void;
  removeEmotion: (id: string) => void;
  addAction: (action: Omit<Action, 'id' | 'timestamp'>) => void;
  completeAction: (id: string) => void;
  removeAction: (id: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  updateJournalEntry: (id: string, content: string) => void;
  addGoal: (text: string) => void;
  toggleGoal: (id: string) => void;
  removeGoal: (id: string) => void;
  updateSettings: (settings: Partial<AppData['settings']>) => void;
  requestJournal: (req: JournalRequest) => void;
  isJournaling: boolean;
  currentRequest: JournalRequest | null;
  cancelJournal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(() => {
    // Try to load data from localStorage
    const savedData = localStorage.getItem('redButtonData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error('Failed to parse saved data', e);
        return initialData;
      }
    }
    return initialData;
  });

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('redButtonData', JSON.stringify(data));
  }, [data]);

  // Functions to manipulate data
  const addEmotion = (emotion: Omit<Emotion, 'id'>) => {
    const newEmotion: Emotion = {
      ...emotion,
      id: `e${Date.now()}`,
    };
    console.log("NEW EMOTION", newEmotion);
    setData((prev) => ({
      ...prev,
      emotions: [...prev.emotions, newEmotion],
    }));
  };

  const removeEmotion = (id: string) => {
    setData((prev) => ({
      ...prev,
      emotions: prev.emotions.filter((e) => e.id !== id),
    }));
  };

  const addAction = (action: Omit<Action, 'id' | 'timestamp'>) => {
    const newAction: Action = {
      ...action,
      id: `a${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      actions: [...prev.actions, newAction],
    }));
  };

  const completeAction = (id: string) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.map((a) =>
        a.id === id ? { ...a, completed: true } : a
      ),
    }));
  };

  const removeAction = (id: string) => {
    setData((prev) => ({
      ...prev,
      actions: prev.actions.filter((a) => a.id !== id),
    }));
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `j${Date.now()}`,
    };
    setData((prev) => ({
      ...prev,
      journalEntries: [...prev.journalEntries, newEntry],
    }));
  };

  const updateJournalEntry = (id: string, content: string) => {
    setData((prev) => ({
      ...prev,
      journalEntries: prev.journalEntries.map((j) =>
        j.id === id ? { ...j, content } : j
      ),
    }));
  };

  const addGoal = (text: string) => {
    const newGoal: Goal = {
      id: `g${Date.now()}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  };

  const toggleGoal = (id: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id
          ? {
              ...g,
              completed: !g.completed,
              completedAt: g.completed
                ? undefined
                : new Date().toISOString(),
            }
          : g
      ),
    }));
  };

  const removeGoal = (id: string) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  };

  const updateSettings = (settings: Partial<AppData['settings']>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const [isJournaling, setIsJournaling] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<JournalRequest | null>(null);

  // Function to handle journal requests
  const requestJournal = (req: JournalRequest) => {
    setCurrentRequest(req);
    setIsJournaling(true);
    console.log(`Starting journal for ${req.timeInMinutes} minutes about emotion: ${req.emotionId}`);
    // In a real application, this would navigate to the journaling page or open a modal
  };

  // Function to cancel journaling
  const cancelJournal = () => {
    setIsJournaling(false);
    setCurrentRequest(null);
  };

  const contextValue: DataContextType = {
    data,
    addEmotion,
    removeEmotion,
    addAction,
    completeAction,
    removeAction,
    addJournalEntry,
    updateJournalEntry,
    addGoal,
    toggleGoal,
    removeGoal,
    updateSettings,
    requestJournal,
    isJournaling,
    currentRequest,
    cancelJournal
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 