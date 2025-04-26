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
    // Create the menu bar widget
    createMenuBarWidget();
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
    // Create the tray icon
    tray = new electron_1.Tray(trayIcon.resize({ width: 22, height: 22 }));
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
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // On macOS, explicitly bring to front
            if (process.platform === 'darwin') {
                electron_1.app.dock.show();
                electron_1.app.focus({ steal: true });
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