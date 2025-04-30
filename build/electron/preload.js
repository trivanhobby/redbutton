"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Preload script
var electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electron', {
    saveData: function (data) { return electron_1.ipcRenderer.invoke('save-data', data); },
    getData: function () { return electron_1.ipcRenderer.invoke('get-data'); },
    showMainWindow: function () { return electron_1.ipcRenderer.send('show-main-window'); },
    selectEmotion: function (data) {
        electron_1.ipcRenderer.send('select-emotion', data);
    },
    onEmotionSelected: function (callback) {
        electron_1.ipcRenderer.on('emotion-selected', function (_, data) { return callback(data); });
        return function () {
            electron_1.ipcRenderer.removeAllListeners('emotion-selected');
        };
    },
    resizeWindow: function (width, height) {
        electron_1.ipcRenderer.send('resize-window', { width: width, height: height });
    },
    // Timer functions
    startTimer: function (timerStatus) {
        electron_1.ipcRenderer.send('start-timer', timerStatus);
        // Create and dispatch a custom event when timer is started
        electron_1.ipcRenderer.once('timer-started', function (_, data) {
            console.log('Timer started confirmed by main process:', data);
            var event = new CustomEvent('timer-started', { detail: data });
            document.dispatchEvent(event);
        });
    },
    onTimerUpdate: function (callback) {
        electron_1.ipcRenderer.on('timer-update', function (_, data) { return callback(data); });
        return function () {
            electron_1.ipcRenderer.removeAllListeners('timer-update');
        };
    },
    stopTimer: function () {
        electron_1.ipcRenderer.send('stop-timer');
    },
    // Timer journal entry function
    onTimerJournalEntry: function (callback) {
        electron_1.ipcRenderer.on('timer-journal-entry', function (_, data) { return callback(data); });
        return function () {
            electron_1.ipcRenderer.removeAllListeners('timer-journal-entry');
        };
    }
});
//# sourceMappingURL=preload.js.map