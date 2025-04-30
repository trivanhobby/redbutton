import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, Notification } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let emotionWindow: BrowserWindow | null = null;

// Timer related variables
interface TimerStatus {
  isRunning: boolean;
  remainingSeconds: number;
  totalMinutes: number;
  activity: string;
  emotionName: string;
}

let timerStatus: TimerStatus = {
  isRunning: false,
  remainingSeconds: 0,
  totalMinutes: 0,
  activity: '',
  emotionName: ''
};
let timerInterval: NodeJS.Timeout | null = null;
let originalTrayIcon: Electron.NativeImage | null = null;
let flashingInterval: NodeJS.Timeout | null = null;
let isFlashing = false;

// Timer sound - this will be an Audio element in the renderer process
const TIMER_SOUND_PATH = path.join(
  isDev ? path.join(__dirname, '../../public/') : path.join(__dirname, '../public/'),
  'timer-complete.mp3'
);

// Store the original click handler
let originalTrayClickHandler: Function | null = null;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset', // For macOS style
    icon: path.join(__dirname, '../public/logo512.png'),
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Handle page refreshes by detecting when the main window is reloaded
  mainWindow.webContents.on('did-finish-load', () => {
    // If a timer is running, send the current status to the newly loaded page
    if (timerStatus.isRunning && timerInterval) {
      console.log('Page refreshed while timer running, syncing timer status');
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.send('timer-update', timerStatus);
          console.log('Re-sent timer status after page reload');
        }
      }, 1000); // Small delay to ensure renderer is ready
    }
  });

  // Create the menu bar widget if it doesn't exist
  if (!tray) {
    createMenuBarWidget();
  }
}

