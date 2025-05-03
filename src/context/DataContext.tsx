import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { syncDataToServer } from '../utils/syncData';

// Types for our data
export interface Emotion {
  id: string;
  name: string;
  emoji: string;
  isPositive: boolean;
}

// Record of emotions with timestamps
export interface EmotionRecord {
  emotionId: string;
  timestamp: string;
  action?: string;  // For positive emotions: 'celebrate', 'journal', 'plan'
  timeInMinutes?: number;
  suggestionSelected?: string; // Track which suggestion was selected
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
  emotionRecords: EmotionRecord[]; // Replace emotions array with emotionRecords
  actions: string[]; // IDs of actions
}

// New interface for check-ins (notes associated with goals or initiatives)
export interface CheckIn {
  id: string;
  content: string;
  timestamp: string;
  entityId: string; // ID of the goal or initiative this check-in is associated with
  entityType: 'goal' | 'initiative'; // Type of the entity
}

// New interface for initiatives (sub-tasks for goals)
export interface Initiative {
  id: string;
  text: string;
  completed: boolean;
  goalId: string; // ID of the parent goal
  createdAt: string;
  completedAt?: string;
}

export interface Goal {
  id: string;
  text: string;
  description: string; // Added description field
  completed: boolean;
  isFixed?: boolean; // Flag for reserved fixed goals
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
  initiatives: Initiative[]; // Added initiatives array
  checkIns: CheckIn[]; // Added check-ins array
  settings: {
    customEmotions: boolean;
    theme: 'light' | 'dark';
    aiEnabled: boolean;
    apiKey?: string; // Added to store the API key securely
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
      id: 'g_work',
      text: 'Work',
      description: 'Work-related tasks and projects',
      completed: false,
      isFixed: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g_life',
      text: 'Life',
      description: 'Personal life tasks and routines',
      completed: false,
      isFixed: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g1',
      text: 'Practice mindfulness for 10 minutes each day',
      description: '',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g2',
      text: 'Complete one important task before checking email',
      description: '',
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'g3',
      text: 'Take a short walk after lunch',
      description: 'Going for a walk helps with digestion and improves focus for the afternoon',
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ],
  initiatives: [
    {
      id: 'i1',
      text: 'Try different meditation apps to find the best one',
      completed: false,
      goalId: 'g1',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'i2',
      text: 'Set up "Focus Time" blocks on calendar',
      completed: true,
      goalId: 'g2',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'i3',
      text: 'Find nearby parks or walking routes',
      completed: false,
      goalId: 'g3',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  checkIns: [
    {
      id: 'ci1',
      content: 'Tried Headspace app today. The basic course seems promising.',
      timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'i1',
      entityType: 'initiative'
    },
    {
      id: 'ci2',
      content: 'Explored Calm app. The sleep stories are nice but meditation interface is not as intuitive as Headspace.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'i1',
      entityType: 'initiative'
    },
    {
      id: 'ci3',
      content: 'Added two 1-hour focus blocks to my calendar for tomorrow.',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'i2',
      entityType: 'initiative'
    },
    {
      id: 'ci4',
      content: 'Completed a full day using the focus time blocks. Got much more done than usual!',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'i2',
      entityType: 'initiative'
    },
    {
      id: 'ci5',
      content: 'Found a great walking route through the nearby park. Takes about 20 minutes to complete.',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'i3',
      entityType: 'initiative'
    },
    {
      id: 'ci6',
      content: 'Making progress on the mindfulness practice. Completed 5 days in a row.',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'g1',
      entityType: 'goal'
    },
    {
      id: 'ci7',
      content: 'Started using my walks to practice mindful attention to surroundings.',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      entityId: 'g3',
      entityType: 'goal'
    }
  ],
  settings: {
    customEmotions: false,
    theme: 'light',
    aiEnabled: true,
    apiKey: '', // Initialize with empty string
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
  addEmotionToJournal: (date: string, emotionRecord: EmotionRecord) => string; // Returns the entry ID
  removeEmotionFromJournal: (entryId: string, timestamp: string) => void; // Remove emotion record by timestamp
  
  // Goals
  addGoal: (text: string, description?: string) => void;
  updateGoal: (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'isFixed'>>) => void;
  toggleGoal: (id: string) => void;
  removeGoal: (id: string) => void;
  
  // Initiatives
  addInitiative: (text: string, goalId: string) => void;
  updateInitiative: (id: string, text: string) => void;
  toggleInitiative: (id: string) => void;
  removeInitiative: (id: string) => void;
  
  // Check-ins
  addCheckIn: (content: string, entityId: string, entityType: 'goal' | 'initiative') => void;
  updateCheckIn: (id: string, content: string) => void;
  removeCheckIn: (id: string) => void;
  
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
        const parsedData = JSON.parse(savedData);
        
        // Check if we need to migrate data structure
        const needsMigration = parsedData.journalEntries && 
                              parsedData.journalEntries.length > 0 && 
                              parsedData.journalEntries[0].emotions !== undefined &&
                              parsedData.journalEntries[0].emotionRecords === undefined;
        
        if (needsMigration) {
          console.log('Migrating data structure from emotions array to emotionRecords');
          // Migrate journal entries to use emotionRecords instead of emotions
          const migratedEntries = parsedData.journalEntries.map((entry: any) => {
            if (entry.emotions && !entry.emotionRecords) {
              // Convert emotions array to emotionRecords array
              const emotionRecords = entry.emotions.map((emotionId: string) => ({
                emotionId,
                timestamp: entry.date + 'T12:00:00.000Z', // Default to noon on the entry date
                timeInMinutes: 10 // Default to 10 minutes
              }));
              
              return {
                ...entry,
                emotionRecords,
                // Keep emotions array for backwards compatibility
              };
            }
            return entry;
          });
          
          parsedData.journalEntries = migratedEntries;
        }
        
        // Make sure all required arrays exist
        parsedData.initiatives = parsedData.initiatives || [];
        parsedData.checkIns = parsedData.checkIns || [];
        
        return parsedData;
      } catch (e) {
        console.error('Failed to parse saved data', e);
        return initialData;
      }
    }
    return initialData;
  });

  // Sync tracking to prevent infinite loops
  const isSyncing = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthenticated = useRef(!!localStorage.getItem('authToken'));

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('redButtonData', JSON.stringify(data));
    
    // Don't sync if we're already syncing or not authenticated
    if (isSyncing.current || !isAuthenticated.current) {
      return;
    }
    
    // Debounce sync to server (wait for all changes to settle)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      // Only sync if we're authenticated
      if (isAuthenticated.current) {
        isSyncing.current = true;
        
        syncDataToServer(data)
          .then(success => {
            if (success) {
              console.log('Data successfully synced to server');
            } else {
              console.warn('Failed to sync data to server');
            }
          })
          .catch(error => {
            console.error('Error syncing data to server:', error);
          })
          .finally(() => {
            isSyncing.current = false;
          });
      }
    }, 2000); // Wait 2 seconds after last change before syncing
    
    // Clean up the timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [data]);

  // Check authentication status on mount and set up listener
  useEffect(() => {
    const checkAuth = () => {
      isAuthenticated.current = !!localStorage.getItem('authToken');
    };
    
    // Initial check
    checkAuth();
    
    // Listen for storage events (auth token changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken') {
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Functions to manipulate data
  const addEmotion = (emotion: Omit<Emotion, 'id'>) => {
    const newEmotion: Emotion = {
      ...emotion,
      id: `e${Date.now()}`,
    };
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
      emotionRecords: entry.emotionRecords || []
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

  const addEmotionToJournal = (date: string, emotionRecord: EmotionRecord): string => {
    // Log for debugging
    console.log('Adding emotion to journal:', {
      date,
      emotionId: emotionRecord.emotionId, 
      action: emotionRecord.action,
      timeInMinutes: emotionRecord.timeInMinutes
    });
    
    // Find if an entry for this date already exists
    const existingEntry = data.journalEntries.find(entry => entry.date === date);
    
    if (existingEntry) {
      // Update existing entry
      setData((prev) => ({
        ...prev,
        journalEntries: prev.journalEntries.map((entry) =>
          entry.id === existingEntry.id
            ? {
                ...entry,
                emotionRecords: [...entry.emotionRecords, emotionRecord]
              }
            : entry
        ),
      }));
      return existingEntry.id;
    } else {
      // Create new entry
      const newEntry: JournalEntry = {
        id: `j${Date.now()}`,
        date,
        content: '',
        emotionRecords: [emotionRecord],
        actions: []
      };
      
      setData((prev) => ({
        ...prev,
        journalEntries: [...prev.journalEntries, newEntry]
      }));
      
      return newEntry.id;
    }
  };

  const removeEmotionFromJournal = (entryId: string, timestamp: string) => {
    setData((prev) => {
      const updatedJournalEntries = prev.journalEntries.map(entry => {
        if (entry.id === entryId) {
          // Filter out the emotion record with the matching timestamp
          return {
            ...entry,
            emotionRecords: entry.emotionRecords.filter(record => record.timestamp !== timestamp)
          };
        }
        return entry;
      });

      return {
        ...prev,
        journalEntries: updatedJournalEntries
      };
    });
  };

  const addGoal = (text: string, description: string = '') => {
    const newGoal: Goal = {
      id: `g${Date.now()}`,
      text,
      description,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
  };

  const updateGoal = (id: string, updates: Partial<Omit<Goal, 'id' | 'createdAt' | 'isFixed'>>) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) =>
        g.id === id
          ? { ...g, ...updates }
          : g
      ),
    }));
  };

  const toggleGoal = (id: string) => {
    setData((prev) => {
      const updatedGoals = prev.goals.map((g) => {
        if (g.id === id && !g.isFixed) {
          return {
            ...g,
            completed: !g.completed,
            completedAt: g.completed
              ? undefined
              : new Date().toISOString(),
          };
        }
        return g;
      });
      
      return {
        ...prev,
        goals: updatedGoals
      };
    });
  };

  const removeGoal = (id: string) => {
    setData((prev) => {
      // Don't allow removal of fixed goals
      if (prev.goals.find(g => g.id === id)?.isFixed) {
        return prev;
      }
      
      return {
        ...prev,
        goals: prev.goals.filter((g) => g.id !== id),
        // Also remove associated initiatives
        initiatives: prev.initiatives.filter((i) => i.goalId !== id),
        // Also remove associated check-ins
        checkIns: prev.checkIns.filter((c) => !(c.entityId === id && c.entityType === 'goal')),
      };
    });
  };
  
  // Initiative functions
  const addInitiative = (text: string, goalId: string) => {
    const newInitiative: Initiative = {
      id: `i${Date.now()}`,
      text,
      completed: false,
      goalId,
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({
      ...prev,
      initiatives: [...prev.initiatives, newInitiative],
    }));
  };
  
  const updateInitiative = (id: string, text: string) => {
    setData((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((i) =>
        i.id === id
          ? { ...i, text }
          : i
      ),
    }));
  };
  
  const toggleInitiative = (id: string) => {
    setData((prev) => ({
      ...prev,
      initiatives: prev.initiatives.map((i) =>
        i.id === id
          ? {
              ...i,
              completed: !i.completed,
              completedAt: i.completed
                ? undefined
                : new Date().toISOString(),
            }
          : i
      ),
    }));
  };
  
  const removeInitiative = (id: string) => {
    setData((prev) => ({
      ...prev,
      initiatives: prev.initiatives.filter((i) => i.id !== id),
      // Also remove associated check-ins
      checkIns: prev.checkIns.filter((c) => !(c.entityId === id && c.entityType === 'initiative')),
    }));
  };
  
  // Check-in functions
  const addCheckIn = (content: string, entityId: string, entityType: 'goal' | 'initiative') => {
    const newCheckIn: CheckIn = {
      id: `c${Date.now()}`,
      content,
      timestamp: new Date().toISOString(),
      entityId,
      entityType,
    };
    setData((prev) => ({
      ...prev,
      checkIns: Array.isArray(prev.checkIns) ? [...prev.checkIns, newCheckIn] : [newCheckIn],
    }));
  };
  
  const updateCheckIn = (id: string, content: string) => {
    setData((prev) => ({
      ...prev,
      checkIns: prev.checkIns.map((c) =>
        c.id === id
          ? { ...c, content }
          : c
      ),
    }));
  };
  
  const removeCheckIn = (id: string) => {
    setData((prev) => ({
      ...prev,
      checkIns: prev.checkIns.filter((c) => c.id !== id),
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
    addEmotionToJournal,
    removeEmotionFromJournal,
    addGoal,
    updateGoal,
    toggleGoal,
    removeGoal,
    addInitiative,
    updateInitiative,
    toggleInitiative,
    removeInitiative,
    addCheckIn,
    updateCheckIn,
    removeCheckIn,
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