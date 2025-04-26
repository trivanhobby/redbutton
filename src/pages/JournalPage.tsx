import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { format, isToday, parseISO } from 'date-fns';

const JournalPage: React.FC = () => {
  const { data, addJournalEntry, updateJournalEntry } = useData();
  const [journalContent, setJournalContent] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  // Handle saving journal entry
  const handleSaveJournal = () => {
    if (journalContent.trim()) {
      if (selectedEntryId) {
        // Update existing entry
        updateJournalEntry(selectedEntryId, journalContent);
      } else {
        // Create new entry for today
        addJournalEntry({
          date: currentDate,
          content: journalContent,
          emotions: [],
          actions: [],
        });
      }
    }
  };

  // Get all unique dates from journal entries
  const journalDates = Array.from(
    new Set(data.journalEntries.map(entry => entry.date))
  ).sort().reverse();

  // Get emotions for current entry
  const currentEntryEmotions = selectedEntryId 
    ? data.journalEntries.find(entry => entry.id === selectedEntryId)?.emotions.map(
        emotionId => data.emotions.find(e => e.id === emotionId)
      ).filter(Boolean) 
    : [];
  
  // Get actions for current entry
  const currentEntryActions = selectedEntryId 
    ? data.actions.filter(action => 
        data.journalEntries.find(entry => entry.id === selectedEntryId)?.actions.includes(action.id)
      )
    : [];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Journal</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar with dates */}
        <div className="md:col-span-1 bg-white rounded-lg shadow-md p-4">
          <h2 className="text-xl font-semibold mb-4">Entries</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {journalDates.length > 0 ? (
              journalDates.map(date => (
                <button
                  key={date}
                  className={`w-full text-left p-3 rounded-md transition-colors ${
                    currentDate === date 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => setCurrentDate(date)}
                >
                  {format(parseISO(date), 'MMM dd, yyyy')}
                  {isToday(parseISO(date)) && ' (Today)'}
                </button>
              ))
            ) : (
              <p className="text-gray-500 italic">No journal entries yet.</p>
            )}
          </div>
        </div>
        
        {/* Main journal content */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isToday(parseISO(currentDate)) 
                ? "Today's Entry" 
                : format(parseISO(currentDate), 'MMMM dd, yyyy')}
            </h2>
            {isEditing ? (
              <button
                className="py-2 px-4 bg-primary text-white rounded-md"
                onClick={handleSaveJournal}
              >
                Save
              </button>
            ) : (
              isToday(parseISO(currentDate)) && (
                <button
                  className="py-2 px-4 bg-gray-200 hover:bg-gray-300 rounded-md"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </button>
              )
            )}
          </div>
          
          {/* Emotions display */}
          {currentEntryEmotions && currentEntryEmotions.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Emotions:</p>
              <div className="flex flex-wrap gap-2">
                {currentEntryEmotions.map(emotion => (
                  emotion && (
                    <span 
                      key={emotion.id}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
                        emotion.isPositive ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {emotion.emoji} {emotion.name}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
          
          {/* Journal text area */}
          {isEditing ? (
            <textarea
              className="w-full p-3 border rounded-md mb-4"
              value={journalContent}
              onChange={(e) => setJournalContent(e.target.value)}
              placeholder="Write your thoughts here..."
              rows={12}
            />
          ) : (
            <div className="p-3 border rounded-md mb-4 min-h-[200px] whitespace-pre-wrap">
              {journalContent || (
                <span className="text-gray-400 italic">
                  {isToday(parseISO(currentDate)) 
                    ? 'No entry for today yet. Click "Edit" to create one.' 
                    : 'No entry for this date.'}
                </span>
              )}
            </div>
          )}
          
          {/* Actions taken */}
          {currentEntryActions && currentEntryActions.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Actions taken:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                {currentEntryActions.map(action => (
                  <li key={action.id} className="text-sm">
                    {action.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalPage; 