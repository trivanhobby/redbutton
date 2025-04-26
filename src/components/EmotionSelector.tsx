import React, { useState } from 'react';
import { useData, Emotion, JournalRequest } from '../context/DataContext';
import '../styles/EmotionSelector.css';

const TIME_OPTIONS = [5, 10, 15, 20, 30];

const EmotionSelector: React.FC = () => {
  const { data, requestJournal } = useData();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<number>(10); // Default time: 10 minutes
  const [showPositive, setShowPositive] = useState<boolean>(true);

  const handleEmotionClick = (emotionId: string) => {
    setSelectedEmotion(emotionId);
  };

  const handleTimeClick = (time: number) => {
    setSelectedTime(time);
  };

  const handleJournalRequest = () => {
    if (selectedEmotion) {
      requestJournal({
        emotionId: selectedEmotion,
        timeInMinutes: selectedTime
      });
    }
  };

  const toggleEmotionType = () => {
    setShowPositive(!showPositive);
    setSelectedEmotion(null); // Reset selection when changing tabs
  };

  const filteredEmotions = data.emotions.filter((emotion: Emotion) => emotion.isPositive === showPositive);

  const getEmotionName = (emotionId: string | null) => {
    if (!emotionId) return '';
    const emotion = data.emotions.find((e: Emotion) => e.id === emotionId);
    return emotion ? emotion.name : '';
  };

  return (
    <div className="emotion-selector">
      <h2>How are you feeling?</h2>
      
      <div className="toggle-container">
        <button 
          className={`toggle-button ${showPositive ? 'active' : ''}`}
          onClick={() => showPositive || toggleEmotionType()}
        >
          Positive Emotions
        </button>
        <button 
          className={`toggle-button ${!showPositive ? 'active' : ''}`}
          onClick={() => showPositive && toggleEmotionType()}
        >
          Negative Emotions
        </button>
      </div>
      
      <div className="emotions-container">
        {filteredEmotions.map((emotion: Emotion) => (
          <button
            key={emotion.id}
            className={`emotion-button ${selectedEmotion === emotion.id ? 'selected' : ''}`}
            onClick={() => handleEmotionClick(emotion.id)}
          >
            <span className="emotion-emoji">{emotion.emoji}</span>
            <span className="emotion-name">{emotion.name}</span>
          </button>
        ))}
      </div>
      
      {selectedEmotion && (
        <>
          <h3>How long would you like to journal about feeling {getEmotionName(selectedEmotion)}?</h3>
          
          <div className="time-selector">
            {TIME_OPTIONS.map(time => (
              <button
                key={time}
                className={`time-button ${selectedTime === time ? 'selected' : ''}`}
                onClick={() => handleTimeClick(time)}
              >
                {time} min
              </button>
            ))}
          </div>
          
          <div className="action-buttons">
            <button 
              className="cancel-button"
              onClick={() => setSelectedEmotion(null)}
            >
              Cancel
            </button>
            <button 
              className="confirm-button"
              onClick={handleJournalRequest}
            >
              Start Journaling
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EmotionSelector; 