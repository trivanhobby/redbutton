import { EmotionRecord, JournalEntry, Emotion } from '../context/DataContext';
import { EnhancedSuggestion } from './ai';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper function to set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Helper function to remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
};

// Helper function to create headers with auth token
const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Authentication
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  
  // Store the token
  if (data.token) {
    setAuthToken(data.token);
  }
  
  return data;
};

export const register = async (email: string, password: string, inviteToken: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, inviteToken }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }
  
  const data = await response.json();
  
  // Store the token
  if (data.token) {
    setAuthToken(data.token);
  }
  
  return data;
};

export const verifyInvite = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/verify-invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify invitation');
    }
    
    // Return true if the verification was successful
    return data.success === true;
  } catch (error) {
    console.error('Error verifying invite:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Not authenticated');
  }
  
  return response.json();
};

export const logout = async () => {
  // Remove token from localStorage
  removeAuthToken();
  return { success: true };
};

// AI Functionality
export const generateSuggestions = async (
  emotionId: string, 
  emotionName: string,
  isPositive: boolean,
  availableMinutes: number = 10,
  action?: string
): Promise<EnhancedSuggestion[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/suggestions`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        emotionId,
        emotionName,
        isPositive,
        availableMinutes,
        action
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate suggestions');
    }
    
    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return [];
  }
};

export const generateJournalTemplate = async (
  emotions: { name: string, isPositive: boolean }[],
  previousEntries: string[] = []
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/journal-template`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        emotions,
        previousEntries
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate journal template');
    }
    
    const data = await response.json();
    return data.template;
  } catch (error) {
    console.error('Error generating journal template:', error);
    return '';
  }
};

export const polishJournalEntry = async (entryContent: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/polish-entry`, {
      method: 'POST',
      headers: createAuthHeaders(),
      body: JSON.stringify({
        entryContent
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to polish journal entry');
    }
    
    const data = await response.json();
    return data.polishedContent;
  } catch (error) {
    console.error('Error polishing journal entry:', error);
    return entryContent;
  }
};

// User Data
export const getUserData = async () => {
  const response = await fetch(`${API_BASE_URL}/userdata`, {
    method: 'GET',
    headers: createAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }
  
  return response.json();
};

export const updateSettings = async (settings: any) => {
  const response = await fetch(`${API_BASE_URL}/userdata/settings`, {
    method: 'PATCH',
    headers: createAuthHeaders(),
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update settings');
  }
  
  return response.json();
};

export const addJournalEntry = async (entry: any) => {
  const response = await fetch(`${API_BASE_URL}/userdata/journal`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify(entry),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add journal entry');
  }
  
  return response.json();
};

export const addGoal = async (text: string, description: string = '') => {
  const response = await fetch(`${API_BASE_URL}/userdata/goals`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify({ text, description }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add goal');
  }
  
  return response.json();
};

export const addInitiative = async (text: string, goalId: string) => {
  const response = await fetch(`${API_BASE_URL}/userdata/initiatives`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify({ text, goalId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add initiative');
  }
  
  return response.json();
};

export const addCheckIn = async (content: string, entityId: string, entityType: 'goal' | 'initiative') => {
  const response = await fetch(`${API_BASE_URL}/userdata/checkins`, {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify({ content, entityId, entityType }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add check-in');
  }
  
  return response.json();
}; 