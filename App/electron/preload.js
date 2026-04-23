const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe API to the renderer (React/Expo app)
// This serves two purposes:
// 1. Gives the React app a reliable way to know it's inside Electron (detectPlatform)
// 2. Provides future capabilities to communicate with the native OS filesystem/hardware
contextBridge.exposeInMainWorld('electronAPI', {
  platform: 'electron',
  // Example of future hook:
  // selectLocalFile: () => ipcRenderer.invoke('dialog:openFile')
});
