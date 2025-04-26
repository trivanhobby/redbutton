import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useData } from '../../context/DataContext';

const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addJournalEntry } = useData();
  
  const isActive = (path: string) => {
    return location.pathname === path ? 'border-b-2 border-primary' : '';
  };

  // Handle journal request from ButtonWidget
  const handleJournalRequest = (emotionId: string, text: string) => {
    // Navigate to journal page
    navigate('/journal');
    
    // Create a new journal entry with the emotion
    const today = format(new Date(), 'yyyy-MM-dd');
    addJournalEntry({
      date: today,
      content: `I'm feeling ${text}`,
      emotions: [emotionId],
      actions: [],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="text-redbutton">Red</span>
            <span className="text-greenbutton">Button</span>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            <Link to="/journal" className={`py-2 px-1 ${isActive('/journal')}`}>
              Journal
            </Link>
            <Link to="/calendar" className={`py-2 px-1 ${isActive('/calendar')}`}>
              Calendar & Stats
            </Link>
            <Link to="/goals" className={`py-2 px-1 ${isActive('/goals')}`}>
              Goals
            </Link>
            <Link to="/settings" className={`py-2 px-1 ${isActive('/settings')}`}>
              Settings
            </Link>
          </nav>
                    
          {/* Mobile menu button */}
          <div className="md:hidden">
            {/* This would be a hamburger menu in a full implementation */}
            <span>≡</span>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto p-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="py-4"
        >
          <Outlet />
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="bg-surface mt-auto py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto">
          RedButton &copy; {new Date().getFullYear()} - Mindful Productivity Assistant
        </div>
      </footer>
    </div>
  );
};

export default MainLayout; 