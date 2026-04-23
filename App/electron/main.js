const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (app.isPackaged) {
    // Phase 4 strategy: Web proxy to live Vercel URL
    win.loadURL('https://cropvision.vercel.app/'); // Set this to actual Vercel URL later
    // Alternatively, offline fallback: win.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    // Expo Router local dev server runs on 8081 usually
    win.loadURL('http://localhost:8081');
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});