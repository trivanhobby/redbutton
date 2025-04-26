import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { initializeOpenAI } from '../utils/ai';
import { motion } from 'framer-motion';

const SettingsPage: React.FC = () => {
  const { data, updateSettings, addEmotion, removeEmotion } = useData();
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newEmotion, setNewEmotion] = useState({ name: '', isPositive: true, emoji: '' });
  
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
        // Clear the input after success
        setTimeout(() => {
          setApiKey('');
          setApiKeyStatus('idle');
        }, 2000);
      }
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      {/* General Settings */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">General Settings</h2>
        
        <div className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Dark Mode</h3>
              <p className="text-sm text-gray-500">Switch between light and dark theme</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.theme === 'dark'}
                onChange={handleThemeToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* AI Assistant Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">AI Assistant</h3>
              <p className="text-sm text-gray-500">Enable AI-generated suggestions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.aiEnabled}
                onChange={handleAIToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          {/* OpenAI API Key Input (only shown if AI is enabled) */}
          {data.settings.aiEnabled && (
            <div className="mt-4 p-4 border rounded-md bg-gray-50">
              <h3 className="font-medium mb-2">OpenAI API Key</h3>
              <p className="text-sm text-gray-500 mb-3">
                Enter your OpenAI API key to enable AI-powered suggestions.
                Your key is not stored on our servers and is only used locally.
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 p-2 border rounded-md"
                />
                <button
                  onClick={handleApiKeySubmit}
                  disabled={!apiKey.trim()}
                  className={`px-4 py-2 rounded-md ${
                    apiKeyStatus === 'success'
                      ? 'bg-green-500 text-white'
                      : apiKeyStatus === 'error'
                      ? 'bg-red-500 text-white'
                      : 'bg-primary text-white'
                  }`}
                >
                  {apiKeyStatus === 'success'
                    ? 'Success!'
                    : apiKeyStatus === 'error'
                    ? 'Error'
                    : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Emotion Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Emotion Settings</h2>
          
          {/* Custom Emotions Toggle */}
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Custom Emotions</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={data.settings.customEmotions}
                onChange={handleCustomEmotionsToggle}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
        
        {/* Add New Emotion (only shown if custom emotions are enabled) */}
        {data.settings.customEmotions && (
          <div className="mb-6 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium mb-3">Add New Emotion</h3>
            <div className="flex flex-col sm:flex-row gap-3 mb-2">
              <input
                type="text"
                placeholder="Name (e.g., Excited)"
                value={newEmotion.name}
                onChange={(e) => setNewEmotion({ ...newEmotion, name: e.target.value })}
                className="flex-1 p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Emoji (e.g., 😃)"
                value={newEmotion.emoji}
                onChange={(e) => setNewEmotion({ ...newEmotion, emoji: e.target.value })}
                className="w-24 p-2 border rounded-md text-center text-2xl"
                maxLength={2}
              />
              <select
                value={newEmotion.isPositive ? 'positive' : 'negative'}
                onChange={(e) => setNewEmotion({ ...newEmotion, isPositive: e.target.value === 'positive' })}
                className="w-32 p-2 border rounded-md"
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
            <p className="text-xs text-gray-500">
              Custom emotions will appear in the emotion selection when using Red and Green buttons.
            </p>
          </div>
        )}
        
        {/* Emotion Lists */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Positive Emotions */}
          <div>
            <h3 className="font-medium mb-3 text-green-600">Positive Emotions</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {positiveEmotions.map(emotion => (
                <motion.div
                  key={emotion.id}
                  className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50"
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
                      className="text-red-500 hover:text-red-700"
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
            <h3 className="font-medium mb-3 text-red-600">Negative Emotions</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {negativeEmotions.map(emotion => (
                <motion.div
                  key={emotion.id}
                  className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50"
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
                      className="text-red-500 hover:text-red-700"
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
      <div className="mt-8 border-t pt-6">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
        <button
          onClick={handleResetData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reset All Data
        </button>
        <p className="mt-2 text-sm text-gray-500">
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
          <p className="mt-2 text-sm text-gray-500">
            Shows the raw data stored in localStorage (dev mode only).
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 