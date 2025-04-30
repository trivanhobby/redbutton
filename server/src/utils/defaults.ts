import { v4 as uuidv4 } from 'uuid';
import { AppData, Emotion, Goal } from '../types/app.types';

/**
 * Default emotions provided to all users
 */
export const defaultEmotions: Emotion[] = [
  {
    id: uuidv4(),
    name: 'Happy',
    emoji: '😊',
    isPositive: true
  },
  {
    id: uuidv4(),
    name: 'Excited',
    emoji: '🎉',
    isPositive: true
  },
  {
    id: uuidv4(),
    name: 'Grateful',
    emoji: '🙏',
    isPositive: true
  },
  {
    id: uuidv4(),
    name: 'Proud',
    emoji: '🏆',
    isPositive: true
  },
  {
    id: uuidv4(),
    name: 'Calm',
    emoji: '😌',
    isPositive: true
  },
  {
    id: uuidv4(),
    name: 'Sad',
    emoji: '😔',
    isPositive: false
  },
  {
    id: uuidv4(),
    name: 'Anxious',
    emoji: '😰',
    isPositive: false
  },
  {
    id: uuidv4(),
    name: 'Frustrated',
    emoji: '😤',
    isPositive: false
  },
  {
    id: uuidv4(),
    name: 'Overwhelmed',
    emoji: '😩',
    isPositive: false
  },
  {
    id: uuidv4(),
    name: 'Angry',
    emoji: '😠',
    isPositive: false
  }
];

/**
 * Default fixed goals provided to new users
 */
export const defaultGoals: Goal[] = [
  {
    id: uuidv4(),
    text: 'Personal Well-being',
    description: 'Maintain and improve my physical and mental health',
    completed: false,
    isFixed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    text: 'Professional Growth',
    description: 'Develop skills and advance in my career',
    completed: false,
    isFixed: true,
    createdAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    text: 'Relationships',
    description: 'Nurture important relationships in my life',
    completed: false,
    isFixed: true,
    createdAt: new Date().toISOString()
  }
];

/**
 * Get default user data structure for a new user
 * @returns Default AppData structure
 */
export const getDefaultUserData = (): Omit<AppData, 'settings'> => {
  return {
    emotions: defaultEmotions,
    actions: [],
    journalEntries: [],
    goals: defaultGoals,
    initiatives: [],
    checkIns: []
  };
};

/**
 * Get default settings for a new user
 * @returns Default settings object
 */
export const getDefaultSettings = () => {
  return {
    customEmotions: false,
    theme: 'dark' as const,
    aiEnabled: true
  };
}; 