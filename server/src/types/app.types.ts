import { Document } from 'mongoose';

// Emotion entity
export interface Emotion {
  id: string;
  name: string;
  emoji: string;
  isPositive: boolean;
}

// Emotion record for tracking emotions over time
export interface EmotionRecord {
  emotionId: string;
  timestamp: string;
  action?: string; // For positive emotions: 'celebrate', 'journal', 'plan'
  timeInMinutes?: number;
  suggestionSelected?: string; // Track which suggestion was selected
}

// Action entity
export interface Action {
  id: string;
  text: string;
  completed: boolean;
  timestamp: string;
  emotionId: string;
}

// Journal entry
export interface JournalEntry {
  id: string;
  date: string;
  content: string;
  emotionRecords: EmotionRecord[]; // Track emotion records
  actions: string[]; // IDs of actions
}

// Check-in for goals or initiatives
export interface CheckIn {
  id: string;
  content: string;
  timestamp: string;
  entityId: string; // ID of the goal or initiative this check-in is associated with
  entityType: 'goal' | 'initiative'; // Type of the entity
}

// Initiative (sub-task of a goal)
export interface Initiative {
  id: string;
  text: string;
  completed: boolean;
  goalId: string; // ID of the parent goal
  createdAt: string;
  completedAt?: string;
}

// Goal
export interface Goal {
  id: string;
  text: string;
  description: string; // Added description field
  completed: boolean;
  isFixed?: boolean; // Flag for reserved fixed goals
  createdAt: string;
  completedAt?: string;
}

// Journal request
export interface JournalRequest {
  emotionId: string;
  timeInMinutes: number;
}

// Full application data structure
export interface AppData {
  emotions: Emotion[];
  actions: Action[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  initiatives: Initiative[];
  checkIns: CheckIn[];
  settings: {
    customEmotions: boolean;
    theme: 'light' | 'dark';
    aiEnabled: boolean;
    apiKey?: string;
  };
} 