function createMenuBarWidget() {
  // Create a hidden window for the emotion popup
  emotionWindow = new BrowserWindow({
    width: 350,
    height: 450,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    useContentSize: true, // Use the content size for sizing
    autoHideMenuBar: true, // Hide menu bar
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000/#/widget'
    : `file://${path.join(__dirname, '../build/index.html#/widget')}`;

  emotionWindow.loadURL(startUrl);

  // In development, public folder is at project root
  // In production, public files are copied to build folder
  const publicPath = isDev 
    ? path.join(__dirname, '../../public/')
    : path.join(__dirname, '../public/');
  
  let trayIcon = nativeImage.createFromPath(path.join(publicPath, 'menubar-icon.png'));
  // Store the original icon for later
  originalTrayIcon = trayIcon.resize({ width: 22, height: 22 });
  
  // Create the tray icon
  tray = new Tray(originalTrayIcon);
  tray.setToolTip('RedButton');

  // We'll position the window above the tray icon when clicked
  tray.on('click', (event, bounds) => {
    if (emotionWindow && emotionWindow.isVisible()) {
      emotionWindow.hide();
    } else if (emotionWindow) {
      const { x, y } = bounds;
      
      // Position differs based on platform
      if (process.platform === 'darwin') {
        // On macOS, position it below the menu bar icon
        emotionWindow.setPosition(x - 150 + bounds.width / 2, y + bounds.height);
      } else {
        // On Windows/Linux, position it above the system tray
        emotionWindow.setPosition(x - 150 + bounds.width / 2, y - 400);
      }
      
      emotionWindow.show();
      emotionWindow.focus();
    }
  });

  // Close the emotion window when clicked outside
  emotionWindow.on('blur', () => {
    if (emotionWindow) {
      emotionWindow.hide();
    }
  });

  // Handle IPC messages from the emotion window
  ipcMain.on('show-main-window', () => {
    // If a timer completed, navigate to the journal page
    if (isFlashing) {
      stopFlashingIcon();
      
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        
        // Send the timer data to the main window via IPC
        mainWindow.webContents.send('timer-journal-entry', {
          activity: timerStatus.activity,
          minutes: timerStatus.totalMinutes,
          emotionName: timerStatus.emotionName
        });
        
        // On macOS, explicitly bring to front
        if (process.platform === 'darwin') {
          app.dock.show();
          app.focus({ steal: true });
        }
      }
      
      // Reset timer status
      timerStatus = {
        isRunning: false,
        remainingSeconds: 0,
        totalMinutes: 0,
        activity: '',
        emotionName: ''
      };
    } else {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        
        // On macOS, explicitly bring to front
        if (process.platform === 'darwin') {
          app.dock.show();
          app.focus({ steal: true });
        }
      }
    }
  });
  
  ipcMain.on('select-emotion', (event, data) => {
    // Send the selected emotion to the main window
    if (mainWindow) {
      mainWindow.webContents.send('emotion-selected', data);
      mainWindow.show();
      mainWindow.focus();
      
      // On macOS, explicitly bring to front
      if (process.platform === 'darwin') {
        app.dock.show();
        app.focus({ steal: true });
      }
    }
    // Hide the emotion window
    if (emotionWindow) {
      emotionWindow.hide();
    }
  });

  // Handle window resize requests
  ipcMain.on('resize-window', (event, { width, height }) => {
    if (emotionWindow) {
      emotionWindow.setSize(width, height);
      console.log("RESIZED WINDOW", width, height);
      // Adjust position after resize if needed
      if (emotionWindow.isVisible()) {
        const bounds = tray?.getBounds();
        if (bounds) {
          if (process.platform === 'darwin') {
            emotionWindow.setPosition(
              bounds.x - (width / 2) + (bounds.width / 2),
              bounds.y + bounds.height
            );
          } else {
            emotionWindow.setPosition(
              bounds.x - (width / 2) + (bounds.width / 2),
              bounds.y - height
            );
          }
        }
      }
    }
  });
  
  // Timer-related IPC handlers
  ipcMain.on('start-timer', (event, status: TimerStatus) => {
    console.log('Received start-timer request with data:', status);
    
    // Stop any existing timer first
    stopTimer();
    
    // Ensure all timer state is reset before setting new values
    timerStatus = {
      isRunning: true,
      remainingSeconds: status.remainingSeconds || (status.totalMinutes * 60),
      totalMinutes: status.totalMinutes,
      activity: status.activity,
      emotionName: status.emotionName
    };
    
    console.log('New timer status created:', timerStatus);
    
    // Start timer and update tray
    startTimer();
    
    // Send confirmation back to the renderer
    event.sender.send('timer-started', { success: true });
    
    console.log(`Timer initiated for ${timerStatus.totalMinutes} minutes: ${timerStatus.activity}`);
  });
  
  ipcMain.on('stop-timer', () => {
    stopTimer();
    resetTrayIcon();
  });
}

function startTimer() {
  console.log('Starting timer with config:', timerStatus);
  
  // Stop any existing timer to ensure we don't have multiple running
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('Cleared existing timer interval');
  }
  
  // Make sure timer status is set to running
  timerStatus.isRunning = true;
  
  // Send initial timer update to let all windows know we're starting
  if (mainWindow) {
    mainWindow.webContents.send('timer-update', timerStatus);
    console.log('Sent initial timer update to main window');
  }
  if (emotionWindow) {
    emotionWindow.webContents.send('timer-update', timerStatus);
    console.log('Sent initial timer update to emotion window');
  }
  
  // Update tray tooltip and icon
  updateTrayIcon();
  
  // Set up timer interval
  timerInterval = setInterval(() => {
    if (timerStatus.remainingSeconds > 0) {
      timerStatus.remainingSeconds--;
      updateTrayIcon();
      
      // Send timer update to all renderer processes
      if (mainWindow) {
        mainWindow.webContents.send('timer-update', timerStatus);
      }
      if (emotionWindow) {
        emotionWindow.webContents.send('timer-update', timerStatus);
      }
    } else {
      // Timer completed
      timerCompleted();
    }
  }, 1000);
  
  console.log(`Timer started for ${timerStatus.totalMinutes} minutes: ${timerStatus.activity}`);
}

