import { app, BrowserWindow, ipcMain, Tray, nativeImage, Notification, Menu, screen, protocol, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Handle self-signed certificates in development
if (process.env.NODE_ENV === 'development' || (process.env.REACT_APP_API_URL || "").includes('localhost')) {
  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // Only allow localhost certificates
    if (url.startsWith('https://localhost:')) {
      event.preventDefault();
      callback(true);
    } else {
      callback(false);
    }
  });
}

// Better isDev detection that works in production builds
const isDev = (process.env.REACT_APP_API_URL || "").includes('localhost')

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let emotionWindow: BrowserWindow | null = null;
let deeplinkingUrl: string | null = null;
let logFilePath: string;

// Setup logging
function setupLogging() {
  // Create logs directory in the user's app data folder
  const userDataPath = app.getPath('userData');
  const logsDir = path.join(userDataPath, 'logs');
  
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  // Create a new log file for this session
  const now = new Date();
  const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
  logFilePath = path.join(logsDir, `redbutton-${timestamp}.log`);
  
  // Log startup info
  logToFile(`RedButton App Starting at ${now.toISOString()}`);
  logToFile(`App version: ${app.getVersion()}`);
  logToFile(`Electron version: ${process.versions.electron}`);
  logToFile(`Chrome version: ${process.versions.chrome}`);
  logToFile(`Node version: ${process.versions.node}`);
  logToFile(`Process architecture: ${process.arch}`);
  logToFile(`Process platform: ${process.platform}`);
  logToFile(`Process path: ${app.getAppPath()}`);
  logToFile(`User data path: ${userDataPath}`);
  logToFile(`Is development mode: ${isDev}`);
  logToFile(`Is packaged: ${app.isPackaged}`);
  logToFile(`ELECTRON_IS_DEV env var: ${process.env.ELECTRON_IS_DEV}`);
  logToFile(`NODE_ENV: ${process.env.NODE_ENV}`);
  logToFile(`Log file: ${logFilePath}`);
}

