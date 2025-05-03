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
  const times = [1, 5, 10, 30, 60, 120];
  
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

// Tray Icon Helper Popup
const TrayIconHelp: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  error?: string;
}> = ({ isOpen, onClose, error }) => {
  if (!isOpen) return null;

  const getMacOSInstructions = () => (
    <>
      <h3 className="text-lg font-semibold text-white mb-2">macOS Menu Bar Troubleshooting</h3>
      <ol className="list-decimal ml-5 space-y-2 mb-4">
        <li>Check if the menu bar is hidden or overcrowded (look for &gt;&gt; in your menu bar)</li>
        <li>Click on &gt;&gt; to see hidden menu bar icons</li>
        <li>Drag the RedButton icon to your visible menu bar area</li>
        <li>Restart the application if the icon is still not visible</li>
        <li>Check System Preferences &gt; Dock & Menu Bar for menu bar settings</li>
      </ol>
    </>
  );

  const getWindowsInstructions = () => (
    <>
      <h3 className="text-lg font-semibold text-white mb-2">Windows System Tray Troubleshooting</h3>
      <ol className="list-decimal ml-5 space-y-2 mb-4">
        <li>Check if the icon is hidden in the "Show hidden icons" menu (^ arrow in system tray)</li>
        <li>Click on the ^ arrow to see hidden system tray icons</li>
        <li>Right-click on the taskbar and select "Taskbar settings"</li>
        <li>Go to "Notification area" or "System icons" settings</li>
        <li>Make sure RedButton is set to "Show icon and notifications"</li>
        <li>Restart the application if the icon is still not visible</li>
      </ol>
    </>
  );

  const getLinuxInstructions = () => (
    <>
      <h3 className="text-lg font-semibold text-white mb-2">Linux System Tray Troubleshooting</h3>
      <ol className="list-decimal ml-5 space-y-2 mb-4">
        <li>Ensure your desktop environment supports system tray icons</li>
        <li>Check if your system tray/status bar is visible</li>
        <li>Try restarting your system tray (command varies by desktop environment)</li>
        <li>Restart the application if the icon is still not visible</li>
      </ol>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-lg w-full p-6 border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Menu Bar Icon Not Visible</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4 text-gray-300">
          <p className="mb-4">
            The RedButton menu bar icon appears to be missing or not visible. 
            This could be due to system settings or an application issue.
          </p>
          
          {error === 'TRAY_ICON_EMPTY' && (
            <div className="bg-yellow-900/30 border border-yellow-800 p-3 rounded-md mb-4">
              <p className="text-yellow-300 font-semibold">Icon Resource Issue</p>
              <p className="text-yellow-100 text-sm">
                The application couldn't load the menu bar icon resource. 
                Try reinstalling the application to fix this issue.
              </p>
            </div>
          )}

          {process.platform === 'darwin' ? getMacOSInstructions() : 
           process.platform === 'win32' ? getWindowsInstructions() : 
           getLinuxInstructions()}
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-opacity-90"
          >
            Got it
          </button>
        </div>
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
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  
  // Add state for tray icon help popup
  const [showTrayHelp, setShowTrayHelp] = useState(false);
  const [trayError, setTrayError] = useState<string | undefined>(undefined);

  // Filter emotions by type
  const negativeEmotions = data.emotions.filter(e => e.isPositive === false);
  const positiveEmotions = data.emotions.filter(e => e.isPositive === true);
  
  // Check tray icon status on mount and when refreshTrigger changes
  useEffect(() => {
    // Only run this if we're in Electron (window.electron exists)
    if (window.electron?.checkTrayIconStatus) {
      const checkTrayStatus = async () => {
        try {
          const status = await window.electron!.checkTrayIconStatus();
          if (!status.visible) {
            console.warn('Tray icon not visible:', status.error);
            setTrayError(status.error);
            setShowTrayHelp(true);
          }
        } catch (error) {
          console.error('Failed to check tray status:', error);
        }
      };
      
      checkTrayStatus();
    }
  }, [refreshTrigger]);

  // Listen for tray icon status updates from main process
  useEffect(() => {
    if (window.electron?.onTrayIconStatusUpdate) {
      const unsubscribe = window.electron.onTrayIconStatusUpdate((status) => {
        if (!status.visible) {
          console.warn('Tray icon status update - not visible:', status.error);
          setTrayError(status.error);
          setShowTrayHelp(true);
        }
      });
      
      return unsubscribe;
    }
  }, []);
  
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

  // Add a focus handler to refresh data when the widget is reopened
  useEffect(() => {
    const handleFocus = () => {
      // Trigger refresh when widget regains focus
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Function to reset state
  const resetState = () => {
    setState(WidgetState.INITIAL);
    setSelectedEmotion(null);
    setSelectedTime(10);
    setSelectedAction(null);
    
    // Refresh the data by incrementing the refresh trigger
    setRefreshTrigger(prev => prev + 1);
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
      <>
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
        
        {/* Tray icon help popup */}
        <TrayIconHelp 
          isOpen={showTrayHelp} 
          onClose={() => setShowTrayHelp(false)} 
          error={trayError}
        />
      </>
    );
  }

  // Red state - feeling bad
  if (state === WidgetState.RED) {
    return (
      <>
        <div className="menu-widget-container bg-gray-950 p-5 shadow-xl rounded-lg border border-gray-800 w-[320px] flex flex-col" style={{ maxHeight: '800px' }}>
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

          <div className="mb-6 w-full">
            {/* Emotions grid with no scrolling */}
            <div className="grid grid-cols-2 gap-3 w-full">
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
        
        {/* Tray icon help popup */}
        <TrayIconHelp 
          isOpen={showTrayHelp} 
          onClose={() => setShowTrayHelp(false)} 
          error={trayError}
        />
      </>
    );
  }

  // Green state - feeling good
  if (state === WidgetState.GREEN) {
    return (
      <>
        <div className="menu-widget-container bg-gray-950 p-5 shadow-xl rounded-lg border border-gray-800 w-[320px] flex flex-col" style={{ maxHeight: '800px' }}>
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

          <div className="mb-6 w-full">
            {/* Emotions grid with no scrolling */}
            <div className="grid grid-cols-2 gap-3 w-full">
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
        
        {/* Tray icon help popup */}
        <TrayIconHelp 
          isOpen={showTrayHelp} 
          onClose={() => setShowTrayHelp(false)} 
          error={trayError}
        />
      </>
    );
  }

  return null;
};

export default MenuBarWidget; 