function stopTimer() {
  console.log('Stopping timer');
  
  // Clear the timer interval
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('Timer interval cleared');
  }
  
  // Reset timer status to default values
  timerStatus = {
    isRunning: false,
    remainingSeconds: 0,
    totalMinutes: 0,
    activity: '',
    emotionName: ''
  };
  console.log('Timer status reset to defaults');
  
  // Reset the tray icon
  resetTrayIcon();
  
  // Send timer update to all renderer processes
  if (mainWindow) {
    mainWindow.webContents.send('timer-update', timerStatus);
    console.log('Sent timer update to main window');
  }
  if (emotionWindow) {
    emotionWindow.webContents.send('timer-update', timerStatus);
    console.log('Sent timer update to emotion window');
  }
  
  console.log('Timer stopped');
}

function updateTrayIcon() {
  if (!tray) return;
  
  // Format remaining time
  const minutes = Math.floor(timerStatus.remainingSeconds / 60);
  const seconds = timerStatus.remainingSeconds % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  
  if (timerStatus.isRunning) {
    // Create a custom overlay for the tray icon to show it's a timer
    tray.setToolTip(`Timer: ${timeString} - Activity: ${timerStatus.activity}`);
    
    // For macOS, ensure the title is clearly set to show the timer
    if (process.platform === 'darwin') {
      // Use a more visible timer emoji and format with bold text to ensure visibility
      const timerEmoji = Math.floor(timerStatus.remainingSeconds / 2) % 2 === 0 ? '⏱️' : '⏰';
      
      // Ensure we set a title that's clearly visible
      const visibleTitle = `${timerEmoji} ${timeString}`;
      tray.setTitle(visibleTitle);
      
      // Log the title change to ensure it's working
      if (timerStatus.remainingSeconds === timerStatus.totalMinutes * 60 - 1 || 
          timerStatus.remainingSeconds % 10 === 0) {
        console.log(`Set macOS menu bar title to: "${visibleTitle}"`);
      }
    } else {
      // On Windows/Linux, update tooltip with more visible info
      tray.setToolTip(`⏱️ TIMER (${timeString}) - ${timerStatus.activity}`);
    }
    
    if (timerStatus.remainingSeconds % 10 === 0) {
      console.log(`Timer running: ${timeString} - ${timerStatus.activity}`);
    }
  } else {
    // Reset the tray icon to default
    resetTrayIcon();
  }
}

function timerCompleted() {
  console.log('⏰⏰⏰ TIMER COMPLETED:', timerStatus.activity, '⏰⏰⏰');
  
  // Stop the timer but keep the status for notification
  const completedActivity = timerStatus.activity;
  const completedMinutes = timerStatus.totalMinutes;
  const completedEmotionName = timerStatus.emotionName;
  
  // Important: Send timer completed notification BEFORE stopping the timer
  // This ensures the event is sent before we reset the timer status
  if (mainWindow) {
    // Send a special signal to play the completion sound
    mainWindow.webContents.send('timer-completed', {
      activity: completedActivity,
      minutes: completedMinutes,
      emotionName: completedEmotionName,
      playSound: true
    });
    console.log('Sent timer-completed event to main window with sound flag');
  }
  
  // Now stop the timer
  stopTimer();
  
  // Show a native notification
  if (process.platform === 'darwin' || process.platform === 'win32') {
    const notification = new Notification({
      title: 'Timer Completed!',
      body: `You completed "${completedActivity}" (${completedMinutes} minutes)`,
      silent: false // This should trigger the system sound
    });
    
    notification.show();
    
    // When the notification is clicked, show the main window
    notification.on('click', () => {
      // If a main window exists, show it
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        
        // Send the timer data to the main window via IPC
        mainWindow.webContents.send('timer-journal-entry', {
          activity: completedActivity,
          minutes: completedMinutes,
          emotionName: completedEmotionName
        });
        
        // Stop the flashing
        stopFlashingIcon();
      }
    });
  }
  
  // Start flashing the icon
  startFlashingIcon();
}

