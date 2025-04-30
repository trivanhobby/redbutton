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
var isDev = __importStar(require("electron-is-dev"));
var mainWindow = null;
var tray = null;
var emotionWindow = null;
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
function createWindow() {
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
        titleBarStyle: 'hiddenInset', // For macOS style
        icon: path.join(__dirname, '../public/logo512.png'),
    });
    // Load the app
    var startUrl = isDev
        ? 'http://localhost:3000'
        : "file://".concat(path.join(__dirname, '../build/index.html'));
    mainWindow.loadURL(startUrl);
    // Open DevTools in development
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
    // Handle page refreshes by detecting when the main window is reloaded
    mainWindow.webContents.on('did-finish-load', function () {
        // If a timer is running, send the current status to the newly loaded page
        if (timerStatus.isRunning && timerInterval) {
            console.log('Page refreshed while timer running, syncing timer status');
            setTimeout(function () {
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
    var startUrl = isDev
        ? 'http://localhost:3000/#/widget'
        : "file://".concat(path.join(__dirname, '../build/index.html#/widget'));
    emotionWindow.loadURL(startUrl);
    // In development, public folder is at project root
    // In production, public files are copied to build folder
    var publicPath = isDev
        ? path.join(__dirname, '../../public/')
        : path.join(__dirname, '../public/');
    var trayIcon = electron_1.nativeImage.createFromPath(path.join(publicPath, 'menubar-icon.png'));
    // Store the original icon for later
    originalTrayIcon = trayIcon.resize({ width: 22, height: 22 });
    // Create the tray icon
    tray = new electron_1.Tray(originalTrayIcon);
    tray.setToolTip('RedButton');
    // We'll position the window above the tray icon when clicked
    tray.on('click', function (event, bounds) {
        if (emotionWindow && emotionWindow.isVisible()) {
            emotionWindow.hide();
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
        }
    });
    // Close the emotion window when clicked outside
    emotionWindow.on('blur', function () {
        if (emotionWindow) {
            emotionWindow.hide();
        }
    });
    // Handle IPC messages from the emotion window
    electron_1.ipcMain.on('show-main-window', function () {
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
electron_1.app.on('ready', createWindow);
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
// Clean up resources before quitting
electron_1.app.on('will-quit', function () {
    stopTimer();
    stopFlashingIcon();
});
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