// Log to file and console
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Log to console
  console.log(message);
  
  // Log to file
  try {
    fs.appendFileSync(logFilePath, logMessage);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

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

// Register protocol handler for macOS
if (process.platform === 'darwin') {
  app.setAsDefaultProtocolClient('redbutton');
}

// Handle macOS deep linking
app.on('open-url', (event, url) => {
  event.preventDefault();
  deeplinkingUrl = url;
  logToFile(`Received deep link URL: ${url}`);
  
  // If the app is already running, handle the URL now
  if (mainWindow) {
    handleDeepLink(url);
  }
});

// Handle the deep link URL
function handleDeepLink(url: string | string[]) {
  if (!mainWindow) {
    logToFile('Cannot handle deep link: Main window is null');
    return;
  }

  // If url is an array (process.argv), look for our protocol URL
  let actualUrl: string | null = null;
  
  if (Array.isArray(url)) {
    logToFile(`Searching for deep link in args array (${url.length} items)`);
    // Look for protocol link in command line arguments
    for (const arg of url) {
      if (arg.startsWith('redbutton://') || arg.includes('localhost:3000')) {
        actualUrl = arg;
        logToFile(`Found deeplink URL in args: ${actualUrl}`);
        break;
      }
    }
    
    if (!actualUrl) {
      logToFile(`No deep link found in args: ${url.join(', ')}`);
      return;
    }
  } else {
    // Url is already a string
    actualUrl = url;
  }

  // Parse the URL to extract the token
  // URL format: redbutton://register?token=TOKEN_VALUE
  // or http://localhost:3000/register?token=TOKEN_VALUE
  try {
    const urlObj = new URL(actualUrl);
    const token = urlObj.searchParams.get('token');
    const isRegister = actualUrl.includes('/register') || urlObj.pathname.includes('register');

    logToFile(`Parsing deep link - token: ${token ? token.substring(0, 5) + '...' : 'null'}, isRegister: ${isRegister}`);

    if (token && isRegister) {
      // Show and focus the main window
      mainWindow.show();
      mainWindow.focus();
      
      // Load the registration page with the token
      let registerUrl;
      
      if (isDev) {
        // In development, use the webpack dev server
        registerUrl = `http://localhost:3000/register?token=${token}`;
        logToFile(`Using development server for deeplink: ${registerUrl.replace(token, token.substring(0, 5) + '...')}`);
      } else {
        // In production, find the correct path to index.html
        let indexPath = '';
        const possiblePaths = [
          path.join(__dirname, '../build/index.html'),
          path.join(process.resourcesPath, 'build/index.html'),
          path.join(app.getAppPath(), 'build/index.html'),
          path.join(app.getPath('exe'), '../Resources/build/index.html'),
        ];

        logToFile('Checking possible paths for index.html for deeplink:');
        for (const testPath of possiblePaths) {
          logToFile(`- Trying: ${testPath}`);
          try {
            if (fs.existsSync(testPath)) {
              indexPath = testPath;
              logToFile(`✓ Found index.html at: ${indexPath} for deeplink`);
              break;
            }
          } catch (error) {
            logToFile(`Error checking path ${testPath}: ${error}`);
          }
        }

        if (indexPath) {
          // Use the found path with the register route and token
          registerUrl = `file://${indexPath}#/register?token=${token}`;
          logToFile(`Using file URL for deeplink with hash routing: ${registerUrl.replace(token, token.substring(0, 5) + '...')}`);
        } else {
          logToFile('ERROR: Could not find index.html for deeplink in any of the expected locations');
          registerUrl = `data:text/html,<html><body><h1>Error: Could not find application files for registration</h1><p>Please reinstall the application.</p></body></html>`;
        }
      }
      
      // Load the URL with a short timeout to ensure everything is initialized properly
      setTimeout(() => {
        if (mainWindow) {
          logToFile(`Actually loading deeplink URL: ${registerUrl.replace(token, token.substring(0, 5) + '...')}`);
          mainWindow.loadURL(registerUrl).catch(err => {
            logToFile(`Error loading deeplink URL: ${err}`);
          });
        } else {
          logToFile('Error: mainWindow is null when trying to load deeplink URL');
        }
      }, 100);
    } else {
      logToFile('Deep link did not contain valid token or registration path');
    }
  } catch (error) {
    logToFile(`Failed to parse deep link URL: ${error}, URL: ${actualUrl}`);
  }
}

function createWindow() {
  logToFile('Creating main window');
  
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
      // Allow self-signed certificates in development
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev
    },
    // titleBarStyle: 'hiddenInset', // For macOS style
    icon: path.join(__dirname, '../public/logo512.png'),
    show: false, // Don't show until content is loaded
  });

  // Determine the correct path to the index.html file
  let startUrl;
  if (isDev) {
    // In development, use the webpack dev server
    startUrl = 'http://localhost:3000';
    logToFile(`Using development server URL: ${startUrl}`);
  } else {
    // In production, check multiple possible paths for the built index.html file
    let indexPath = '';
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(process.resourcesPath, 'build/index.html'),
      path.join(app.getAppPath(), 'build/index.html'),
      path.join(app.getPath('exe'), '../Resources/build/index.html'),
    ];

    logToFile('Checking possible paths for index.html:');
    for (const testPath of possiblePaths) {
      logToFile(`- Trying: ${testPath}`);
      try {
        if (fs.existsSync(testPath)) {
          indexPath = testPath;
          logToFile(`✓ Found index.html at: ${indexPath}`);
          break;
        }
      } catch (error) {
        logToFile(`Error checking path ${testPath}: ${error}`);
      }
    }

    if (indexPath) {
      // In production, use the local file path with proper URI encoding
      startUrl = `file://${indexPath}`;
      // Add hash to ensure the HashRouter works correctly
      if (!startUrl.includes('#')) {
        startUrl = `${startUrl}#/`;
      }
      logToFile(`Using file URL for production with hash routing: ${startUrl}`);
    } else {
      logToFile('ERROR: Could not find index.html in any of the expected locations');
      startUrl = `data:text/html,<html><body><h1>Error: Could not find application files</h1><p>Please reinstall the application.</p></body></html>`;
    }
  }

  logToFile(`Loading app from: ${startUrl}`);
  logToFile(`Current directory: ${__dirname}`);
  logToFile(`App path: ${app.getAppPath()}`);
  logToFile(`Resources path: ${process.resourcesPath}`);
  logToFile(`Is development mode: ${isDev}`);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      logToFile('Main window shown');
    }
  });

  // Listen for console logs from renderer process
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelStr = level === 0 ? 'INFO' : level === 1 ? 'WARN' : level === 2 ? 'ERROR' : 'DEBUG';
    logToFile(`[Renderer ${levelStr}]: ${message}`);
  });

  // Handle window load errors with more detailed information
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    logToFile(`Failed to load app window: ${errorCode} ${errorDescription} (URL: ${validatedURL})`);
    
    // Try to load a simple HTML page as a fallback in production
    if (!isDev && mainWindow) {
      const errorHtml = `
        <html>
          <head>
            <title>RedButton - Error</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                padding: 20px;
                background: #111827;
                color: white;
                line-height: 1.5;
              }
              h1 { color: #f43f5e; }
              pre {
                background: #1F2937;
                padding: 15px;
                border-radius: 4px;
                overflow: auto;
                max-width: 100%;
                font-size: 13px;
              }
              .info { 
                margin-top: 20px;
                border-top: 1px solid #374151;
                padding-top: 15px;
              }
            </style>
          </head>
          <body>
            <h1>Failed to load the application</h1>
            <p>Error: ${errorDescription} (${errorCode})</p>
            <p>URL: ${validatedURL}</p>
            <p>Please try restarting the application.</p>
            <div class="info">
              <p><strong>Diagnostic Information:</strong></p>
              <pre>
App path: ${app.getAppPath()}
Resource path: ${process.resourcesPath}
Current directory: ${__dirname}
Is dev: ${isDev}
ELECTRON_IS_DEV: ${process.env.ELECTRON_IS_DEV}
NODE_ENV: ${process.env.NODE_ENV}
Platform: ${process.platform}
Arch: ${process.arch}
              </pre>
              <p>Check the logs at: ${logFilePath}</p>
            </div>
          </body>
        </html>
      `;
      logToFile('Loading error page as fallback');
      mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
    }
  });

  // Load the URL with a short timeout to ensure everything is initialized properly
  setTimeout(() => {
    if (mainWindow) {
      logToFile(`Actually loading URL: ${startUrl}`);
      mainWindow.loadURL(startUrl).catch(err => {
        logToFile(`Error loading URL: ${err}`);
      });
    } else {
      logToFile('Error: mainWindow is null when trying to load URL');
    }
  }, 100);

  // Enable DevTools in all environments for troubleshooting
  mainWindow.webContents.on('devtools-opened', () => {
    const devToolsOpened = new Date().toISOString();
    logToFile(`DevTools opened at ${devToolsOpened} - keeping open for debugging purposes`);
  });

  mainWindow.on('closed', () => {
    logToFile('Main window closed');
    mainWindow = null;
  });
  
  // Handle page refreshes by detecting when the main window is reloaded
  mainWindow.webContents.on('did-finish-load', () => {
    logToFile('Main window finished loading');
    
    // If a timer is running, send the current status to the newly loaded page
    if (timerStatus.isRunning && timerInterval) {
      logToFile('Page refreshed while timer running, syncing timer status');
      setTimeout(() => {
        if (mainWindow) {
          mainWindow.webContents.send('timer-update', timerStatus);
          logToFile('Re-sent timer status after page reload');
        }
      }, 1000); // Small delay to ensure renderer is ready
    }
  });

  // NOTE: Widget creation is now handled in the app.whenReady() handler
}

