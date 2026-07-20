const { app, BrowserWindow, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const {
  DEV_RENDERER_ORIGIN,
  isAllowedExternalUrl,
  isAllowedNavigationUrl,
} = require('./securityPolicy');
const { startStaticRendererServer } = require('./staticServer');

const PRODUCTION_RENDERER_MODE = 'production';
let staticRendererServer = null;

function shouldUseProductionRenderer() {
  return (
    app.isPackaged ||
    process.env.CROPVISION_DESKTOP_RENDERER_MODE === PRODUCTION_RENDERER_MODE
  );
}

function getRendererRoot() {
  return path.join(__dirname, '..', 'dist');
}

function configureNavigationPolicy(win, rendererTarget) {
  win.webContents.on('will-navigate', (event, url) => {
    if (
      !isAllowedNavigationUrl(url, {
        isPackaged: rendererTarget.isProduction,
        trustedRendererOrigin: rendererTarget.trustedOrigin,
      })
    ) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) {
      shell.openExternal(url).catch(() => {});
    }

    return { action: 'deny' };
  });
}

function getUnavailableRendererUrl() {
  return (
    'data:text/html;charset=utf-8,' +
    encodeURIComponent(
      '<!doctype html><title>CropVision Desktop</title><h1>Renderer unavailable</h1><p>No exported renderer was found. Run npm run export:web before starting production renderer mode.</p>'
    )
  );
}

async function getRendererTarget() {
  if (!shouldUseProductionRenderer()) {
    return {
      isProduction: false,
      trustedOrigin: null,
      url: DEV_RENDERER_ORIGIN,
    };
  }

  const rendererRoot = getRendererRoot();

  if (!fs.existsSync(path.join(rendererRoot, 'index.html'))) {
    return {
      isProduction: true,
      trustedOrigin: null,
      url: getUnavailableRendererUrl(),
    };
  }

  if (!staticRendererServer) {
    staticRendererServer = await startStaticRendererServer(rendererRoot);
  }

  return {
    isProduction: true,
    trustedOrigin: staticRendererServer.origin,
    url: staticRendererServer.origin,
  };
}

async function createWindow() {
  const rendererTarget = await getRendererTarget();
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  configureNavigationPolicy(win, rendererTarget);
  await win.loadURL(rendererTarget.url);
}

async function stopStaticRendererServer() {
  const server = staticRendererServer;
  staticRendererServer = null;

  if (server) {
    await server.close();
  }
}

app.whenReady().then(async () => {
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch((error) => {
        console.error('[Electron] Failed to recreate renderer:', error.message);
        app.quit();
      });
    }
  });
}).catch((error) => {
  console.error('[Electron] Failed to start renderer:', error.message);
  app.quit();
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await stopStaticRendererServer();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopStaticRendererServer().catch(() => {});
});
