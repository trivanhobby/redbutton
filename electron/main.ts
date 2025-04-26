import { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu } from 'electron';
import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let emotionWindow: BrowserWindow | null = null;

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

  // Create the menu bar widget
  createMenuBarWidget();
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
  // Create the tray icon
  tray = new Tray(trayIcon.resize({ width: 22, height: 22 }));
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
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      
      // On macOS, explicitly bring to front
      if (process.platform === 'darwin') {
        app.dock.show();
        app.focus({ steal: true });
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