// Add this function to check tray icon status
function checkTrayIconStatus(): { visible: boolean; error?: string } {
  logToFile('Checking tray icon status');
  
  // If tray is null, it hasn't been created yet
  if (!tray) {
    logToFile('Tray icon not created yet');
    return { visible: false, error: 'TRAY_NOT_CREATED' };
  }
  
  try {
    // Check if the tray icon has bounds (this indicates it's visible in some way)
    const bounds = tray.getBounds();
    logToFile('Tray icon bounds: ' + JSON.stringify(bounds));
    
    // If the bounds have zero width or height, the icon might not be visible
    if (bounds.width === 0 || bounds.height === 0) {
      logToFile('Tray icon has zero width or height');
      return { visible: false, error: 'TRAY_ZERO_SIZE' };
    }
    
    // On macOS, check if the icon is in the menu bar area
    if (process.platform === 'darwin') {
      const primaryDisplay = screen.getPrimaryDisplay();
      const { x, y } = bounds;
      
      // Check if the tray icon is in the top menu bar area (y near 0)
      if (y > 50) { // If y is significantly below the menu bar
        logToFile('Tray icon not in expected menu bar position');
        return { visible: false, error: 'TRAY_POSITION_UNEXPECTED' };
      }
    }
    
    // Seems to be visible
    logToFile('Tray icon appears to be visible');
    return { visible: true };
    
  } catch (error) {
    logToFile('Error checking tray icon status: ' + error);
    return { visible: false, error: 'TRAY_CHECK_ERROR' };
  }
}

