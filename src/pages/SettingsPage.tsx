import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { initializeOpenAI } from '../utils/ai';
import { motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  const { data, updateSettings, addEmotion, removeEmotion } = useData();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newEmotion, setNewEmotion] = useState({ name: '', isPositive: true, emoji: '' });
  const [isKeyFromEnv, setIsKeyFromEnv] = useState(false);
  
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
  
  // Handle API key submission
  const handleApiKeySubmit = async () => {
    if (apiKey.trim()) {
      const success = await initializeOpenAI(apiKey.trim());
      setApiKeyStatus(success ? 'success' : 'error');
      
      if (success) {
        // Save the API key to the app data
        updateSettings({
          apiKey: apiKey.trim()
        });
        
        // Clear the input for security after successful save
        setApiKey('');
      }
    }
  };
  
  // Handle API key reset
  const handleApiKeyReset = () => {
    if (window.confirm('Are you sure you want to remove your API key?')) {
      updateSettings({
        apiKey: ''
      });
      setApiKeyStatus('idle');
    }
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

  return (
    <div className="max-w-4xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6 text-white">Settings</h1>
      
      {/* General Settings */}
      <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">General Settings</h2>
        
        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-white">Dark Mode</h3>
              <p className="text-sm text-gray-400">Switch between light and dark theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.theme === 'dark'}
                onChange={handleThemeToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* AI Assistant Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-white">AI Assistant</h3>
              <p className="text-sm text-gray-400">Enable AI-generated suggestions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.aiEnabled}
                onChange={handleAIToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* OpenAI API Key Input (only shown if AI is enabled) */}
          {data.settings.aiEnabled && (
            <div className="mt-4 p-4 border border-gray-700 rounded-md bg-gray-700">
              <h3 className="font-medium mb-2 text-white">OpenAI API Key</h3>
              <p className="text-sm text-gray-400 mb-3">
                Enter your OpenAI API key to enable AI-powered suggestions.
                Your key is stored securely in your browser's local storage and never sent to a server.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={data.settings.apiKey ? "••••••••••••••••••••••••••" : "sk-..."}
                  className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-white"
                />
                {apiKeyStatus === 'success' ? (
                  <button
                    onClick={handleApiKeyReset}
                    className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                  >
                    Reset Key
                  </button>
                ) : (
                  <button
                    onClick={handleApiKeySubmit}
                    disabled={!apiKey.trim()}
                    className={`px-4 py-2 rounded-md ${
                      apiKeyStatus === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-primary text-white'
                    } ${!apiKey.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                  >
                    {apiKeyStatus === 'error' ? 'Error' : 'Save'}
                  </button>
                )}
              </div>
              {apiKeyStatus === 'success' && (
                <p className="mt-2 text-sm text-green-400">
                  <span className="inline-flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    API key is set and working
                    {isKeyFromEnv && (
                      <span className="ml-1 px-2 py-0.5 bg-gray-600 rounded-full text-xs">
                        Loaded from environment
                      </span>
                    )}
                  </span>
                </p>
              )}
              {apiKeyStatus === 'error' && (
                <p className="mt-2 text-sm text-red-400">
                  The API key is invalid. Please check and try again.
                </p>
              )}
            </div>
          )}
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
              <input
                type="text"
                placeholder="Emoji (e.g., 😃)"
                value={newEmotion.emoji}
                onChange={(e) => setNewEmotion({ ...newEmotion, emoji: e.target.value })}
                className="w-24 p-2 border border-gray-600 rounded-md bg-gray-800 text-center text-2xl"
                maxLength={2}
              />
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
                  {data.settings.customEmotions && !emotion.id.startsWith('e1') && (
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
                  {data.settings.customEmotions && !emotion.id.startsWith('e1') && (
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
    </div>
  );
};

export default SettingsPage; 