function startFlashingIcon() {
  if (flashingInterval) {
    clearInterval(flashingInterval);
  }
  
  isFlashing = true;
  let isVisible = true;
  let flashCount = 0;
  const MAX_FLASHES = 10; // 5 seconds (10 * 500ms)
  
  // Add a click handler to stop flashing when icon is clicked
  if (tray) {
    // Save original click handler for restoration later
    if (tray.listeners('click').length > 0) {
      originalTrayClickHandler = tray.listeners('click')[0] as Function;
    }
    
    // Remove existing click handlers temporarily
    tray.removeAllListeners('click');
    
    // Add new click handler that stops flashing and then calls the original handler
    tray.on('click', (...args) => {
      if (isFlashing) {
        console.log('Tray icon clicked while flashing, stopping flash');
        stopFlashingIcon();
        
        // Show main window and initiate journal entry
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          
          // Send the timer data to the main window via IPC
          mainWindow.webContents.send('timer-journal-entry', {
            activity: timerStatus.activity,
            minutes: timerStatus.totalMinutes,
            emotionName: timerStatus.emotionName
          });
        }
        
        return; // Don't call original handler as we've handled the click
      }
      
      // If not flashing, delegate to original handler
      if (originalTrayClickHandler) {
        originalTrayClickHandler(...args);
      }
    });
  }
  
  flashingInterval = setInterval(() => {
    if (!tray || !originalTrayIcon) return;
    
    // Increment flash count and check if we've reached the max
    flashCount++;
    if (flashCount >= MAX_FLASHES) {
      console.log('Reached maximum flash count, stopping');
      stopFlashingIcon();
      return;
    }
    
    isVisible = !isVisible;
    
    if (process.platform === 'darwin') {
      // On macOS, flash the title next to the icon
      if (isVisible) {
        tray.setTitle('');
        tray.setToolTip('RedButton - Timer completed!');
      } else {
        tray.setTitle(`✅ COMPLETED!`);
        tray.setToolTip(`Activity "${timerStatus.activity}" completed - Click to record in journal`);
      }
    } else {
      // On Windows/Linux, flash using tooltip changes
      if (isVisible) {
        tray.setImage(originalTrayIcon);
        tray.setToolTip('RedButton - Timer completed!');
      } else {
        tray.setToolTip(`✅ COMPLETED: ${timerStatus.activity} - Click to record in journal`);
      }
    }
  }, 500); // Flash every 500ms
}

function stopFlashingIcon() {
  if (flashingInterval) {
    clearInterval(flashingInterval);
    flashingInterval = null;
  }
  
  isFlashing = false;
  
  // Reset icon
  resetTrayIcon();
  
  // Restore original click handler if available
  if (tray && originalTrayClickHandler) {
    tray.removeAllListeners('click');
    tray.on('click', originalTrayClickHandler as any);
    console.log('Restored original tray click handler');
    originalTrayClickHandler = null;
  }
}

function resetTrayIcon() {
  if (tray) {
    // Reset the tray icon to the original
    if (originalTrayIcon) {
      tray.setImage(originalTrayIcon);
    }
    
    // Reset tooltip
    tray.setToolTip('RedButton');
    
    // For macOS, clear the title
    if (process.platform === 'darwin') {
      tray.setTitle('');
    }
    
    console.log('Reset tray icon to default');
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Clean up resources before quitting
app.on('will-quit', () => {
  stopTimer();
  stopFlashingIcon();
});

// IPC handlers
ipcMain.handle('save-data', async (event, data) => {
  // In a real app, you would save this to a file or database
  // For now, just log it
  console.log('Saving data:', data);
  return { success: true };
});

ipcMain.handle('get-data', async (event) => {
  // In a real app, you would load from a file or database
  // For now, return dummy data
  return { success: true, data: {} };
}); 