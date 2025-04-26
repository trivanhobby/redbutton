import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useData, Emotion } from '../../context/DataContext';
import '../../styles/MenuBarWidget.css';

enum WidgetState {
  INITIAL,
  RED,
  GREEN
}

enum GreenAction {
  CELEBRATE = 'celebrate',
  JOURNAL = 'journal',
  PLAN = 'plan'
}

// Create a nicer time picker component
const TimePicker: React.FC<{
  selectedTime: number;
  onChange: (time: number) => void;
}> = ({ selectedTime, onChange }) => {
  const times = [5, 10, 30, 60, 120];
  
  return (
    <div className="time-picker">
      <div className="flex justify-center items-center mb-3">
        <div className="w-full h-2 bg-gray-700 rounded-full">
          <div 
            className="h-2 rounded-full bg-primary"
            style={{ width: `${(selectedTime / 120) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between">
        {times.map((time) => (
          <button
            key={time}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedTime === time
                ? 'bg-primary text-white font-medium'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            onClick={() => onChange(time)}
          >
            {time} min
          </button>
        ))}
      </div>
    </div>
  );
};

const MenuBarWidget: React.FC = () => {
  const { data } = useData();
  const [state, setState] = useState<WidgetState>(WidgetState.INITIAL);
  const [selectedTime, setSelectedTime] = useState<number>(10); // Default: 10 minutes
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [selectedAction, setSelectedAction] = useState<GreenAction | null>(null);

  // Filter emotions by type
  const negativeEmotions = data.emotions.filter(e => e.isPositive === false);
  const positiveEmotions = data.emotions.filter(e => e.isPositive === true);
  
  // Reset state when widget is closed and reopened
  useEffect(() => {
    // Listen for blur events on window which indicates widget might be closing
    const handleBlur = () => {
      // We use setTimeout to ensure this runs after the widget has closed
      setTimeout(() => {
        resetState();
      }, 100);
    };
    
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, []);
  
  // Function to reset state
  const resetState = () => {
    setState(WidgetState.INITIAL);
    setSelectedEmotion(null);
    setSelectedTime(10);
    setSelectedAction(null);
  };

  const handleShowMainWindow = () => {
    if (window.electron) {
      window.electron.showMainWindow();
    }
  };

  const handleEmotionSelect = (emotion: Emotion) => {
    setSelectedEmotion(emotion);
  };

  const handleRedClick = () => {
    setState(WidgetState.RED);
  };

  const handleGreenClick = () => {
    setState(WidgetState.GREEN);
  };

  const handleBackClick = () => {
    setState(WidgetState.INITIAL);
    setSelectedEmotion(null);
    setSelectedAction(null);
  };

  const handleActionSelect = (action: GreenAction) => {
    setSelectedAction(action);
  };

  const handleTimeSelect = (time: number) => {
    setSelectedTime(time);
  };

  const handleProceed = () => {
    if (selectedEmotion && window.electron) {
      // Prepare data to send
      const data = {
        id: selectedEmotion.id, 
        isPositive: selectedEmotion.isPositive, 
        name: selectedEmotion.name, 
        emoji: selectedEmotion.emoji,
        time: selectedTime // Include time for both positive and negative emotions
      };
      
      // For positive emotions, also include the selected action
      if (selectedEmotion.isPositive && selectedAction) {
        Object.assign(data, { action: selectedAction });
      }
      
      // Send data to main window
      window.electron.selectEmotion(data);
      
      // Reset the widget state for next time
      resetState();
    }
  };

  // Initial state - just the red/green buttons
  if (state === WidgetState.INITIAL) {
    return (
      <div className="menu-widget-container bg-gray-950 p-4 shadow-xl rounded-lg border border-gray-800 w-[320px]">
        <div className="flex justify-center items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="widget-icon">
              <div className="widget-icon-half widget-icon-red"></div>
              <div className="widget-icon-half widget-icon-green"></div>
            </div>
            <h3 className="text-lg font-semibold text-white">RedButton</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <button
            onClick={handleRedClick}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-red-900/20 rounded-lg transition-colors shadow-sm hover:shadow-md border border-gray-800 hover:border-red-800"
          >
            <span className="text-3xl mb-2">👎</span>
            <span className="text-sm font-medium text-gray-200">Not feeling well</span>
          </button>
          
          <button
            onClick={handleGreenClick}
            className="flex flex-col items-center justify-center p-4 bg-gray-900 hover:bg-green-900/20 rounded-lg transition-colors shadow-sm hover:shadow-md border border-gray-800 hover:border-green-800"
          >
            <span className="text-3xl mb-2">👍</span>
            <span className="text-sm font-medium text-gray-200">Feeling good</span>
          </button>
        </div>
      </div>
    );
  }

  // Red state - feeling bad
  if (state === WidgetState.RED) {
    return (
      <div className="menu-widget-container bg-gray-950 p-5 shadow-xl rounded-lg max-h-[500px] overflow-y-auto border border-gray-800 w-[320px]">
        <div className="flex justify-between items-center mb-5">
          <button 
            onClick={handleBackClick}
            className="text-gray-400 hover:text-gray-200 flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
          <span className="text-lg font-medium text-gray-200">I am</span>
          <div className="w-10"></div> {/* Spacer for centering the title */}
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {negativeEmotions.map(emotion => (
              <button
                key={emotion.id}
                className={`p-3 rounded-md transition-colors hover:bg-red-900/20
                  ${selectedEmotion?.id === emotion.id 
                    ? 'bg-red-900/30 border border-red-800' 
                    : 'bg-gray-900 border border-gray-800 hover:border-red-800'}`}
                onClick={() => handleEmotionSelect(emotion)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emotion.emoji}</span>
                  <span className="text-sm text-gray-200">{emotion.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3 font-medium">And I have</p>
          <TimePicker selectedTime={selectedTime} onChange={handleTimeSelect} />
        </div>
        
        <button
          className={`w-full py-2.5 text-white rounded-md transition-colors
            ${selectedEmotion 
              ? 'bg-red-600 hover:bg-red-700 cursor-pointer' 
              : 'bg-gray-700 cursor-not-allowed'}`}
          onClick={handleProceed}
          disabled={!selectedEmotion}
        >
          Get Suggestions
        </button>
      </div>
    );
  }

  // Green state - feeling good
  if (state === WidgetState.GREEN) {
    return (
      <div className="menu-widget-container bg-gray-950 p-5 shadow-xl rounded-lg max-h-[500px] overflow-y-auto border border-gray-800 w-[320px]">
        <div className="flex justify-between items-center mb-5">
          <button 
            onClick={handleBackClick}
            className="text-gray-400 hover:text-gray-200 flex items-center gap-1"
          >
            <span>←</span> Back
          </button>
          <span className="text-lg font-medium text-gray-200">I am</span>
          <div className="w-10"></div> {/* Spacer for centering the title */}
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
            {positiveEmotions.map(emotion => (
              <button
                key={emotion.id}
                className={`p-3 rounded-md transition-colors hover:bg-green-900/20
                  ${selectedEmotion?.id === emotion.id 
                    ? 'bg-green-900/30 border border-green-800' 
                    : 'bg-gray-900 border border-gray-800 hover:border-green-800'}`}
                onClick={() => handleEmotionSelect(emotion)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{emotion.emoji}</span>
                  <span className="text-sm text-gray-200">{emotion.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-3 font-medium">I want</p>
            <div className="space-y-2">
              <button 
                className={`w-full p-3 text-left rounded-md transition-colors
                  ${selectedAction === GreenAction.CELEBRATE 
                    ? 'bg-green-900/30 border border-green-800' 
                    : 'bg-gray-900 hover:bg-green-900/20 border border-gray-800 hover:border-green-800'}`}
                onClick={() => handleActionSelect(GreenAction.CELEBRATE)}
              >
                <span className="text-gray-200">To celebrate it</span>
              </button>
              <button 
                className={`w-full p-3 text-left rounded-md transition-colors
                  ${selectedAction === GreenAction.JOURNAL 
                    ? 'bg-green-900/30 border border-green-800' 
                    : 'bg-gray-900 hover:bg-green-900/20 border border-gray-800 hover:border-green-800'}`}
                onClick={() => handleActionSelect(GreenAction.JOURNAL)}
              >
                <span className="text-gray-200">To journal about what's going well</span>
              </button>
              <button 
                className={`w-full p-3 text-left rounded-md transition-colors
                  ${selectedAction === GreenAction.PLAN 
                    ? 'bg-green-900/30 border border-green-800' 
                    : 'bg-gray-900 hover:bg-green-900/20 border border-gray-800 hover:border-green-800'}`}
                onClick={() => handleActionSelect(GreenAction.PLAN)}
              >
                <span className="text-gray-200">To make a next step</span>
              </button>
            </div>
          </div>
          
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3 font-medium">And I have</p>
              <TimePicker selectedTime={selectedTime} onChange={handleTimeSelect} />
            </div>
          
          <button
            className={`w-full py-2.5 rounded-md transition-colors
              ${selectedAction 
                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                : 'bg-gray-700 text-gray-300 cursor-not-allowed'}`}
            onClick={handleProceed}
            disabled={!selectedAction}
          >
            Continue
          </button>
      </div>
    );
  }

  return null;
};

export default MenuBarWidget; 