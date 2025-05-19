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
    return location.pathname === path || (location.pathname === '/' && path === '/calendar') 
      ? 'border-b-2 border-primary text-white font-medium' 
      : 'text-gray-400 hover:text-gray-200';
  };

  // Handle journal request from ButtonWidget

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <span className="text-redbutton">Red</span>
            <span className="text-greenbutton">Button</span>
          </Link>
          
          <nav className="hidden md:flex space-x-8">
            <Link to="/journal" className={`py-2 px-1 transition-colors ${isActive('/journal')}`}>
              Journal
            </Link>
            <Link to="/calendar" className={`py-2 px-1 transition-colors ${isActive('/calendar')}`}>
              Calendar & Stats
            </Link>
            <Link to="/goals" className={`py-2 px-1 transition-colors ${isActive('/goals')}`}>
              Goals
            </Link>
            <Link to="/settings" className={`py-2 px-1 transition-colors ${isActive('/settings')}`}>
              Settings
            </Link>
          </nav>
                    
          {/* Mobile menu button */}
          <div className="md:hidden">
            {/* This would be a hamburger menu in a full implementation */}
            <span className="text-gray-300 text-2xl">≡</span>
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
    </div>
  );
};

export default MainLayout; 