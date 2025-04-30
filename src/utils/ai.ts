import { Emotion, Action, Goal, JournalEntry, AppData } from '../context/DataContext';
import * as api from './api';

// Define a new interface for suggestions with related goals/initiatives
export interface EnhancedSuggestion {
  text: string;
  relatedItem?: {
    id: string;
    type: 'goal' | 'initiative';
    name: string;
  };
}

const defaultSuggestions: EnhancedSuggestion[] = [
  { text: 'Take a deep breath and count to 10' },
  { text: 'Write down what you are feeling right now' },
  { text: 'Drink a glass of water and stretch' },
];

// Gets the OpenAI API key from storage
export const getApiKeyFromStorage = (): string | null => {
  try {
    const savedData = localStorage.getItem('redButtonData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      const apiKey = parsedData?.settings?.apiKey;
      
      if (apiKey && apiKey.trim() !== '') {
        return apiKey;
      }
    }
    return null;
  } catch (error) {
    console.error('Error retrieving API key from storage:', error);
    return null;
  }
};

// Initialize the OpenAI client with the stored API key
export const initializeOpenAIFromStorage = (): boolean => {
  try {
    // Get API key from storage
    const apiKey = getApiKeyFromStorage();
    
    // If no key in localStorage, check environment variables
    const envApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey && envApiKey && envApiKey.trim() !== '') {
      console.log('Using OpenAI API key from environment variables');
      
      // Save to app data for future use
      try {
        const savedData = localStorage.getItem('redButtonData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          parsedData.settings.apiKey = envApiKey;
          localStorage.setItem('redButtonData', JSON.stringify(parsedData));
          console.log('Saved environment API key to local storage');
          return true;
        }
      } catch (e) {
        console.error('Failed to save environment API key to local storage', e);
      }
    }
    
    return !!apiKey || !!envApiKey;
  } catch (error) {
    console.error('Error initializing OpenAI from storage:', error);
    return false;
  }
};

// This function is used to check if the API key is valid
export const initializeOpenAI = (apiKey: string): boolean => {
  if (!apiKey || apiKey.trim() === '') {
    return false;
  }
  
  try {
    // Store the API key in localStorage
    const savedData = localStorage.getItem('redButtonData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      parsedData.settings.apiKey = apiKey;
      localStorage.setItem('redButtonData', JSON.stringify(parsedData));
      console.log('Saved API key to local storage');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenAI client:', error);
    return false;
  }
};

/**
 * Returns the OpenAI instance or null
 * Note: We now handle all OpenAI operations through the backend API
 * This function is maintained for backward compatibility but always returns null
 */
export const getOpenAI = (): null => {
  console.warn('Direct OpenAI access is deprecated. All OpenAI operations are now handled by the backend API.');
  return null;
};

// Get suggestions for a specific emotion
export const getSuggestionsForEmotion = async (
  emotionId: string,
  availableMinutes: number = 10,
  data: AppData
): Promise<EnhancedSuggestion[]> => {
  try {
    // Find the emotion in the data
    const emotion = data.emotions.find(e => e.id === emotionId);
    
    if (!emotion) {
      console.error('Emotion not found with ID:', emotionId);
      return defaultSuggestions;
    }
    
    // Call the backend API to generate suggestions
    return await api.generateSuggestions(
      emotionId,
      emotion.name,
      emotion.isPositive,
      availableMinutes
    );
  } catch (error) {
    console.error('Error getting suggestions for emotion:', error);
    return defaultSuggestions;
  }
};

// Generate a journal template
export const generateJournalTemplate = async (
  emotionRecords: any[],
  data: AppData,
  previousEntries: string[] = []
): Promise<string> => {
  try {
    // Get emotion details from records
    const emotionDetails = emotionRecords.map(record => {
      const emotion = data.emotions.find(e => e.id === record.emotionId);
      return emotion 
        ? { name: emotion.name, isPositive: emotion.isPositive }
        : { name: 'Unknown', isPositive: false };
    });
    
    // Call the backend API to generate the template
    return await api.generateJournalTemplate(emotionDetails, previousEntries);
  } catch (error) {
    console.error('Failed to generate journal template:', error);
    return getDefaultJournalTemplate();
  }
};

// Polish a journal entry
export const polishJournalEntry = async (
  entryContent: string
): Promise<string> => {
  if (!entryContent.trim()) {
    return entryContent;
  }

  try {
    // Call the backend API to polish the entry
    return await api.polishJournalEntry(entryContent);
  } catch (error) {
    console.error('Failed to polish journal entry:', error);
    return entryContent;
  }
};

// Helper function to get a default journal template when API fails
const getDefaultJournalTemplate = (): string => {
  return `
# Today's Reflections

## Current Emotions
_How are you feeling right now? What emotions have you experienced today?_

## Reflection Questions
- What was the most significant part of your day?
- What challenged you today, and how did you respond?
- What are you grateful for right now?
- What did you learn about yourself today?

## Looking Forward
_What are your intentions for tomorrow? What do you want to remember or focus on?_
`;
}; 