import { AppData } from '../context/DataContext';
import * as api from './api';

// Function to sync data from local storage to the server
export const syncDataToServer = async (localData: AppData): Promise<boolean> => {
  try {
    // Get data from the server
    const serverData = await api.getUserData();
    
    // Check if local data is newer than server data
    // This is a simplified approach; in a production app, you'd use versioning or timestamps
    if (!serverData) {
      // If no server data, upload all local data
      await uploadAllData(localData);
      return true;
    }
    
    // Otherwise, merge data
    const mergedData = mergeData(localData, serverData);
    
    // Upload changes
    await uploadAllData(mergedData);
    
    return true;
  } catch (error) {
    console.error('Error syncing data to server:', error);
    return false;
  }
};

// Function to sync data from the server to local storage
export const syncDataFromServer = async (): Promise<AppData | null> => {
  try {
    // Get data from the server
    const serverData = await api.getUserData();
    
    if (!serverData) {
      return null;
    }
    
    return serverData.data;
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
  // This function would make API calls to update all data on the server
  // In a real implementation, you'd use individual API endpoints for each data type
  // For now, we'll assume we have an endpoint to update all data at once
  
  // Example API calls might look like:
  // await api.updateSettings(data.settings);
  // await Promise.all(data.goals.map(goal => api.updateGoal(goal.id, goal)));
  // await Promise.all(data.journalEntries.map(entry => api.updateJournalEntry(entry.id, entry)));
  // etc.
  
  // For this implementation, we'll just log that we would upload the data
  console.log('Would upload data to server:', data);
}; 