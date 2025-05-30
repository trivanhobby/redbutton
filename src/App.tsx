import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from './context/DataContext';
import { useAuth } from './context/AuthContext';
import { OnboardingProvider } from './context/OnboardingContext';

// Layout components
import MainLayout from './components/layouts/MainLayout';
import PrivateRoute from './components/PrivateRoute';

// Pages
import JournalPage from './pages/JournalPage';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import SettingsPage from './pages/SettingsPage';
import WidgetPage from './pages/WidgetPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
import AdminPage from './pages/AdminPage';
import OAuthCallback from './pages/OAuthCallback';
import SubscriptionResultPage from './pages/SubscriptionResultPage';

// Components
import SuggestionDialog from './components/SuggestionDialog';
import TimerStatusBar from './components/TimerStatusBar';
import Onboarding from './components/Onboarding';
import FollowupDialog from './components/FollowupDialog';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { data, updateSettings } = useData();
  const { isAuthenticated, setToken } = useAuth();
  
  // Check if we're on the widget route
  const isWidget = location.pathname === '/widget' || location.hash === '#/widget';

  // If it's the widget route, render without the MainLayout
  if (isWidget) {
    return <WidgetPage />;
  }

  return (
    <>
      {/* Timer status bar that appears at the top of the app when a timer is active */}
      {isAuthenticated && <TimerStatusBar />}
      <motion.div 
        className="app-container bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/admin" element={<AdminPage />} />
          
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<GoalsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="journal" element={<JournalPage />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          
          <Route path="/widget" element={<WidgetPage />} />
          <Route path="/auth/google/callback" element={<OAuthCallback />} />
          <Route path="/subscription/success" element={<SubscriptionResultPage />} />
          <Route path="/subscription/cancel" element={<SubscriptionResultPage />} />
        </Routes>
      </motion.div>
      
      {/* SuggestionDialog listens for emotion-selected events from the menu bar */}
      {isAuthenticated && <SuggestionDialog />}
      
      {/* Onboarding component will show when needed */}
      {isAuthenticated && <Onboarding />}
      
      <FollowupDialog />
    </>
  );
};

const App: React.FC = () => {
  return (
    <OnboardingProvider>
      <AppContent />
    </OnboardingProvider>
  );
};

export default App; 