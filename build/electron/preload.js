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
    }
});
//# sourceMappingURL=preload.js.map