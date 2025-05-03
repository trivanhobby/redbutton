import { AppData } from '../context/DataContext';
import * as api from './api';

// Get the last sync timestamp from localStorage
const getLastSyncTimestamp = (): string | null => {
  return localStorage.getItem('lastSyncTimestamp');
};

// Set the last sync timestamp in localStorage
const setLastSyncTimestamp = (timestamp: string): void => {
  localStorage.setItem('lastSyncTimestamp', timestamp);
};

// Function to sync data from local storage to the server
export const syncDataToServer = async (localData: AppData): Promise<boolean> => {
  try {
    console.log('Starting data sync to server...');
    
    // Get the last sync timestamp
    const lastSyncTimestamp = getLastSyncTimestamp() || new Date(0).toISOString();
    
    try {
      // Try to use the advanced sync endpoint with conflict resolution
      const response = await api.syncUserData(localData, lastSyncTimestamp);
      
      if (response.success) {
        console.log('Data synced successfully using conflict resolution');
        // Update the last sync timestamp
        setLastSyncTimestamp(response.syncTimestamp);
        return true;
      }
    } catch (syncError) {
      console.warn('Advanced sync failed, falling back to full data update', syncError);
      // Fall back to the full data update if advanced sync fails
    }
    
    // Fall back to the full data update
    await uploadAllData(localData);
    
    // Set the last sync timestamp to now
    setLastSyncTimestamp(new Date().toISOString());
    
    console.log('Data synced successfully using full data update');
    return true;
  } catch (error) {
    console.error('Error syncing data to server:', error);
    return false;
  }
};

// Function to sync data from the server to local storage
export const syncDataFromServer = async (): Promise<AppData | null> => {
  try {
    console.log('Starting data sync from server...');
    
    // Get data from the server
    const response = await api.getUserData();
    
    if (!response || !response.success) {
      console.error('Failed to get user data from server');
      return null;
    }
    
    // Update the last sync timestamp
    setLastSyncTimestamp(new Date().toISOString());
    
    console.log('Data retrieved successfully from server');
    return response.data;
  } catch (error) {
    console.error('Error syncing data from server:', error);
    return null;
  }
};

// Helper function to merge local and server data
const mergeData = (localData: AppData, serverData: any): AppData => {
  // This is a simplified merge function
  // In a real app, you'd need a more sophisticated merge strategy
  // that handles conflicts and maintains data integrity
  
  // For now, we'll prioritize local data for simplicity
  return {
    ...serverData.data,
    ...localData,
    // Ensure arrays are properly merged
    emotions: [...localData.emotions],
    actions: [...localData.actions],
    journalEntries: [...localData.journalEntries],
    goals: [...localData.goals],
    initiatives: [...localData.initiatives],
    checkIns: [...localData.checkIns],
    // Merge settings, but keep API key from local data
    settings: {
      ...serverData.data.settings,
      ...localData.settings,
      apiKey: localData.settings.apiKey || serverData.data.settings.apiKey
    }
  };
};

// Helper function to upload all data to the server
const uploadAllData = async (data: AppData): Promise<void> => {
  console.log('Uploading all data to server...');
  
  try {
    // Actually call the API to update all user data
    const response = await api.updateAllUserData(data);
    
    if (!response || !response.success) {
      throw new Error('Server returned unsuccessful response');
    }
    
    console.log('All data uploaded successfully to server');
  } catch (error) {
    console.error('Failed to upload data to server:', error);
    throw error; // Re-throw to handle in the calling function
  }
}; 