import React, { useState, useEffect, useRef } from 'react';
import { useData, Goal, Initiative, CheckIn } from '../context/DataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { accordionVariants, fadeInVariants, listItemVariants } from '../utils/animations';
import CrackItModal from '../components/CrackItModal';
import { Icon } from '@iconify/react';
import mdiPlus from '@iconify-icons/mdi/plus';
import mdiMagnify from '@iconify-icons/mdi/magnify';
import mdiPencil from '@iconify-icons/mdi/pencil';
import mdiDelete from '@iconify-icons/mdi/delete';
import mdiChevronUp from '@iconify-icons/mdi/chevron-up';
import mdiChevronDown from '@iconify-icons/mdi/chevron-down';
import mdiInformation from '@iconify-icons/mdi/information';

// Helper function to safely access arrays in the data object
const safeArray = <T,>(arr: T[] | undefined): T[] => {
  return arr || [];
};

// Helper function to count incomplete initiatives for a goal
const countIncompleteInitiatives = (
  goalId: string, 
  initiatives: Initiative[]
): number => {
  return initiatives
    .filter(initiative => initiative.goalId === goalId && !initiative.completed)
    .length;
};

// Helper function to count check-ins for a goal and its initiatives
const countCheckIns = (
  goalId: string, 
  initiatives: Initiative[],
  checkIns: CheckIn[]
): number => {
  // Count goal's own check-ins
  const goalCheckIns = checkIns.filter(
    checkIn => checkIn.entityId === goalId && checkIn.entityType === 'goal'
  ).length;
  
  // Count all initiatives' check-ins
  const initiativeIds = initiatives
    .filter(initiative => initiative.goalId === goalId)
    .map(initiative => initiative.id);
    
  const initiativeCheckIns = checkIns.filter(
    checkIn => initiativeIds.includes(checkIn.entityId) && checkIn.entityType === 'initiative'
  ).length;
  
  return goalCheckIns + initiativeCheckIns;
};

