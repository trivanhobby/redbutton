import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

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

const App: React.FC = () => {
  const location = useLocation();
  
  // Check if we're on the widget route
  const isWidget = location.pathname === '/widget' || location.hash === '#/widget';

  // If it's the widget route, render without the MainLayout
  if (isWidget) {
    return <WidgetPage />;
  }

  return (
    <>
      <motion.div 
        className="app-container bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route path="calendar" index element={<CalendarPage />} />
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