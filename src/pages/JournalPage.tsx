import React, { useState, useEffect } from 'react';
import { useData, EmotionRecord } from '../context/DataContext';
import { format, isToday, parseISO, formatDistanceToNow, subDays } from 'date-fns';
import { generateJournalTemplate, polishJournalEntry } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInVariants, listItemVariants, containerVariants } from '../utils/animations';
import { Icon } from '@iconify/react';
import mdiContentSave from '@iconify-icons/mdi/content-save';
import mdiCheck from '@iconify-icons/mdi/check';

const JournalPage: React.FC = () => {
  const { data, addJournalEntry, updateJournalEntry, removeEmotionFromJournal } = useData();
  const [journalContent, setJournalContent] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState<{propose: boolean, polish: boolean, save: boolean}>({
    propose: false,
    polish: false,
    save: false
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Find entry for today or the selected date
  useEffect(() => {
    const entry = data.journalEntries.find(entry => entry.date === currentDate);
    if (entry) {
      setJournalContent(entry.content);
      setSelectedEntryId(entry.id);
      setIsEditing(isToday(parseISO(currentDate))); // Only allow editing for today's entry
    } else {
      setJournalContent('');
      setSelectedEntryId(null);
      setIsEditing(isToday(parseISO(currentDate)));
    }
  }, [currentDate, data.journalEntries]);

  // Handle saving journal entry - now it saves automatically when content changes
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (isEditing && journalContent.trim()) {
        if (selectedEntryId) {
          // Update existing entry
          updateJournalEntry(selectedEntryId, journalContent);
        } else {
          // Create new entry for today
          addJournalEntry({
            date: currentDate,
            content: journalContent,
            emotionRecords: [],
            actions: [],
          });
        }
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(saveTimeout);
  }, [journalContent, isEditing, selectedEntryId, currentDate, updateJournalEntry, addJournalEntry]);

  // Handle manual save button click
  const handleManualSave = () => {
    if (!isEditing || !journalContent.trim()) return;
    
    // Show the loading indicator
    setIsLoading(prev => ({ ...prev, save: true }));
    setSaveSuccess(false);
    
    // Save the journal entry
    if (selectedEntryId) {
      updateJournalEntry(selectedEntryId, journalContent);
    } else {
      addJournalEntry({
        date: currentDate,
        content: journalContent,
        emotionRecords: [],
        actions: [],
      });
    }
    
    // Simulate a delay for visual feedback
    setTimeout(() => {
      setIsLoading(prev => ({ ...prev, save: false }));
      setSaveSuccess(true);
      
      // Reset success state after a moment
      setTimeout(() => {
        setSaveSuccess(false);
      }, 1500);
    }, 500);
  };

  // Handle journal template generation
  const handleProposeTemplate = async () => {
    if (!isEditing) return;
    
    setIsLoading(prev => ({ ...prev, propose: true }));
    
    try {
      // Get emotion records for the current day
      const currentDayEmotions = currentEntryEmotionRecords || [];
      
      // Get previous entries for context (up to 3)
      const recentEntries = data.journalEntries
        .filter(entry => entry.date !== currentDate) // Exclude current day
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first
        .slice(0, 3)
        .map(entry => entry.content);
      
      // Generate a template
      const template = await generateJournalTemplate(
        currentDayEmotions, 
        data,
        recentEntries
      );
      
      // If the journal is empty or has very little content, replace it
      // Otherwise, ask the user if they want to replace or append
      if (!journalContent.trim() || journalContent.length < 20) {
        setJournalContent(template);
      } else {
        if (window.confirm("You already have journal content. Would you like to replace it with the template or append it?")) {
          setJournalContent(template);
        } else {
          setJournalContent(prev => `${prev}\n\n${template}`);
        }
      }
    } catch (error) {
      console.error('Error generating journal template:', error);
      alert('Sorry, there was an error generating the journal template. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, propose: false }));
    }
  };
  
  // Handle journal entry polishing
  const handlePolishEntry = async () => {
    if (!isEditing || !journalContent.trim()) return;
    
    setIsLoading(prev => ({ ...prev, polish: true }));
    
    try {
      // Polish the entry
      const polishedEntry = await polishJournalEntry(journalContent);
      
      // Update the content
      if (polishedEntry && polishedEntry !== journalContent) {
        setJournalContent(polishedEntry);
      }
    } catch (error) {
      console.error('Error polishing journal entry:', error);
      alert('Sorry, there was an error polishing your journal entry. Please try again.');
    } finally {
      setIsLoading(prev => ({ ...prev, polish: false }));
    }
  };

  // Get all unique dates from journal entries
  const journalDates = Array.from(
    new Set(data.journalEntries.map(entry => entry.date))
  ).sort().reverse();

  // Get emotion records for current entry
  const currentEntryEmotionRecords = selectedEntryId 
    ? data.journalEntries.find(entry => entry.id === selectedEntryId)?.emotionRecords || []
    : [];
  
  // Sort emotion records by timestamp (newest first)
  const sortedEmotionRecords = [...currentEntryEmotionRecords].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Get actions for current entry
  const currentEntryActions = selectedEntryId 
    ? data.actions.filter(action => 
        data.journalEntries.find(entry => entry.id === selectedEntryId)?.actions.includes(action.id)
      )
    : [];

  // Format the timestamp to be more readable
  const formatTimestamp = (timestamp: string) => {
    const date = parseISO(timestamp);
    return `${format(date, 'h:mm a')} (${formatDistanceToNow(date, { addSuffix: true })})`;
  };

  // Handle removing an emotion record
  const handleRemoveEmotion = (timestamp: string) => {
    if (selectedEntryId && window.confirm('Are you sure you want to remove this emotion record?')) {
      removeEmotionFromJournal(selectedEntryId, timestamp);
    }
  };

  return (
    <motion.div 
      className="max-w-4xl mx-auto text-gray-200"
      initial="hidden"
      animate="visible"
      variants={fadeInVariants}
    >
      <h1 className="text-3xl font-bold mb-6">Journal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar with dates */}
        <motion.div 
          className="md:col-span-1 bg-gray-800 rounded-lg shadow-md p-4"
          variants={containerVariants}
        >
          <h2 className="text-xl font-semibold mb-4 text-white">Entries</h2>
          <motion.div 
            className="space-y-2 max-h-[70vh] overflow-y-auto"
            variants={containerVariants}
          >
            {journalDates.length > 0 ? (
              journalDates.map((date, index) => (
                <motion.button
                  key={date}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    currentDate === date 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  }`}
                  onClick={() => setCurrentDate(date)}
                  variants={listItemVariants}
                  custom={index}
                >
                  {format(parseISO(date), 'MMM dd, yyyy')}
                  {isToday(parseISO(date)) && ' (Today)'}
                </motion.button>
              ))
            ) : (
              <p className="text-gray-400 italic">No journal entries yet.</p>
            )}
          </motion.div>
        </motion.div>
        
        {/* Main journal content */}
        <motion.div 
          className="md:col-span-2 bg-gray-800 rounded-lg shadow-md p-4"
          variants={fadeInVariants}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">
              {isToday(parseISO(currentDate)) 
                ? "Today's Entry" 
                : format(parseISO(currentDate), 'MMMM dd, yyyy')}
            </h2>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <motion.button
                    className={`py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center ${isLoading.propose ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handleProposeTemplate}
                    disabled={isLoading.propose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading.propose ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Proposing...
                      </>
                    ) : 'Propose'}
                  </motion.button>
                  <motion.button
                    className={`py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center ${isLoading.polish || !journalContent.trim() ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handlePolishEntry}
                    disabled={isLoading.polish || !journalContent.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading.polish ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Polishing...
                      </>
                    ) : 'Polish'}
                  </motion.button>
                </>
              ) : (
                isToday(parseISO(currentDate)) && (
                  <motion.button
                    className="py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-200"
                    onClick={() => setIsEditing(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Edit
                  </motion.button>
                )
              )}
            </div>
          </div>
          
          {/* Emotions timeline display */}
          {sortedEmotionRecords.length > 0 && (
            <motion.div 
              className="mb-6"
              variants={fadeInVariants}
            >
              <p className="text-sm text-gray-400 mb-2">Emotions Timeline:</p>
              <motion.div 
                className="space-y-3 border-l-2 border-gray-700 pl-4 py-2"
                variants={containerVariants}
              >
                {sortedEmotionRecords.map((record, index) => {
                  const emotion = data.emotions.find(e => e.id === record.emotionId);
                  if (!emotion) return null;
                  
                  return (
                    <motion.div 
                      key={index}
                      className="relative"
                      variants={listItemVariants}
                      custom={index}
                    >
                      <div className="absolute w-3 h-3 rounded-full bg-primary -left-[22px] top-1.5"></div>
                      <div className={`p-3 rounded-md ${
                        emotion.isPositive 
                          ? 'bg-green-900/30 border border-green-700/50' 
                          : 'bg-red-900/30 border border-red-700/50'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{emotion.emoji}</span>
                            <span className="font-medium text-white">{emotion.name}</span>
                            {record.action && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700 text-gray-300">
                                {record.action}
                              </span>
                            )}
                          </div>
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveEmotion(record.timestamp)}
                              className="text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-gray-700/50"
                              title="Remove emotion"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex flex-wrap gap-2 items-center">
                          <span>{formatTimestamp(record.timestamp)}</span>
                          {record.timeInMinutes && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-700/50 text-gray-300">
                              {record.timeInMinutes} minutes
                            </span>
                          )}
                          {record.action && emotion.isPositive && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-700/50 text-gray-200">
                              Action: {record.action}
                            </span>
                          )}
                        </div>
                        {record.suggestionSelected && (
                          <div className="mt-2 text-sm bg-blue-900/30 p-2 rounded border border-blue-700/50">
                            <span className="font-medium text-blue-400">Action taken:</span> {record.suggestionSelected}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
          
          {/* Journal text area */}
          <AnimatePresence mode="wait">
            {isEditing ? (
              <div>
                <motion.textarea
                  key="textarea"
                  className="w-full p-3 border border-gray-700 rounded-md mb-2 bg-gray-700 text-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={journalContent}
                  onChange={(e) => setJournalContent(e.target.value)}
                  placeholder="Write your thoughts here or use the 'Propose' button to get a template..."
                  rows={12}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
                
                {/* Save button added here */}
                <div className="flex justify-end mb-4">
                  <motion.button
                    onClick={handleManualSave}
                    disabled={isLoading.save || !journalContent.trim()}
                    className={`py-2 px-4 text-white rounded-md flex items-center space-x-2 
                      ${saveSuccess 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'} 
                      ${(!journalContent.trim() || isLoading.save) ? 'opacity-70 cursor-not-allowed' : ''}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading.save ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Icon icon={mdiCheck} width="20" height="20" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Icon icon={mdiContentSave} width="20" height="20" />
                        <span>Save</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ) : (
              <motion.div
                key="display"
                className="p-3 border border-gray-700 rounded-md mb-4 min-h-[200px] whitespace-pre-wrap bg-gray-700/50 text-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {journalContent || (
                  <span className="text-gray-500 italic">
                    {isToday(parseISO(currentDate)) 
                      ? 'No entry for today yet. Click "Edit" to create one.' 
                      : 'No entry for this date.'}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Help text for the AI features */}
          <AnimatePresence>
            {isEditing && (
              <motion.div 
                className="mb-4 text-sm text-gray-400 bg-gray-800 p-3 rounded-md border border-gray-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <p><strong>Propose:</strong> Generate a personalized journal template with prompts based on your emotions.</p>
                <p><strong>Polish:</strong> Improve the flow and readability of your journal entry while preserving your thoughts.</p>
                <p className="mt-1 text-xs">Note: Your journal entries are automatically saved as you type.</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Actions taken */}
          {currentEntryActions && currentEntryActions.length > 0 && (
            <motion.div
              variants={fadeInVariants}
            >
              <p className="text-sm text-gray-400 mb-1">Actions taken:</p>
              <motion.ul 
                className="list-disc list-inside space-y-1 ml-2 text-gray-300"
                variants={containerVariants}
              >
                {currentEntryActions.map((action, index) => (
                  <motion.li 
                    key={action.id} 
                    className="text-sm"
                    variants={listItemVariants}
                    custom={index}
                  >
                    {action.text}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default JournalPage; 