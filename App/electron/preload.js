const { contextBridge } = require('electron');

const electronAPI = Object.freeze({
  platform: 'electron',
});

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
