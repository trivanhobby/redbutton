import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { initializeOpenAIFromStorage } from './utils/ai';
import { useData } from './context/DataContext';

// Layout components
import MainLayout from './components/layouts/MainLayout';

// Pages
import JournalPage from './pages/JournalPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import SettingsPage from './pages/SettingsPage';
import WidgetPage from './pages/WidgetPage';

// Components
import SuggestionDialog from './components/SuggestionDialog';
import TimerStatusBar from './components/TimerStatusBar';

const App: React.FC = () => {
  const location = useLocation();
  const { data, updateSettings } = useData();
  
  // Initialize OpenAI with saved API key on app startup
  useEffect(() => {
    // Check if we have an environment variable key but no stored key
    const envApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    const hasStoredKey = data.settings.apiKey && data.settings.apiKey.trim() !== '';
    
    if (envApiKey && !hasStoredKey) {
      // Save the environment key to the app settings
      updateSettings({
        apiKey: envApiKey
      });
      console.log('Added OpenAI API key from environment variables');
    }
    
    // Initialize the OpenAI client with whatever key is available
    const success = initializeOpenAIFromStorage();
  }, [data.settings.apiKey, updateSettings]);
  
  // Check if we're on the widget route
  const isWidget = location.pathname === '/widget' || location.hash === '#/widget';

  // If it's the widget route, render without the MainLayout
  if (isWidget) {
    return <WidgetPage />;
  }

  return (
    <>
      {/* Timer status bar that appears at the top of the app when a timer is active */}
      <TimerStatusBar />
      
      <motion.div 
        className="app-container bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<CalendarPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/widget" element={<WidgetPage />} />
        </Routes>
      </motion.div>
      
      {/* SuggestionDialog listens for emotion-selected events from the menu bar */}
      <SuggestionDialog />
    </>
  );
};

export default App; 