const GoalsPage: React.FC = () => {
  const { 
    data, 
    addGoal, 
    updateGoal,
    toggleGoal, 
    removeGoal,
    addInitiative,
    updateInitiative,
    toggleInitiative,
    removeInitiative,
    addCheckIn,
    removeCheckIn
  } = useData();
  
  // State for new goal input
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  
  // State for initiatives
  const [newInitiativeTexts, setNewInitiativeTexts] = useState<Record<string, string>>({});
  
  // State for check-ins
  const [newCheckInTexts, setNewCheckInTexts] = useState<Record<string, string>>({});
  const [checkInType, setCheckInType] = useState<Record<string, 'goal' | 'initiative'>>({});
  
  // UI state management
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});
  const [showCheckInsFor, setShowCheckInsFor] = useState<Record<string, boolean>>({});
  const [editingDescription, setEditingDescription] = useState<string | null>(null);
  const [editedDescription, setEditedDescription] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  // Track which entities have their add check-in form visible
  const [showAddCheckInFor, setShowAddCheckInFor] = useState<Record<string, boolean>>({});
  
  // Add state for the Crack It modal
  const [crackItContext, setCrackItContext] = useState<{
    goal: Goal | null;
    initiative: Initiative | null;
    isOpen: boolean;
  }>({
    goal: null,
    initiative: null,
    isOpen: false
  });
  
  // Toggle showing add goal form
  const toggleAddGoalForm = () => {
    setShowAddGoalForm(!showAddGoalForm);
    if (showAddGoalForm) {
      // Reset form when closing
      setNewGoalText('');
      setNewGoalDescription('');
    }
  };
  
  // Toggle expanded state for a goal
  const toggleExpanded = (goalId: string) => {
    // When expanding a goal, automatically show its check-ins
    const isCurrentlyExpanded = expandedGoals[goalId];
    
    // Create a new expandedGoals object with all goals collapsed
    const newExpandedState: Record<string, boolean> = {};
    
    // If the clicked goal is not currently expanded, expand it and collapse others
    // If it's already expanded, just collapse it (toggle behavior)
    if (!isCurrentlyExpanded) {
      newExpandedState[goalId] = true;
      
      // Only show goal's check-ins if they exist, to match initiative behavior
      const goalCheckIns = getCheckInsForEntity(goalId, 'goal');
      const hasGoalCheckIns = goalCheckIns.length > 0;
      
      // Only show check-ins for initiatives that have them
      const goalInitiatives = safeArray(data.initiatives).filter(
        initiative => initiative.goalId === goalId
      );
      
      const updatedCheckIns = { ...showCheckInsFor };
      
      // Only show goal check-ins if they exist (matching initiative behavior)
      updatedCheckIns[goalId] = hasGoalCheckIns;
      
      goalInitiatives.forEach(initiative => {
        // Only show initiative check-ins if they exist
        const hasCheckIns = getCheckInsForEntity(initiative.id, 'initiative').length > 0;
        if (hasCheckIns) {
          updatedCheckIns[initiative.id] = true;
        } else {
          updatedCheckIns[initiative.id] = false;
        }
      });
      
      // Update check-ins visibility state before updating expanded state
      // This ensures check-ins are already visible when the goal expansion animation begins
      setShowCheckInsFor(updatedCheckIns);
    }
    
    // Update the expanded state with the new object
    setExpandedGoals(newExpandedState);
  };
  
  // Toggle showing check-ins for an entity
  const toggleShowCheckIns = (entityId: string, entityType: 'goal' | 'initiative') => {
    // Get the check-ins for this entity
    const checkIns = getCheckInsForEntity(entityId, entityType);
    const hasCheckIns = checkIns.length > 0;
    
    if (entityType === 'initiative' && !hasCheckIns) {
      // For initiatives without check-ins, toggle the add check-in form instead
      toggleAddCheckIn(entityId, entityType, !showAddCheckInFor[entityId]);
      return;
    }
    
    // Toggle check-ins visibility for this entity
    setShowCheckInsFor(prev => ({
      ...prev,
      [entityId]: !prev[entityId]
    }));
    
    // If it's a goal and we're showing its check-ins, also expand the goal
    if (entityType === 'goal' && !showCheckInsFor[entityId]) {
      setExpandedGoals(prev => {
        const newState = { ...prev };
        newState[entityId] = true;
        return newState;
      });
    }
  };
  
  // Toggle showing add check-in form for an entity
  const toggleAddCheckIn = (entityId: string, entityType: 'goal' | 'initiative', show?: boolean) => {
    setShowAddCheckInFor(prev => ({
      ...prev,
      [entityId]: show !== undefined ? show : !prev[entityId]
    }));
    
    if (show || !showAddCheckInFor[entityId]) {
      // Set the entity type when showing the form
      setCheckInType(prev => ({
        ...prev,
        [entityId]: entityType
      }));
    }
  };
  
  // Handle adding a new goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      addGoal(newGoalText, newGoalDescription);
      setNewGoalText('');
      setNewGoalDescription('');
      setShowAddGoalForm(false); // Hide form after adding
    }
  };
  
  // Handle editing a goal description
  const handleStartEditingDescription = (goalId: string, description: string) => {
    setEditingDescription(goalId);
    setEditedDescription(description);
  };
  
  const handleSaveDescription = (goalId: string) => {
    if (editedDescription.trim() !== data.goals.find(g => g.id === goalId)?.description) {
      updateGoal(goalId, { description: editedDescription });
    }
    setEditingDescription(null);
  };
  
  // Handle adding a new initiative
  const handleAddInitiative = (goalId: string) => {
    const text = newInitiativeTexts[goalId]?.trim();
    if (text) {
      addInitiative(text, goalId);
      setNewInitiativeTexts(prev => ({
        ...prev,
        [goalId]: ''
      }));
    }
  };
  
  // Handle adding a new check-in
  const handleAddCheckIn = (entityId: string, entityType: 'goal' | 'initiative') => {
    const content = newCheckInTexts[entityId]?.trim();
    if (content) {
      addCheckIn(content, entityId, entityType);
      setNewCheckInTexts(prev => ({
        ...prev,
        [entityId]: ''
      }));
      // Hide the add form after submitting
      toggleAddCheckIn(entityId, entityType, false);
      
      // Show the check-ins section (in case it was hidden)
      setShowCheckInsFor(prev => ({
        ...prev,
        [entityId]: true
      }));
    }
  };
  
  // Format timestamp to be user-friendly
  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
  };
  
  // Filter goals based on showCompleted setting and sort with isFixed last
  const visibleGoals = safeArray(data.goals)
    .filter(goal => !goal.completed || showCompleted || goal.isFixed)
    .sort((a, b) => {
      if (a.isFixed && !b.isFixed) return 1;
      if (!a.isFixed && b.isFixed) return -1;
      return 0;
    });
  // Group initiatives by goal
  const initiativesByGoal = safeArray(data.initiatives).reduce<Record<string, Initiative[]>>((acc, initiative) => {
    if (!acc[initiative.goalId]) {
      acc[initiative.goalId] = [];
    }
    // Only include if it matches the showCompleted filter
    if (!initiative.completed || showCompleted) {
      acc[initiative.goalId].push(initiative);
    }
    return acc;
  }, {});
  
  // Get check-ins for an entity
  const getCheckInsForEntity = (entityId: string, entityType: 'goal' | 'initiative') => {
    return safeArray(data.checkIns)
      .filter(checkIn => checkIn.entityId === entityId && checkIn.entityType === entityType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };
  
  // Initialize newInitiativeText for a goal if it doesn't exist
  const getOrCreateInitiativeText = (goalId: string) => {
    // Don't set state during render - just return what's available or empty string
    return newInitiativeTexts[goalId] || '';
  };
  
  // Initialize newCheckInText for an entity if it doesn't exist
  const getOrCreateCheckInText = (entityId: string) => {
    // Don't set state during render - just return what's available or empty string
    return newCheckInTexts[entityId] || '';
  };

  // Modify renderCheckIns for immediate animation
  const renderCheckIns = (entityId: string, entityType: 'goal' | 'initiative', name?: string) => {
    if (!showCheckInsFor[entityId]) return null;
    
    const checkIns = getCheckInsForEntity(entityId, entityType);
    const hasCheckIns = checkIns.length > 0;
    
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ 
          type: "spring",
          stiffness: 500,
          damping: 30,
          opacity: { duration: 0.1 }
        }}
        className="overflow-hidden"
      >
        <div className="p-4 bg-gray-900/30 border-t border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-gray-300 flex items-center">
              {entityType === 'initiative' && <span className="text-xs mr-2">→</span>}
              Check-ins {name && <span className="ml-2 text-gray-400">for: {name}</span>}
            </h4>
            
            {/* Add check-in button */}
            <button
              onClick={() => toggleAddCheckIn(entityId, entityType, true)}
              className="text-xs py-1 px-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 flex items-center"
            >
              <Icon icon={mdiPlus} className="mr-1" width="14" height="14" /> Add check-in
            </button>
          </div>
          
          {/* Add Check-in Form - only shown when showAddCheckInFor[entityId] is true */}
          <AnimatePresence>
            {showAddCheckInFor[entityId] && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                className="mb-4"
              >
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    className="flex-1 p-2 text-sm border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Add a new check-in..."
                    value={getOrCreateCheckInText(entityId)}
                    onChange={(e) => {
                      setNewCheckInTexts(prev => ({
                        ...prev,
                        [entityId]: e.target.value
                      }));
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleAddCheckIn(entityId, entityType, false)}
                      className="py-2 px-3 bg-gray-800 text-gray-300 text-sm rounded-md hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleAddCheckIn(entityId, entityType)}
                      className="py-2 px-3 bg-primary text-white text-sm rounded-md hover:bg-opacity-90 flex items-center justify-center"
                      disabled={!newCheckInTexts[entityId]?.trim()}
                    >
                      <Icon icon={mdiPlus} width="16" height="16" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Check-ins List */}
          <div className="space-y-3 border-l-2 border-gray-700 pl-4 py-2">
            {hasCheckIns ? (
              checkIns.map((checkIn) => (
                <div 
                  key={checkIn.id}
                  className="relative"
                >
                  <div className="absolute w-3 h-3 rounded-full bg-primary -left-[22px] top-1.5"></div>
                  <div className="p-3 rounded-md bg-blue-900/30 border border-blue-700/50">
                    <div className="flex justify-between mb-1">
                      <div className="text-sm text-gray-400">
                        {formatTimestamp(checkIn.timestamp)}
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this check-in?')) {
                            removeCheckIn(checkIn.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-xs flex items-center"
                        title="Delete check-in"
                      >
                        <Icon icon={mdiDelete} width="16" height="16" />
                      </button>
                    </div>
                    <p className="text-gray-200 whitespace-pre-wrap">{checkIn.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No check-ins yet.</p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Add the new function to handle opening the Crack It chat window
  const handleOpenCrackItChat = (goal: Goal, initiative: Initiative) => {
    // Open the CrackItModal with the goal and initiative context
    setCrackItContext({
      goal,
      initiative,
      isOpen: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto text-gray-200">
      <h1 className="text-3xl font-bold mb-6">Goals</h1>
      
      {/* Top controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2 text-gray-300">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="h-4 w-4 text-primary rounded bg-gray-600 border-gray-500 focus:ring-primary focus:ring-offset-gray-700"
            />
            <span>Show completed</span>
          </label>
        </div>
        
        {/* Add Goal Button */}
        <motion.button
          onClick={toggleAddGoalForm}
          className="flex items-center justify-center p-2 bg-primary text-white rounded-full hover:bg-opacity-90"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showAddGoalForm ? 
            <Icon icon={mdiChevronUp} width="24" height="24" /> : 
            <Icon icon={mdiPlus} width="24" height="24" />
          }
        </motion.button>
      </div>
      
      {/* Add Goal Form (conditionally rendered) */}
      <AnimatePresence>
        {showAddGoalForm && (
          <motion.div 
            className="bg-gray-800 rounded-lg shadow-md p-6 mb-8"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-white">Add New Goal</h2>
            <form onSubmit={handleAddGoal}>
              <div className="mb-4">
                <input
                  type="text"
                  className="w-full p-3 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Enter a new goal or intention..."
                  value={newGoalText}
                  onChange={(e) => setNewGoalText(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <textarea
                  className="w-full p-3 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Description (optional)"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="py-3 px-6 bg-primary text-white rounded-md hover:bg-opacity-90 flex items-center"
                  disabled={!newGoalText.trim()}
                >
                  <Icon icon={mdiPlus} className="mr-2" width="18" height="18" /> Add Goal
                </button>
              </div>
            </form>
            <p className="mt-3 text-sm text-gray-400">
              Goals help provide context for AI suggestions when you're feeling stuck. They should represent actions aligned with your values.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Goals List */}
      <div className="space-y-6">
        {visibleGoals.map(goal => (
          <motion.div
            key={goal.id}
            className="bg-gray-800 rounded-lg shadow-md overflow-hidden group"
            layout
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            {/* Goal Header */}
            <div 
              className={`p-4 border-b border-gray-700 relative cursor-pointer 
                ${goal.isFixed ? 'bg-gray-700/30' : goal.completed ? 'bg-green-900/20' : 'bg-gray-700/10'}`}
              onClick={() => toggleExpanded(goal.id)}
            >
              <div className="flex items-start space-x-3">
                {!goal.isFixed && (
                  <input
                    type="checkbox"
                    checked={goal.completed}
                    onChange={() => toggleGoal(goal.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-5 w-5 text-primary rounded bg-gray-600 border-gray-500 focus:ring-primary focus:ring-offset-gray-700"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className={`text-lg font-medium ${goal.completed && !goal.isFixed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {goal.text}
                    </h3>
                    
                    {/* Initiative and Checkin Counts */}
                    {!goal.completed && (
                      <div className="flex ml-3 space-x-2">
                        {countIncompleteInitiatives(goal.id, safeArray(data.initiatives)) > 0 && (
                          <span className="flex items-center px-2 py-1 text-xs bg-blue-900/50 text-blue-200 rounded-full">
                            <Icon icon={mdiInformation} className="mr-1" width="14" height="14" />
                            {countIncompleteInitiatives(goal.id, safeArray(data.initiatives))} tasks
                          </span>
                        )}
                        {countCheckIns(goal.id, safeArray(data.initiatives), safeArray(data.checkIns)) > 0 && (
                          <span className="flex items-center px-2 py-1 text-xs bg-purple-900/50 text-purple-200 rounded-full">
                            <Icon icon={mdiMagnify} className="mr-1" width="14" height="14" /> 
                            {countCheckIns(goal.id, safeArray(data.initiatives), safeArray(data.checkIns))}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Description displayed on main card */}
                  {goal.description && (
                    <p className="text-gray-400 text-sm mt-1 mr-20">{goal.description}</p>
                  )}
                  
                  {goal.completed && !goal.isFixed && goal.completedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Completed {formatTimestamp(goal.completedAt)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Action buttons visible on hover */}
              <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {/* Quick add initiative button */}
                <motion.button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(goal.id);
                    // Focus initiative input in next render cycle
                    setTimeout(() => {
                      const input = document.getElementById(`initiative-input-${goal.id}`);
                      if (input) input.focus();
                    }, 100);
                  }}
                  className="text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                  title="Add Initiative"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon icon={mdiPlus} width="20" height="20" />
                </motion.button>
                
                <motion.button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleShowCheckIns(goal.id, 'goal');
                  }}
                  className="text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                  title="Check-ins"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon icon={mdiMagnify} width="20" height="20" />
                </motion.button>
                
                {!goal.isFixed && (
                  <>
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditingDescription(goal.id, goal.description);
                        toggleExpanded(goal.id);
                      }}
                      className="text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                      title="Edit Goal"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon icon={mdiPencil} width="20" height="20" />
                    </motion.button>
                    
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this goal?')) {
                          removeGoal(goal.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 bg-gray-700 hover:bg-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                      title="Delete Goal"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon icon={mdiDelete} width="20" height="20" />
                    </motion.button>
                  </>
                )}
                
                <motion.button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(goal.id);
                  }}
                  className="text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-full h-8 w-8 flex items-center justify-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {expandedGoals[goal.id] ? 
                    <Icon icon={mdiChevronUp} width="20" height="20" /> : 
                    <Icon icon={mdiChevronDown} width="20" height="20" />
                  }
                </motion.button>
              </div>
            </div>
            
            {/* Goal expanded content */}
            <AnimatePresence>
              {expandedGoals[goal.id] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                  className="overflow-hidden"
                >
                  {/* Description editing section (only if editing) */}
                  {editingDescription === goal.id ? (
                    <div className="p-4 border-b border-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-sm font-medium text-gray-300">Edit Description</h4>
                        <button
                          onClick={() => handleSaveDescription(goal.id)}
                          className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-opacity-90"
                        >
                          Save
                        </button>
                      </div>
                      
                      <textarea
                        className="w-full p-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Initiatives Section - only show if not editing */}
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-300">Initiatives</h4>
                        </div>
                        
                        {/* Initiatives List */}
                        <div className="space-y-4 mb-4">
                          {initiativesByGoal[goal.id]?.length > 0 ? (
                            initiativesByGoal[goal.id]?.map(initiative => (
                              <div key={initiative.id}>
                                <div 
                                  className="flex items-start space-x-3 p-3 bg-gray-900/50 rounded-md border border-gray-700 hover:border-gray-600 group cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Get check-ins for this initiative
                                    const checkIns = getCheckInsForEntity(initiative.id, 'initiative');
                                    const hasCheckIns = checkIns.length > 0;
                                    
                                    if (hasCheckIns) {
                                      // If it has check-ins, toggle them
                                      toggleShowCheckIns(initiative.id, 'initiative');
                                    } else {
                                      // If no check-ins, show the add check-in form
                                      toggleAddCheckIn(initiative.id, 'initiative', true);
                                    }
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={initiative.completed}
                                    onChange={() => toggleInitiative(initiative.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="mt-1 h-4 w-4 text-primary rounded bg-gray-600 border-gray-500 focus:ring-primary focus:ring-offset-gray-700"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <p className={`text-sm ${initiative.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                                        {initiative.text}
                                      </p>
                                      {!initiative.completed && getCheckInsForEntity(initiative.id, 'initiative').length > 0 && (
                                        <span className="flex items-center ml-2 px-2 py-0.5 text-xs bg-purple-900/50 text-purple-200 rounded-full">
                                          <Icon icon={mdiMagnify} className="mr-1" width="12" height="12" /> 
                                          {getCheckInsForEntity(initiative.id, 'initiative').length}
                                        </span>
                                      )}
                                    </div>
                                    {initiative.completed && initiative.completedAt && (
                                      <p className="text-xs text-gray-500">
                                        Completed {formatTimestamp(initiative.completedAt)}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Get check-ins for this initiative
                                        const checkIns = getCheckInsForEntity(initiative.id, 'initiative');
                                        const hasCheckIns = checkIns.length > 0;
                                        
                                        if (hasCheckIns) {
                                          // If it has check-ins, toggle them
                                          toggleShowCheckIns(initiative.id, 'initiative');
                                        } else {
                                          // If no check-ins, show the add check-in form
                                          toggleAddCheckIn(initiative.id, 'initiative', true);
                                        }
                                      }}
                                      className="text-gray-400 hover:text-gray-200 p-1 bg-gray-800 rounded-full h-7 w-7 flex items-center justify-center"
                                      title="Check-ins"
                                    >
                                      <Icon icon={mdiMagnify} width="16" height="16" />
                                    </button>
                                    
                                    {/* Crack It button - new */}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Will implement opening the chat window
                                        handleOpenCrackItChat(goal, initiative);
                                      }}
                                      className="text-amber-400 hover:text-amber-300 p-1 bg-gray-800 rounded-full h-7 w-7 flex items-center justify-center"
                                      title="Crack It - Break down this initiative"
                                    >
                                      <Icon icon={mdiInformation} width="16" height="16" />
                                    </button>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Are you sure you want to delete this initiative?')) {
                                          removeInitiative(initiative.id);
                                        }
                                      }}
                                      className="text-red-400 hover:text-red-300 p-1 bg-gray-800 rounded-full h-7 w-7 flex items-center justify-center"
                                      title="Delete initiative"
                                    >
                                      <Icon icon={mdiDelete} width="16" height="16" />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Check-ins for this initiative */}
                                <AnimatePresence>
                                  {showCheckInsFor[initiative.id] && renderCheckIns(initiative.id, 'initiative', initiative.text)}
                                </AnimatePresence>
                                
                                {/* Add Check-in form - shown when user clicks on an initiative with no check-ins */}
                                <AnimatePresence>
                                  {showAddCheckInFor[initiative.id] && !showCheckInsFor[initiative.id] && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="p-4 bg-gray-900/30 border-t border-gray-700"
                                    >
                                      <div className="flex space-x-2">
                                        <input
                                          type="text"
                                          className="flex-1 p-2 text-sm border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                          placeholder="Add a new check-in..."
                                          value={getOrCreateCheckInText(initiative.id)}
                                          onChange={(e) => {
                                            setNewCheckInTexts(prev => ({
                                              ...prev,
                                              [initiative.id]: e.target.value
                                            }));
                                          }}
                                          autoFocus
                                        />
                                        <div className="flex space-x-1">
                                          <button
                                            onClick={() => toggleAddCheckIn(initiative.id, 'initiative', false)}
                                            className="py-2 px-3 bg-gray-800 text-gray-300 text-sm rounded-md hover:bg-gray-700"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() => handleAddCheckIn(initiative.id, 'initiative')}
                                            className="py-2 px-3 bg-primary text-white text-sm rounded-md hover:bg-opacity-90 flex items-center justify-center"
                                            disabled={!newCheckInTexts[initiative.id]?.trim()}
                                          >
                                            <Icon icon={mdiPlus} width="16" height="16" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500 italic">No initiatives yet.</p>
                          )}
                        </div>
                        
                        {/* Add Initiative Form */}
                        <div className="flex space-x-2">
                          <input
                            id={`initiative-input-${goal.id}`}
                            type="text"
                            className="flex-1 p-2 text-sm border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="Add a new initiative..."
                            value={getOrCreateInitiativeText(goal.id)}
                            onChange={(e) => setNewInitiativeTexts(prev => ({
                              ...prev,
                              [goal.id]: e.target.value
                            }))}
                          />
                          <button
                            onClick={() => handleAddInitiative(goal.id)}
                            className="py-2 px-3 bg-primary text-white text-sm rounded-md hover:bg-opacity-90 flex items-center justify-center"
                            disabled={!newInitiativeTexts[goal.id]?.trim()}
                          >
                            <Icon icon={mdiPlus} width="18" height="18" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Goal check-ins section */}
                      <AnimatePresence>
                        {showCheckInsFor[goal.id] && renderCheckIns(goal.id, 'goal', goal.text)}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
      
      {/* Render the CrackItModal when isOpen is true */}
      {crackItContext.isOpen && crackItContext.goal && crackItContext.initiative && (
        <CrackItModal
          goal={crackItContext.goal}
          initiative={crackItContext.initiative}
          onClose={() => setCrackItContext(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default GoalsPage; 