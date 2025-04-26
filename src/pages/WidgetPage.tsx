import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MenuBarWidget from '../components/widgets/MenuBarWidget';
import '../styles/MenuBarWidget.css';

// Simple page wrapper for the menu bar widget
const WidgetPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize the window to fit the content
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get the content size
        const { width, height } = entry.contentRect;
        
        // Add some padding
        const paddedWidth = Math.max(Math.ceil(width) + 10, 350);
        const paddedHeight = Math.ceil(height) + 10;
        // Resize the window through IPC
        if (window.electron) {
          window.electron.resizeWindow?.(paddedWidth, paddedHeight);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="widget-page p-2"
    >
      <MenuBarWidget />
    </motion.div>
  );
};

export default WidgetPage; 