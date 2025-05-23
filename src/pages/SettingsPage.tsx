import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { motion } from 'framer-motion';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { syncDataToServer, syncDataFromServer } from '../utils/syncData';
import { useOnboarding } from '../context/OnboardingContext';
import { useSubscription } from '../hooks/useSubscription';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL!;

const SettingsPage: React.FC = () => {
  const { data, updateSettings, addEmotion, removeEmotion } = useData();
  const { startOnboarding } = useOnboarding();
  const { products, status, isLoading, error, createCheckoutSession, refresh } = useSubscription();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newEmotion, setNewEmotion] = useState({ name: '', isPositive: true, emoji: '' });
  const [isKeyFromEnv, setIsKeyFromEnv] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState('');
  const [showSyncToast, setShowSyncToast] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>('idle');
  const [restoreMessage, setRestoreMessage] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Set the initial input value based on whether a key exists
  useEffect(() => {
    // Check if the API key came from environment variables
    const envApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const hasStoredKey = data.settings.apiKey && data.settings.apiKey.trim() !== '';
    
    if (hasStoredKey) {
      setApiKey(''); // Don't show the actual key for security, but keep track if it exists
      setApiKeyStatus('success');
      
      // If the key is exactly the same as the environment variable, it likely came from there
      if (envApiKey && envApiKey === data.settings.apiKey) {
        setIsKeyFromEnv(true);
      }
    }
    
    // Get the last sync time
    const timestamp = localStorage.getItem('lastSyncTimestamp');
    setLastSyncTime(timestamp);
  }, [data.settings.apiKey]);
  
  // Handle theme toggle
  const handleThemeToggle = () => {
    updateSettings({
      theme: data.settings.theme === 'light' ? 'dark' : 'light',
    });
    
    // In a real app, you would also apply the theme to the document
    // document.documentElement.classList.toggle('dark');
  };
  
  // Handle AI toggle
  const handleAIToggle = () => {
    updateSettings({
      aiEnabled: !data.settings.aiEnabled,
    });
  };
  
  // Handle custom emotions toggle
  const handleCustomEmotionsToggle = () => {
    updateSettings({
      customEmotions: !data.settings.customEmotions,
    });
  };
  
  // Handle adding a new emotion
  const handleAddEmotion = () => {
    if (newEmotion.name.trim() && newEmotion.emoji.trim()) {
      addEmotion({
        name: newEmotion.name.trim(),
        isPositive: newEmotion.isPositive,
        emoji: newEmotion.emoji.trim(),
      });
      setNewEmotion({ name: '', isPositive: true, emoji: '' });
    }
  };
  
  // Filter emotions by type
  const positiveEmotions = data.emotions.filter(emotion => emotion.isPositive);
  const negativeEmotions = data.emotions.filter(emotion => !emotion.isPositive);

  // Add this function inside your SettingsPage component
  const handleResetData = () => {
    if (window.confirm('This will delete all your data and cannot be undone. Are you sure?')) {
      // Clear localStorage
      localStorage.removeItem('redButtonData');
      
      // Reload the application
      window.location.reload();
    }
  };

  // Add this function inside your SettingsPage component, after handleResetData
  const handleShowDebugData = () => {
    try {
      const data = localStorage.getItem('redButtonData');
      if (data) {
        console.log('RedButton Data:', JSON.parse(data));
        alert('Data has been logged to the console. Open developer tools to view.');
      } else {
        alert('No RedButton data found in localStorage.');
      }
    } catch (error) {
      console.error('Error parsing data:', error);
      alert('Error reading data. See console for details.');
    }
  };

  // Handle manual sync
  const handleManualSync = async () => {
    setSyncStatus('syncing');
    
    try {
      // First sync from server to get the latest data
      const serverData = await syncDataFromServer();
      
      if (serverData) {
        // Then sync local data to server
        const success = await syncDataToServer(data);
        
        if (success) {
          setSyncStatus('success');
          setSyncMessage('Data synchronized successfully!');
          // Update the last sync time display
          const timestamp = localStorage.getItem('lastSyncTimestamp');
          setLastSyncTime(timestamp);
        } else {
          setSyncStatus('error');
          setSyncMessage('Error synchronizing with server. Please try again.');
        }
      } else {
        // If we couldn't get server data, try to push local data
        const success = await syncDataToServer(data);
        
        if (success) {
          setSyncStatus('success');
          setSyncMessage('Local data synchronized to server.');
          // Update the last sync time display
          const timestamp = localStorage.getItem('lastSyncTimestamp');
          setLastSyncTime(timestamp);
        } else {
          setSyncStatus('error');
          setSyncMessage('Error connecting to server. Please try again later.');
        }
      }
      
      // Show the toast notification
      setShowSyncToast(true);
      // Hide it after 3 seconds
      setTimeout(() => {
        setShowSyncToast(false);
      }, 3000);
    } catch (error) {
      console.error('Error during manual sync:', error);
      setSyncStatus('error');
      setSyncMessage('Unexpected error during sync. Please try again.');
      setShowSyncToast(true);
      setTimeout(() => {
        setShowSyncToast(false);
      }, 3000);
    }
    
    // Reset status after a few seconds
    setTimeout(() => {
      setSyncStatus('idle');
    }, 3000);
  };

  // Format the last sync time for display
  const getFormattedSyncTime = () => {
    if (!lastSyncTime) return 'Never';
    
    try {
      const date = new Date(lastSyncTime);
      return date.toLocaleString();
    } catch (error) {
      console.error('Error formatting sync time:', error);
      return 'Invalid date';
    }
  };

  const handleSubscribe = async (productId: string) => {
    const url = await createCheckoutSession(productId);
    if (url) {
      window.location.href = url;
    }
  };

  // Format subscription end date
  const formatSubscriptionEnd = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleRestore = async () => {
    setRestoreStatus('restoring');
    setRestoreMessage('');
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(API_BASE_URL + '/subscription/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setRestoreStatus('success');
        setRestoreMessage('Subscription restored!');
        refresh();
      } else {
        setRestoreStatus('error');
        setRestoreMessage(data.message || 'No active subscription found.');
        refresh();
      }
    } catch (e) {
      setRestoreStatus('error');
      setRestoreMessage('Failed to restore subscription.');
    }
    setTimeout(() => setRestoreStatus('idle'), 3000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto text-gray-200 relative">
      {/* Toast Notification */}
      {showSyncToast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-4 right-4 px-4 py-2 rounded-md shadow-lg z-50 ${
            syncStatus === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <p className="text-white font-medium">{syncMessage}</p>
        </motion.div>
      )}

      <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>
      
      {/* Subscription Section */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Subscription</h2>
        {/* Restore purchases button and toast */}
        {restoreStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-4 px-4 py-2 rounded-md shadow text-white ${restoreStatus === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {restoreMessage}
          </motion.div>
        )}
        
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : status?.isSubscribed ? (
          <div className="space-y-4">
            <div className="bg-green-900/30 border border-green-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Icon icon="mdi:check-circle" className="text-xl" />
                <span className="font-semibold">Active Subscription</span>
              </div>
              <div className="text-sm text-gray-300">
                <p>Plan: {status.subscriptionType === 'monthly' ? 'Monthly' : 'Yearly'}</p>
                <p>Valid until: {formatSubscriptionEnd(status.subscriptionEnd)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-300">
              Subscribe to unlock all features and get personalized AI assistance.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Monthly Plan */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{products.monthly.name}</h3>
                <p className="text-gray-300 mb-4">{products.monthly.description}</p>
                <div className="text-sm text-gray-400 mb-4">
                  {products.monthly.trialDays}-day free trial
                </div>
                <button
                  onClick={() => handleSubscribe(products.monthly.id)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Subscribe Monthly
                </button>
              </div>

              {/* Yearly Plan */}
              <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-2">{products.yearly.name}</h3>
                <p className="text-gray-300 mb-4">{products.yearly.description}</p>
                <div className="text-sm text-gray-400 mb-4">
                  {products.yearly.trialDays}-day free trial
                </div>
                <button
                  onClick={() => handleSubscribe(products.yearly.id)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Subscribe Yearly
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Restore button always visible */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleRestore}
            disabled={restoreStatus === 'restoring'}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
          >
            {restoreStatus === 'restoring' ? 'Restoring...' : 'Restore My Purchases'}
          </button>
        </div>
      </div>

      {/* Emotion Settings */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Emotion Settings</h2>
          {/* Custom Emotions Toggle */}
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">Custom Emotions</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.customEmotions}
                onChange={handleCustomEmotionsToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
        {/* Add New Emotion (only shown if custom emotions are enabled) */}
        {data.settings.customEmotions && (
          <div className="mb-6 p-4 border border-gray-700 rounded-md bg-gray-700">
            <h3 className="font-medium mb-3 text-white">Add New Emotion</h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <input
                type="text"
                placeholder="Name (e.g., Excited)"
                value={newEmotion.name}
                onChange={(e) => setNewEmotion({ ...newEmotion, name: e.target.value })}
                className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-white"
              />
              <button
                onClick={() => setShowEmojiPicker(true)}
                className="w-24 p-2 border border-gray-600 rounded-md bg-gray-800 text-center text-2xl"
              >
                {newEmotion.emoji || '😊'}
              </button>
              {showEmojiPicker && (
                <div className="absolute z-50">
                  <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                  <EmojiPicker
                    onEmojiClick={(emoji: any) => {
                      setNewEmotion({ ...newEmotion, emoji: emoji.emoji });
                      setShowEmojiPicker(false);
                    }}
                    theme={Theme.DARK}
                  />
                </div>
              )}
              <select
                value={newEmotion.isPositive ? 'positive' : 'negative'}
                onChange={(e) => setNewEmotion({ ...newEmotion, isPositive: e.target.value === 'positive' })}
                className="w-32 p-2 border border-gray-600 rounded-md bg-gray-800 text-white"
              >
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
              </select>
              <button
                onClick={handleAddEmotion}
                disabled={!newEmotion.name.trim() || !newEmotion.emoji.trim()}
                className="py-2 px-4 bg-primary text-white rounded-md hover:bg-opacity-90 sm:w-auto w-full"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Custom emotions will appear in the emotion selection when using Red and Green buttons.
            </p>
          </div>
        )}
        {/* Emotion Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Emotions */}
          <div>
            <h3 className="font-medium mb-3 text-green-400">Positive Emotions</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {positiveEmotions.map(emotion => (
                <motion.div
                  key={emotion.id}
                  className="flex justify-between items-center p-3 border border-gray-700 rounded-md hover:bg-gray-700"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emotion.emoji}</span>
                    <span>{emotion.name}</span>
                  </div>
                  {(
                    <button
                      onClick={() => removeEmotion(emotion.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove ${emotion.name}`}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
          {/* Negative Emotions */}
          <div>
            <h3 className="font-medium mb-3 text-red-400">Negative Emotions</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {negativeEmotions.map(emotion => (
                <motion.div
                  key={emotion.id}
                  className="flex justify-between items-center p-3 border border-gray-700 rounded-md hover:bg-gray-700"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emotion.emoji}</span>
                    <span>{emotion.name}</span>
                  </div>
                  {(
                    <button
                      onClick={() => removeEmotion(emotion.id)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove ${emotion.name}`}
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Data Synchronization */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Data Synchronization</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-300">
              Last synchronized: <span className="font-medium">{getFormattedSyncTime()}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Your data is automatically synced to the server when you make changes.
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={syncStatus === 'syncing'}
            className={`px-4 py-2 rounded-md text-white ${
              syncStatus === 'syncing' 
                ? 'bg-blue-600 opacity-70 cursor-wait' 
                : syncStatus === 'success'
                ? 'bg-green-600'
                : syncStatus === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {syncStatus === 'syncing' 
              ? 'Syncing...' 
              : syncStatus === 'success'
              ? 'Sync Successful'
              : syncStatus === 'error'
              ? 'Sync Failed'
              : 'Sync Now'}
          </button>
        </div>
        <div className="text-sm text-gray-400">
          <p>
            Syncing ensures your data is backed up and available across all your devices.
          </p>
        </div>
      </div>
      {/* Onboarding Section */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Onboarding</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-300">
              Restart the onboarding process to learn about RedButton's features.
            </p>
          </div>
          <button
            onClick={startOnboarding}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View Onboarding
          </button>
        </div>
      </div>
      {/* Danger Zone */}
      <div className="mt-8 border-t border-gray-700 pt-6">
        <h2 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h2>
        <button
          onClick={handleResetData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reset All Data
        </button>
        <p className="mt-2 text-sm text-gray-400">
          This will delete all your emotions, journal entries, actions, and goals. This action cannot be undone.
        </p>
      </div>
      {/* Debug Button */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4">
          <button
            onClick={handleShowDebugData}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Show Debug Data
          </button>
          <p className="mt-2 text-sm text-gray-400">
            Shows the raw data stored in localStorage (dev mode only).
          </p>
        </div>
      )}

      {/* Logout Button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 font-semibold"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage; 