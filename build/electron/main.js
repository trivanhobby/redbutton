"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
// Better isDev detection that works in production builds
var isDev = process.env.ELECTRON_IS_DEV === '1' ||
    !(electron_1.app && electron_1.app.isPackaged) ||
    process.env.NODE_ENV === 'development';
var mainWindow = null;
var tray = null;
var emotionWindow = null;
var deeplinkingUrl = null;
var logFilePath;
// Setup logging
function setupLogging() {
    // Create logs directory in the user's app data folder
    var userDataPath = electron_1.app.getPath('userData');
    var logsDir = path.join(userDataPath, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    // Create a new log file for this session
    var now = new Date();
    var timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '');
    logFilePath = path.join(logsDir, "redbutton-".concat(timestamp, ".log"));
    // Log startup info
    logToFile("RedButton App Starting at ".concat(now.toISOString()));
    logToFile("App version: ".concat(electron_1.app.getVersion()));
    logToFile("Electron version: ".concat(process.versions.electron));
    logToFile("Chrome version: ".concat(process.versions.chrome));
    logToFile("Node version: ".concat(process.versions.node));
    logToFile("Process architecture: ".concat(process.arch));
    logToFile("Process platform: ".concat(process.platform));
    logToFile("Process path: ".concat(electron_1.app.getAppPath()));
    logToFile("User data path: ".concat(userDataPath));
    logToFile("Is development mode: ".concat(isDev));
    logToFile("Is packaged: ".concat(electron_1.app.isPackaged));
    logToFile("ELECTRON_IS_DEV env var: ".concat(process.env.ELECTRON_IS_DEV));
    logToFile("NODE_ENV: ".concat(process.env.NODE_ENV));
    logToFile("Log file: ".concat(logFilePath));
}
// Log to file and console
function logToFile(message) {
    var timestamp = new Date().toISOString();
    var logMessage = "[".concat(timestamp, "] ").concat(message, "\n");
    // Log to console
    console.log(message);
    // Log to file
    try {
        fs.appendFileSync(logFilePath, logMessage);
    }
    catch (error) {
        console.error('Failed to write to log file:', error);
    }
}
var timerStatus = {
    isRunning: false,
    remainingSeconds: 0,
    totalMinutes: 0,
    activity: '',
    emotionName: ''
};
var timerInterval = null;
var originalTrayIcon = null;
var flashingInterval = null;
var isFlashing = false;
// Timer sound - this will be an Audio element in the renderer process
var TIMER_SOUND_PATH = path.join(isDev ? path.join(__dirname, '../../public/') : path.join(__dirname, '../public/'), 'timer-complete.mp3');
// Store the original click handler
var originalTrayClickHandler = null;
// Register protocol handler for macOS
if (process.platform === 'darwin') {
    electron_1.app.setAsDefaultProtocolClient('redbutton');
}
// Handle macOS deep linking
electron_1.app.on('open-url', function (event, url) {
    event.preventDefault();
    deeplinkingUrl = url;
    logToFile("Received deep link URL: ".concat(url));
    // If the app is already running, handle the URL now
    if (mainWindow) {
        handleDeepLink(url);
    }
});
// Handle the deep link URL
function handleDeepLink(url) {
    if (!mainWindow) {
        logToFile('Cannot handle deep link: Main window is null');
        return;
    }
    // If url is an array (process.argv), look for our protocol URL
    var actualUrl = null;
    if (Array.isArray(url)) {
        logToFile("Searching for deep link in args array (".concat(url.length, " items)"));
        // Look for protocol link in command line arguments
        for (var _i = 0, url_1 = url; _i < url_1.length; _i++) {
            var arg = url_1[_i];
            if (arg.startsWith('redbutton://') || arg.includes('localhost:3000')) {
                actualUrl = arg;
                logToFile("Found deeplink URL in args: ".concat(actualUrl));
                break;
            }
        }
        if (!actualUrl) {
            logToFile("No deep link found in args: ".concat(url.join(', ')));
            return;
        }
    }
    else {
        // Url is already a string
        actualUrl = url;
    }
    // Parse the URL to extract the token
    // URL format: redbutton://register?token=TOKEN_VALUE
    // or http://localhost:3000/register?token=TOKEN_VALUE
    try {
        var urlObj = new URL(actualUrl);
        var token_1 = urlObj.searchParams.get('token');
        var isRegister = actualUrl.includes('/register') || urlObj.pathname.includes('register');
        logToFile("Parsing deep link - token: ".concat(token_1 ? token_1.substring(0, 5) + '...' : 'null', ", isRegister: ").concat(isRegister));
        if (token_1 && isRegister) {
            // Show and focus the main window
            mainWindow.show();
            mainWindow.focus();
            // Load the registration page with the token
            var registerUrl_1;
            if (isDev) {
                // In development, use the webpack dev server
                registerUrl_1 = "http://localhost:3000/register?token=".concat(token_1);
                logToFile("Using development server for deeplink: ".concat(registerUrl_1.replace(token_1, token_1.substring(0, 5) + '...')));
            }
            else {
                // In production, find the correct path to index.html
                var indexPath = '';
                var possiblePaths = [
                    path.join(__dirname, '../build/index.html'),
                    path.join(process.resourcesPath, 'build/index.html'),
                    path.join(electron_1.app.getAppPath(), 'build/index.html'),
                    path.join(electron_1.app.getPath('exe'), '../Resources/build/index.html'),
                ];
                logToFile('Checking possible paths for index.html for deeplink:');
                for (var _a = 0, possiblePaths_1 = possiblePaths; _a < possiblePaths_1.length; _a++) {
                    var testPath = possiblePaths_1[_a];
                    logToFile("- Trying: ".concat(testPath));
                    try {
                        if (fs.existsSync(testPath)) {
                            indexPath = testPath;
                            logToFile("\u2713 Found index.html at: ".concat(indexPath, " for deeplink"));
                            break;
                        }
                    }
                    catch (error) {
                        logToFile("Error checking path ".concat(testPath, ": ").concat(error));
                    }
                }
                if (indexPath) {
                    // Use the found path with the register route and token
                    registerUrl_1 = "file://".concat(indexPath, "#/register?token=").concat(token_1);
                    logToFile("Using file URL for deeplink with hash routing: ".concat(registerUrl_1.replace(token_1, token_1.substring(0, 5) + '...')));
                }
                else {
                    logToFile('ERROR: Could not find index.html for deeplink in any of the expected locations');
                    registerUrl_1 = "data:text/html,<html><body><h1>Error: Could not find application files for registration</h1><p>Please reinstall the application.</p></body></html>";
                }
            }
            // Load the URL with a short timeout to ensure everything is initialized properly
            setTimeout(function () {
                if (mainWindow) {
                    logToFile("Actually loading deeplink URL: ".concat(registerUrl_1.replace(token_1, token_1.substring(0, 5) + '...')));
                    mainWindow.loadURL(registerUrl_1).catch(function (err) {
                        logToFile("Error loading deeplink URL: ".concat(err));
                    });
                }
                else {
                    logToFile('Error: mainWindow is null when trying to load deeplink URL');
                }
            }, 100);
        }
        else {
            logToFile('Deep link did not contain valid token or registration path');
        }
    }
    catch (error) {
        logToFile("Failed to parse deep link URL: ".concat(error, ", URL: ").concat(actualUrl));
    }
}
function createWindow() {
    logToFile('Creating main window');
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        // titleBarStyle: 'hiddenInset', // For macOS style
        icon: path.join(__dirname, '../public/logo512.png'),
        show: false, // Don't show until content is loaded
    });
    // Determine the correct path to the index.html file
    var startUrl;
    if (isDev) {
        // In development, use the webpack dev server
        startUrl = 'http://localhost:3000';
        logToFile("Using development server URL: ".concat(startUrl));
    }
    else {
        // In production, check multiple possible paths for the built index.html file
        var indexPath = '';
        var possiblePaths = [
            path.join(__dirname, '../build/index.html'),
            path.join(process.resourcesPath, 'build/index.html'),
            path.join(electron_1.app.getAppPath(), 'build/index.html'),
            path.join(electron_1.app.getPath('exe'), '../Resources/build/index.html'),
        ];
        logToFile('Checking possible paths for index.html:');
        for (var _i = 0, possiblePaths_2 = possiblePaths; _i < possiblePaths_2.length; _i++) {
            var testPath = possiblePaths_2[_i];
            logToFile("- Trying: ".concat(testPath));
            try {
                if (fs.existsSync(testPath)) {
                    indexPath = testPath;
                    logToFile("\u2713 Found index.html at: ".concat(indexPath));
                    break;
                }
            }
            catch (error) {
                logToFile("Error checking path ".concat(testPath, ": ").concat(error));
            }
        }
        if (indexPath) {
            // In production, use the local file path with proper URI encoding
            startUrl = "file://".concat(indexPath);
            // Add hash to ensure the HashRouter works correctly
            if (!startUrl.includes('#')) {
                startUrl = "".concat(startUrl, "#/");
            }
            logToFile("Using file URL for production with hash routing: ".concat(startUrl));
        }
        else {
            logToFile('ERROR: Could not find index.html in any of the expected locations');
            startUrl = "data:text/html,<html><body><h1>Error: Could not find application files</h1><p>Please reinstall the application.</p></body></html>";
        }
    }
    logToFile("Loading app from: ".concat(startUrl));
    logToFile("Current directory: ".concat(__dirname));
    logToFile("App path: ".concat(electron_1.app.getAppPath()));
    logToFile("Resources path: ".concat(process.resourcesPath));
    logToFile("Is development mode: ".concat(isDev));
    // Show window when ready
    mainWindow.once('ready-to-show', function () {
        if (mainWindow) {
            mainWindow.show();
            logToFile('Main window shown');
        }
    });
    // Listen for console logs from renderer process
    mainWindow.webContents.on('console-message', function (event, level, message, line, sourceId) {
        var levelStr = level === 0 ? 'INFO' : level === 1 ? 'WARN' : level === 2 ? 'ERROR' : 'DEBUG';
        logToFile("[Renderer ".concat(levelStr, "]: ").concat(message));
    });
    // Handle window load errors with more detailed information
    mainWindow.webContents.on('did-fail-load', function (event, errorCode, errorDescription, validatedURL) {
        logToFile("Failed to load app window: ".concat(errorCode, " ").concat(errorDescription, " (URL: ").concat(validatedURL, ")"));
        // Try to load a simple HTML page as a fallback in production
        if (!isDev && mainWindow) {
            var errorHtml = "\n        <html>\n          <head>\n            <title>RedButton - Error</title>\n            <style>\n              body {\n                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\n                padding: 20px;\n                background: #111827;\n                color: white;\n                line-height: 1.5;\n              }\n              h1 { color: #f43f5e; }\n              pre {\n                background: #1F2937;\n                padding: 15px;\n                border-radius: 4px;\n                overflow: auto;\n                max-width: 100%;\n                font-size: 13px;\n              }\n              .info { \n                margin-top: 20px;\n                border-top: 1px solid #374151;\n                padding-top: 15px;\n              }\n            </style>\n          </head>\n          <body>\n            <h1>Failed to load the application</h1>\n            <p>Error: ".concat(errorDescription, " (").concat(errorCode, ")</p>\n            <p>URL: ").concat(validatedURL, "</p>\n            <p>Please try restarting the application.</p>\n            <div class=\"info\">\n              <p><strong>Diagnostic Information:</strong></p>\n              <pre>\nApp path: ").concat(electron_1.app.getAppPath(), "\nResource path: ").concat(process.resourcesPath, "\nCurrent directory: ").concat(__dirname, "\nIs dev: ").concat(isDev, "\nELECTRON_IS_DEV: ").concat(process.env.ELECTRON_IS_DEV, "\nNODE_ENV: ").concat(process.env.NODE_ENV, "\nPlatform: ").concat(process.platform, "\nArch: ").concat(process.arch, "\n              </pre>\n              <p>Check the logs at: ").concat(logFilePath, "</p>\n            </div>\n          </body>\n        </html>\n      ");
            logToFile('Loading error page as fallback');
            mainWindow.loadURL("data:text/html;charset=utf-8,".concat(encodeURIComponent(errorHtml)));
        }
    });
    // Load the URL with a short timeout to ensure everything is initialized properly
    setTimeout(function () {
        if (mainWindow) {
            logToFile("Actually loading URL: ".concat(startUrl));
            mainWindow.loadURL(startUrl).catch(function (err) {
                logToFile("Error loading URL: ".concat(err));
            });
        }
        else {
            logToFile('Error: mainWindow is null when trying to load URL');
        }
    }, 100);
    // Enable DevTools in all environments for troubleshooting
    mainWindow.webContents.on('devtools-opened', function () {
        var devToolsOpened = new Date().toISOString();
        logToFile("DevTools opened at ".concat(devToolsOpened, " - keeping open for debugging purposes"));
    });
    mainWindow.on('closed', function () {
        logToFile('Main window closed');
        mainWindow = null;
    });
    // Handle page refreshes by detecting when the main window is reloaded
    mainWindow.webContents.on('did-finish-load', function () {
        logToFile('Main window finished loading');
        // If a timer is running, send the current status to the newly loaded page
        if (timerStatus.isRunning && timerInterval) {
            logToFile('Page refreshed while timer running, syncing timer status');
            setTimeout(function () {
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
function checkTrayIconStatus() {
    logToFile('Checking tray icon status');
    // If tray is null, it hasn't been created yet
    if (!tray) {
        logToFile('Tray icon not created yet');
        return { visible: false, error: 'TRAY_NOT_CREATED' };
    }
    try {
        // Check if the tray icon has bounds (this indicates it's visible in some way)
        var bounds = tray.getBounds();
        logToFile('Tray icon bounds: ' + JSON.stringify(bounds));
        // If the bounds have zero width or height, the icon might not be visible
        if (bounds.width === 0 || bounds.height === 0) {
            logToFile('Tray icon has zero width or height');
            return { visible: false, error: 'TRAY_ZERO_SIZE' };
        }
        // On macOS, check if the icon is in the menu bar area
        if (process.platform === 'darwin') {
            var primaryDisplay = electron_1.screen.getPrimaryDisplay();
            var x = bounds.x, y = bounds.y;
            // Check if the tray icon is in the top menu bar area (y near 0)
            if (y > 50) { // If y is significantly below the menu bar
                logToFile('Tray icon not in expected menu bar position');
                return { visible: false, error: 'TRAY_POSITION_UNEXPECTED' };
            }
        }
        // Seems to be visible
        logToFile('Tray icon appears to be visible');
        return { visible: true };
    }
    catch (error) {
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
    emotionWindow = new electron_1.BrowserWindow({
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
    // Determine the correct URL for the widget
    var widgetUrl;
    var indexPath = '';
    if (isDev) {
        widgetUrl = 'http://localhost:3000/#/widget';
        logToFile("Using development widget URL: ".concat(widgetUrl));
    }
    else {
        // Find the index.html file using the same logic as for the main window
        var possiblePaths = [
            path.join(__dirname, '../build/index.html'),
            path.join(process.resourcesPath, 'build/index.html'),
            path.join(electron_1.app.getAppPath(), 'build/index.html'),
            path.join(electron_1.app.getPath('exe'), '../Resources/build/index.html'),
        ];
        logToFile('Checking possible paths for widget index.html:');
        for (var _i = 0, possiblePaths_3 = possiblePaths; _i < possiblePaths_3.length; _i++) {
            var testPath = possiblePaths_3[_i];
            try {
                if (fs.existsSync(testPath)) {
                    indexPath = testPath;
                    logToFile("Found widget index.html at: ".concat(indexPath));
                    break;
                }
            }
            catch (error) {
                logToFile("Error checking widget path ".concat(testPath, ": ").concat(error));
            }
        }
        if (indexPath) {
            // Important: Use hash routing in the URL
            widgetUrl = "file://".concat(indexPath, "#/widget");
            logToFile("Using widget URL with hash routing: ".concat(widgetUrl));
        }
        else {
            logToFile('ERROR: Could not find index.html for widget');
            widgetUrl = "data:text/html,<html><body><h1>Error: Could not find widget files</h1></body></html>";
        }
    }
    logToFile("Loading widget from: ".concat(widgetUrl));
    // Listen for console logs from widget window
    emotionWindow.webContents.on('console-message', function (event, level, message, line, sourceId) {
        var levelStr = level === 0 ? 'INFO' : level === 1 ? 'WARN' : level === 2 ? 'ERROR' : 'DEBUG';
        logToFile("[Widget ".concat(levelStr, "]: ").concat(message));
    });
    // Handle window load errors
    emotionWindow.webContents.on('did-fail-load', function (event, errorCode, errorDescription) {
        logToFile("Failed to load widget window: ".concat(errorCode, " ").concat(errorDescription));
    });
    // Load the widget with error handling
    if (emotionWindow) {
        emotionWindow.loadURL(widgetUrl).catch(function (err) {
            logToFile("Error loading widget URL: ".concat(err));
            // Try a fallback approach if loading fails
            var fallbackHtml = "\n        <html>\n          <head>\n            <title>RedButton Widget</title>\n            <style>\n              body {\n                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n                background: transparent;\n                color: white;\n                text-align: center;\n                padding: 20px;\n              }\n            </style>\n          </head>\n          <body>\n            <h3>Widget Failed to Load</h3>\n            <p>Please restart the application</p>\n          </body>\n        </html>\n      ";
            if (emotionWindow) {
                emotionWindow.loadURL("data:text/html;charset=utf-8,".concat(encodeURIComponent(fallbackHtml)));
            }
        });
    }
    else {
        logToFile('Error: emotionWindow is null when trying to load URL');
    }
    // In development, enable DevTools
    if (isDev) {
        emotionWindow.webContents.on('did-finish-load', function () {
            if (emotionWindow) {
                logToFile('Opened DevTools for widget (development mode)');
            }
        });
    }
    // In development, public folder is at project root
    // In production, public files are copied to build folder
    var publicPath = isDev
        ? path.join(__dirname, '../../public/')
        : path.join(process.resourcesPath, 'public/');
    logToFile("Using public path: ".concat(publicPath));
    var menubarIconPath = path.join(publicPath, 'menubar-icon.png');
    logToFile("Looking for menubar icon at: ".concat(menubarIconPath));
    var trayIcon;
    try {
        trayIcon = electron_1.nativeImage.createFromPath(menubarIconPath);
        if (trayIcon.isEmpty()) {
            logToFile('Loaded tray icon is empty, trying fallback location');
            var fallbackPath = path.join(__dirname, '../public/menubar-icon.png');
            logToFile("Trying fallback path: ".concat(fallbackPath));
            trayIcon = electron_1.nativeImage.createFromPath(fallbackPath);
            if (trayIcon.isEmpty()) {
                logToFile('Fallback tray icon is also empty, using default icon');
            }
            else {
                logToFile('Successfully loaded fallback tray icon');
            }
        }
        else {
            logToFile('Successfully loaded tray icon');
        }
    }
    catch (error) {
        logToFile("Error loading tray icon: ".concat(error));
        // Create a default icon as fallback
        trayIcon = electron_1.nativeImage.createEmpty();
    }
    // Store the original icon for later
    originalTrayIcon = trayIcon.isEmpty() ? trayIcon : trayIcon.resize({ width: 22, height: 22 });
    // Create the tray icon
    tray = new electron_1.Tray(originalTrayIcon);
    tray.setToolTip('RedButton');
    logToFile('Tray icon created');
    // Check tray icon status and log it
    var trayStatus = checkTrayIconStatus();
    logToFile('Initial tray icon status: ' + JSON.stringify(trayStatus));
    // If the tray icon might not be visible, send notification to the main window
    if (!trayStatus.visible && mainWindow) {
        mainWindow.webContents.send('tray-icon-status-update', trayStatus);
    }
    // We'll position the window above the tray icon when clicked
    tray.on('click', function (event, bounds) {
        if (emotionWindow && emotionWindow.isVisible()) {
            emotionWindow.hide();
            logToFile('Hiding emotion window on tray click');
        }
        else if (emotionWindow) {
            var x = bounds.x, y = bounds.y;
            // Position differs based on platform
            if (process.platform === 'darwin') {
                // On macOS, position it below the menu bar icon
                emotionWindow.setPosition(x - 150 + bounds.width / 2, y + bounds.height);
            }
            else {
                // On Windows/Linux, position it above the system tray
                emotionWindow.setPosition(x - 150 + bounds.width / 2, y - 400);
            }
            emotionWindow.show();
            emotionWindow.focus();
            logToFile('Showing emotion window on tray click');
        }
    });
    // Close the emotion window when clicked outside
    emotionWindow.on('blur', function () {
        if (emotionWindow) {
            emotionWindow.hide();
            logToFile('Hiding emotion window on blur');
        }
    });
    // Handle IPC messages from the emotion window
    electron_1.ipcMain.on('show-main-window', function (event, page) {
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
                    electron_1.app.dock.show();
                    electron_1.app.focus({ steal: true });
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
        }
        else {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
                // Navigate to specific page if provided
                if (page) {
                    logToFile("Navigating to page: ".concat(page));
                    // Construct the URL to navigate to
                    var pageUrl = void 0;
                    if (isDev) {
                        // In development, use the webpack dev server with hash routing
                        pageUrl = "http://localhost:3000/#/".concat(page);
                    }
                    else {
                        // In production, find the index.html path again
                        var indexPath_1 = '';
                        var possiblePaths = [
                            path.join(__dirname, '../build/index.html'),
                            path.join(process.resourcesPath, 'build/index.html'),
                            path.join(electron_1.app.getAppPath(), 'build/index.html'),
                            path.join(electron_1.app.getPath('exe'), '../Resources/build/index.html'),
                        ];
                        for (var _i = 0, possiblePaths_4 = possiblePaths; _i < possiblePaths_4.length; _i++) {
                            var testPath = possiblePaths_4[_i];
                            try {
                                if (fs.existsSync(testPath)) {
                                    indexPath_1 = testPath;
                                    break;
                                }
                            }
                            catch (error) {
                                logToFile("Error checking path while navigating: ".concat(error));
                            }
                        }
                        if (indexPath_1) {
                            // Use file URL with hash routing to specific page
                            pageUrl = "file://".concat(indexPath_1, "#/").concat(page);
                        }
                        else {
                            logToFile('ERROR: Could not find index.html for navigation');
                            // Fall back to showing the window without navigation
                            pageUrl = null;
                        }
                    }
                    // Navigate to the page if URL was constructed successfully
                    if (pageUrl) {
                        mainWindow.loadURL(pageUrl).catch(function (err) {
                            logToFile("Error navigating to page ".concat(page, ": ").concat(err));
                        });
                    }
                }
                // On macOS, explicitly bring to front
                if (process.platform === 'darwin') {
                    electron_1.app.dock.show();
                    electron_1.app.focus({ steal: true });
                }
            }
        }
    });
    electron_1.ipcMain.on('select-emotion', function (event, data) {
        // Send the selected emotion to the main window
        if (mainWindow) {
            mainWindow.webContents.send('emotion-selected', data);
            mainWindow.show();
            mainWindow.focus();
            // On macOS, explicitly bring to front
            if (process.platform === 'darwin') {
                electron_1.app.dock.show();
                electron_1.app.focus({ steal: true });
            }
        }
        // Hide the emotion window
        if (emotionWindow) {
            emotionWindow.hide();
        }
    });
    // Handle window resize requests
    electron_1.ipcMain.on('resize-window', function (event, _a) {
        var width = _a.width, height = _a.height;
        if (emotionWindow) {
            emotionWindow.setSize(width, height);
            console.log("RESIZED WINDOW", width, height);
            // Adjust position after resize if needed
            if (emotionWindow.isVisible()) {
                var bounds = tray === null || tray === void 0 ? void 0 : tray.getBounds();
                if (bounds) {
                    if (process.platform === 'darwin') {
                        emotionWindow.setPosition(bounds.x - (width / 2) + (bounds.width / 2), bounds.y + bounds.height);
                    }
                    else {
                        emotionWindow.setPosition(bounds.x - (width / 2) + (bounds.width / 2), bounds.y - height);
                    }
                }
            }
        }
    });
    // Timer-related IPC handlers
    electron_1.ipcMain.on('start-timer', function (event, status) {
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
        console.log("Timer initiated for ".concat(timerStatus.totalMinutes, " minutes: ").concat(timerStatus.activity));
    });
    electron_1.ipcMain.on('stop-timer', function () {
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
    timerInterval = setInterval(function () {
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
        }
        else {
            // Timer completed
            timerCompleted();
        }
    }, 1000);
    console.log("Timer started for ".concat(timerStatus.totalMinutes, " minutes: ").concat(timerStatus.activity));
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
    if (!tray)
        return;
    // Format remaining time
    var minutes = Math.floor(timerStatus.remainingSeconds / 60);
    var seconds = timerStatus.remainingSeconds % 60;
    var timeString = "".concat(minutes, ":").concat(seconds.toString().padStart(2, '0'));
    if (timerStatus.isRunning) {
        // Create a custom overlay for the tray icon to show it's a timer
        tray.setToolTip("Timer: ".concat(timeString, " - Activity: ").concat(timerStatus.activity));
        // For macOS, ensure the title is clearly set to show the timer
        if (process.platform === 'darwin') {
            // Use a more visible timer emoji and format with bold text to ensure visibility
            var timerEmoji = Math.floor(timerStatus.remainingSeconds / 2) % 2 === 0 ? '⏱️' : '⏰';
            // Ensure we set a title that's clearly visible
            var visibleTitle = "".concat(timerEmoji, " ").concat(timeString);
            tray.setTitle(visibleTitle);
            // Log the title change to ensure it's working
            if (timerStatus.remainingSeconds === timerStatus.totalMinutes * 60 - 1 ||
                timerStatus.remainingSeconds % 10 === 0) {
                console.log("Set macOS menu bar title to: \"".concat(visibleTitle, "\""));
            }
        }
        else {
            // On Windows/Linux, update tooltip with more visible info
            tray.setToolTip("\u23F1\uFE0F TIMER (".concat(timeString, ") - ").concat(timerStatus.activity));
        }
        if (timerStatus.remainingSeconds % 10 === 0) {
            console.log("Timer running: ".concat(timeString, " - ").concat(timerStatus.activity));
        }
    }
    else {
        // Reset the tray icon to default
        resetTrayIcon();
    }
}
function timerCompleted() {
    console.log('⏰⏰⏰ TIMER COMPLETED:', timerStatus.activity, '⏰⏰⏰');
    // Stop the timer but keep the status for notification
    var completedActivity = timerStatus.activity;
    var completedMinutes = timerStatus.totalMinutes;
    var completedEmotionName = timerStatus.emotionName;
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
        var notification = new electron_1.Notification({
            title: 'Timer Completed!',
            body: "You completed \"".concat(completedActivity, "\" (").concat(completedMinutes, " minutes)"),
            silent: false // This should trigger the system sound
        });
        notification.show();
        // When the notification is clicked, show the main window
        notification.on('click', function () {
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
    var isVisible = true;
    var flashCount = 0;
    var MAX_FLASHES = 10; // 5 seconds (10 * 500ms)
    // Add a click handler to stop flashing when icon is clicked
    if (tray) {
        // Save original click handler for restoration later
        if (tray.listeners('click').length > 0) {
            originalTrayClickHandler = tray.listeners('click')[0];
        }
        // Remove existing click handlers temporarily
        tray.removeAllListeners('click');
        // Add new click handler that stops flashing and then calls the original handler
        tray.on('click', function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
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
                originalTrayClickHandler.apply(void 0, args);
            }
        });
    }
    flashingInterval = setInterval(function () {
        if (!tray || !originalTrayIcon)
            return;
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
            }
            else {
                tray.setTitle("\u2705 COMPLETED!");
                tray.setToolTip("Activity \"".concat(timerStatus.activity, "\" completed - Click to record in journal"));
            }
        }
        else {
            // On Windows/Linux, flash using tooltip changes
            if (isVisible) {
                tray.setImage(originalTrayIcon);
                tray.setToolTip('RedButton - Timer completed!');
            }
            else {
                tray.setToolTip("\u2705 COMPLETED: ".concat(timerStatus.activity, " - Click to record in journal"));
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
        tray.on('click', originalTrayClickHandler);
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
    setTimeout(function () {
        logToFile('Running scheduled tray icon status check');
        var status = checkTrayIconStatus();
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
        }
        else {
            logToFile('Tray icon appears to be visible in delayed check');
        }
    }, 5000); // Check after 5 seconds
}
// Handle app ready
electron_1.app.whenReady().then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
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
        logToFile("Checking command line args for deep links: ".concat(process.argv.join(', ')));
        handleDeepLink(process.argv);
        electron_1.app.on('activate', function () {
            logToFile('Activate event fired');
            // On macOS it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                logToFile('No windows found, creating new window');
                createWindow();
            }
            else {
                logToFile("Windows exist (count: ".concat(electron_1.BrowserWindow.getAllWindows().length, "), focusing existing window"));
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });
        // Handle the open-url event for deep linking (macOS)
        electron_1.app.on('open-url', function (event, url) {
            event.preventDefault();
            logToFile("open-url event with URL: ".concat(url));
            handleDeepLink([url]);
        });
        // Add the tray status check after window creation
        checkTrayStatusAfterStartup();
        // Add this handler:
        electron_1.ipcMain.handle('check-tray-icon', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, checkTrayIconStatus()];
            });
        }); });
        return [2 /*return*/];
    });
}); }).catch(function (error) {
    logToFile("Error during app startup: ".concat(error));
});
// Handle app will-quit
electron_1.app.on('will-quit', function () {
    logToFile('will-quit event fired');
    if (tray) {
        tray.destroy();
        logToFile('Tray destroyed');
    }
});
// Quit when all windows are closed, except on macOS.
electron_1.app.on('window-all-closed', function () {
    logToFile('window-all-closed event fired');
    if (process.platform !== 'darwin') {
        logToFile('Not on macOS, quitting app');
        electron_1.app.quit();
    }
    else {
        logToFile('On macOS, app remains running');
    }
});
// Setup IPC handlers
function setupIPC() {
    logToFile('Setting up IPC handlers');
    // Handle setting the tray icon to the emotion image
    electron_1.ipcMain.on('set-emotion-image', function (_event, base64Image) {
        logToFile('Received set-emotion-image IPC request');
        try {
            if (!base64Image || !tray) {
                logToFile('Invalid emotion image or tray not initialized');
                return;
            }
            // Create image from base64
            var imageBuffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
            var image = electron_1.nativeImage.createFromBuffer(imageBuffer);
            // Resize for tray icon
            var resizedImage = image.resize({ width: 22, height: 22 });
            // Set as tray icon
            if (tray) {
                tray.setImage(resizedImage);
                logToFile('Tray icon updated with emotion image');
            }
            else {
                logToFile('Tray is not initialized, cannot update icon');
            }
        }
        catch (error) {
            logToFile("Error setting emotion image: ".concat(error));
        }
    });
    // Handle resetting the tray icon back to the original
    electron_1.ipcMain.on('reset-emotion-image', function () {
        logToFile('Received reset-emotion-image IPC request');
        try {
            if (tray && originalTrayIcon) {
                tray.setImage(originalTrayIcon);
                logToFile('Tray icon reset to original');
            }
            else {
                logToFile('Tray or original icon not initialized, cannot reset');
            }
        }
        catch (error) {
            logToFile("Error resetting emotion image: ".concat(error));
        }
    });
    // Handle the open-window request
    electron_1.ipcMain.on('open-window', function () {
        logToFile('Received open-window IPC request');
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
                logToFile('Main window restored from minimized state');
            }
            mainWindow.show();
            mainWindow.focus();
            logToFile('Main window shown and focused');
        }
        else {
            logToFile('Main window is not initialized, cannot open');
            createWindow(); // Try to recreate the window if it doesn't exist
            logToFile('Attempted to recreate the main window');
        }
    });
}
// IPC handlers
electron_1.ipcMain.handle('save-data', function (event, data) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // In a real app, you would save this to a file or database
        // For now, just log it
        console.log('Saving data:', data);
        return [2 /*return*/, { success: true }];
    });
}); });
electron_1.ipcMain.handle('get-data', function (event) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        // In a real app, you would load from a file or database
        // For now, return dummy data
        return [2 /*return*/, { success: true, data: {} }];
    });
}); });
//# sourceMappingURL=main.js.map