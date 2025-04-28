/**
 * Animation variants for Framer Motion
 * This file contains reusable animation configurations
 */

// Accordion animation for expandable/collapsible sections
export const accordionVariants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      },
      opacity: { duration: 0.2 }
    }
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 }
    }
  }
};

// Fade in animation for elements appearing on the page
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.4
    }
  }
};

// Scale in animation for buttons and interactive elements
export const scaleInVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

// List item animation for staggered children
export const listItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

// Container variant for staggered children animations
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}; 