function createMenuBarWidget() {
  // Check if we already have a tray icon to prevent duplicates
  if (tray) {
    logToFile('Menu bar widget already exists, skipping creation');
    return;
  }
  
  logToFile('Creating menu bar widget');
  
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
      // Allow self-signed certificates in development
      webSecurity: !isDev,
      allowRunningInsecureContent: isDev
    },
  });

  // Determine the correct URL for the widget
  let widgetUrl;
  let indexPath = '';
  
  if (isDev) {
    widgetUrl = 'http://localhost:3000/#/widget';
    logToFile(`Using development widget URL: ${widgetUrl}`);
  } else {
    // Find the index.html file using the same logic as for the main window
    const possiblePaths = [
      path.join(__dirname, '../build/index.html'),
      path.join(process.resourcesPath, 'build/index.html'),
      path.join(app.getAppPath(), 'build/index.html'),
      path.join(app.getPath('exe'), '../Resources/build/index.html'),
    ];

    logToFile('Checking possible paths for widget index.html:');
    for (const testPath of possiblePaths) {
      try {
        if (fs.existsSync(testPath)) {
          indexPath = testPath;
          logToFile(`Found widget index.html at: ${indexPath}`);
          break;
        }
      } catch (error) {
        logToFile(`Error checking widget path ${testPath}: ${error}`);
      }
    }

    if (indexPath) {
      // Important: Use hash routing in the URL
      widgetUrl = `file://${indexPath}#/widget`;
      logToFile(`Using widget URL with hash routing: ${widgetUrl}`);
    } else {
      logToFile('ERROR: Could not find index.html for widget');
      widgetUrl = `data:text/html,<html><body><h1>Error: Could not find widget files</h1></body></html>`;
    }
  }

  logToFile(`Loading widget from: ${widgetUrl}`);

  // Listen for console logs from widget window
  emotionWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levelStr = level === 0 ? 'INFO' : level === 1 ? 'WARN' : level === 2 ? 'ERROR' : 'DEBUG';
    logToFile(`[Widget ${levelStr}]: ${message}`);
  });

  // Handle window load errors
  emotionWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    logToFile(`Failed to load widget window: ${errorCode} ${errorDescription}`);
  });

  // Load the widget with error handling
  if (emotionWindow) {
    emotionWindow.loadURL(widgetUrl).catch(err => {
      logToFile(`Error loading widget URL: ${err}`);
      
      // Try a fallback approach if loading fails
      const fallbackHtml = `
        <html>
          <head>
            <title>RedButton Widget</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: transparent;
                color: white;
                text-align: center;
                padding: 20px;
              }
            </style>
          </head>
          <body>
            <h3>Widget Failed to Load</h3>
            <p>Please restart the application</p>
          </body>
        </html>
      `;
      
      if (emotionWindow) {
        emotionWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(fallbackHtml)}`);
      }
    });
  } else {
    logToFile('Error: emotionWindow is null when trying to load URL');
  }

  // In development, enable DevTools
  if (isDev) {
    emotionWindow.webContents.on('did-finish-load', () => {
      if (emotionWindow) {
        logToFile('Opened DevTools for widget (development mode)');
      }
    });
  }

  // In development, public folder is at project root
  // In production, public files are copied to build folder
  const publicPath = isDev 
    ? path.join(__dirname, '../../public/')
    : path.join(process.resourcesPath, 'public/');
  
  logToFile(`Using public path: ${publicPath}`);
  
  const menubarIconPath = path.join(publicPath, 'menubar-icon.png');
  logToFile(`Looking for menubar icon at: ${menubarIconPath}`);
  
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(menubarIconPath);
    if (trayIcon.isEmpty()) {
      logToFile('Loaded tray icon is empty, trying fallback location');
      const fallbackPath = path.join(__dirname, '../public/menubar-icon.png');
      logToFile(`Trying fallback path: ${fallbackPath}`);
      trayIcon = nativeImage.createFromPath(fallbackPath);
      
      if (trayIcon.isEmpty()) {
        logToFile('Fallback tray icon is also empty, using default icon');
      } else {
        logToFile('Successfully loaded fallback tray icon');
      }
    } else {
      logToFile('Successfully loaded tray icon');
    }
  } catch (error) {
    logToFile(`Error loading tray icon: ${error}`);
    // Create a default icon as fallback
    trayIcon = nativeImage.createEmpty();
  }
  
  // Store the original icon for later
  originalTrayIcon = trayIcon.isEmpty() ? trayIcon : trayIcon.resize({ width: 22, height: 22 });
  
  // Create the tray icon
  tray = new Tray(originalTrayIcon);
  tray.setToolTip('RedButton');
  logToFile('Tray icon created');

  // Check tray icon status and log it
  const trayStatus = checkTrayIconStatus();
  logToFile('Initial tray icon status: ' + JSON.stringify(trayStatus));
  
  // If the tray icon might not be visible, send notification to the main window
  if (!trayStatus.visible && mainWindow) {
    mainWindow.webContents.send('tray-icon-status-update', trayStatus);
  }

  // We'll position the window above the tray icon when clicked
  tray.on('click', (event, bounds) => {
    if (emotionWindow && emotionWindow.isVisible()) {
      emotionWindow.hide();
      logToFile('Hiding emotion window on tray click');
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
      logToFile('Showing emotion window on tray click');
    }
  });

  // Close the emotion window when clicked outside
  emotionWindow.on('blur', () => {
    if (emotionWindow) {
      emotionWindow.hide();
      logToFile('Hiding emotion window on blur');
    }
  });

  // Handle IPC messages from the emotion window
  ipcMain.on('show-main-window', (event, page?: string) => {
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
        
        // Navigate to specific page if provided
        if (page) {
          logToFile(`Navigating to page: ${page}`);
          
          // Construct the URL to navigate to
          let pageUrl;
          if (isDev) {
            // In development, use the webpack dev server with hash routing
            pageUrl = `http://localhost:3000/#/${page}`;
          } else {
            // In production, find the index.html path again
            let indexPath = '';
            const possiblePaths = [
              path.join(__dirname, '../build/index.html'),
              path.join(process.resourcesPath, 'build/index.html'),
              path.join(app.getAppPath(), 'build/index.html'),
              path.join(app.getPath('exe'), '../Resources/build/index.html'),
            ];

            for (const testPath of possiblePaths) {
              try {
                if (fs.existsSync(testPath)) {
                  indexPath = testPath;
                  break;
                }
              } catch (error) {
                logToFile(`Error checking path while navigating: ${error}`);
              }
            }

            if (indexPath) {
              // Use file URL with hash routing to specific page
              pageUrl = `file://${indexPath}#/${page}`;
            } else {
              logToFile('ERROR: Could not find index.html for navigation');
              // Fall back to showing the window without navigation
              pageUrl = null;
            }
          }
          
          // Navigate to the page if URL was constructed successfully
          if (pageUrl) {
            mainWindow.loadURL(pageUrl).catch(err => {
              logToFile(`Error navigating to page ${page}: ${err}`);
            });
          }
        }
        
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

// Add this function before the app.whenReady() call
function checkTrayStatusAfterStartup() {
  // Check tray status after a short delay to allow system to initialize tray icon
  setTimeout(() => {
    logToFile('Running scheduled tray icon status check');
    const status = checkTrayIconStatus();
    
    if (!status.visible) {
      logToFile('Tray icon status check failed: ' + JSON.stringify(status));
      
      // If main window exists, send the status
      if (mainWindow && !mainWindow.isDestroyed()) {
        logToFile('Sending tray icon status update to main window');
        mainWindow.webContents.send('tray-icon-status-update', status);
      }
      
      // If emotion window exists, send the status there too
      if (emotionWindow && !emotionWindow.isDestroyed()) {
        logToFile('Sending tray icon status update to emotion window');
        emotionWindow.webContents.send('tray-icon-status-update', status);
      }
    } else {
      logToFile('Tray icon appears to be visible in delayed check');
    }
  }, 5000); // Check after 5 seconds
}

// Handle app ready
app.whenReady().then(async () => {
  if (process.env.NODE_ENV === 'development') {
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
      if (request.hostname === 'localhost') {
        callback(0); // 0 = OK
      } else {
        callback(-3); // -3 = use default verification
      }
    });
  }
  // First set up logging to capture all events
  setupLogging();
  logToFile('App ready event fired');
  
  // Create the main window first
  createWindow();
  
  // Then create the menu bar widget - never do this more than once
  if (!tray) {
    createMenuBarWidget();
  }
  
  // Set up IPC handlers last
  setupIPC();

  // Check command line arguments for deep links (Windows)
  logToFile(`Checking command line args for deep links: ${process.argv.join(', ')}`);
  handleDeepLink(process.argv);

  app.on('activate', () => {
    logToFile('Activate event fired');
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      logToFile('No windows found, creating new window');
      createWindow();
    } else {
      logToFile(`Windows exist (count: ${BrowserWindow.getAllWindows().length}), focusing existing window`);
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Handle the open-url event for deep linking (macOS)
  app.on('open-url', (event, url) => {
    event.preventDefault();
    logToFile(`open-url event with URL: ${url}`);
    handleDeepLink([url]);
  });

  // Add the tray status check after window creation
  checkTrayStatusAfterStartup();

  // Add this handler:
  ipcMain.handle('check-tray-icon', async () => {
    return checkTrayIconStatus();
  });
}).catch(error => {
  logToFile(`Error during app startup: ${error}`);
});

// Handle app will-quit
app.on('will-quit', () => {
  logToFile('will-quit event fired');
  if (tray) {
    tray.destroy();
    logToFile('Tray destroyed');
  }
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  logToFile('window-all-closed event fired');
  if (process.platform !== 'darwin') {
    logToFile('Not on macOS, quitting app');
    app.quit();
  } else {
    logToFile('On macOS, app remains running');
  }
});

// Setup IPC handlers
function setupIPC() {
  logToFile('Setting up IPC handlers');

  // Handle setting the tray icon to the emotion image
  ipcMain.on('set-emotion-image', (_event, base64Image: string) => {
    logToFile('Received set-emotion-image IPC request');
    try {
      if (!base64Image || !tray) {
        logToFile('Invalid emotion image or tray not initialized');
        return;
      }

      // Create image from base64
      const imageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const image = nativeImage.createFromBuffer(imageBuffer);
      
      // Resize for tray icon
      const resizedImage = image.resize({ width: 22, height: 22 });
      
      // Set as tray icon
      if (tray) {
        tray.setImage(resizedImage);
        logToFile('Tray icon updated with emotion image');
      } else {
        logToFile('Tray is not initialized, cannot update icon');
      }
    } catch (error) {
      logToFile(`Error setting emotion image: ${error}`);
    }
  });

  // Handle resetting the tray icon back to the original
  ipcMain.on('reset-emotion-image', () => {
    logToFile('Received reset-emotion-image IPC request');
    try {
      if (tray && originalTrayIcon) {
        tray.setImage(originalTrayIcon);
        logToFile('Tray icon reset to original');
      } else {
        logToFile('Tray or original icon not initialized, cannot reset');
      }
    } catch (error) {
      logToFile(`Error resetting emotion image: ${error}`);
    }
  });

  // Handle the open-window request
  ipcMain.on('open-window', () => {
    logToFile('Received open-window IPC request');
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
        logToFile('Main window restored from minimized state');
      }
      mainWindow.show();
      mainWindow.focus();
      logToFile('Main window shown and focused');
    } else {
      logToFile('Main window is not initialized, cannot open');
      createWindow(); // Try to recreate the window if it doesn't exist
      logToFile('Attempted to recreate the main window');
    }
  });
}

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