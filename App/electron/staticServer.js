const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const RENDERER_HOST = '127.0.0.1';
const CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.geojson', 'application/geo+json; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.ttf', 'font/ttf'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function isPathInside(rootPath, candidatePath) {
  return (
    candidatePath === rootPath ||
    candidatePath.startsWith(rootPath + path.sep)
  );
}

function decodeRequestPath(requestUrl) {
  const rawPath = (requestUrl || '/').split('?', 1)[0];

  try {
    return decodeURIComponent(rawPath).replace(/\\/g, '/');
  } catch (error) {
    return null;
  }
}

async function resolveFile(rootPath, indexPath, requestUrl) {
  const requestPath = decodeRequestPath(requestUrl);

  if (!requestPath || requestPath.includes('\0')) {
    return { status: 400 };
  }

  if (requestPath.split('/').includes('..')) {
    return { status: 403 };
  }

  const relativePath = requestPath.replace(/^\/+/, '') || 'index.html';
  const candidatePath = path.resolve(rootPath, relativePath);

  if (!isPathInside(rootPath, candidatePath)) {
    return { status: 403 };
  }

  try {
    const stats = await fs.promises.stat(candidatePath);

    if (stats.isFile()) {
      const realPath = await fs.promises.realpath(candidatePath);
      return isPathInside(rootPath, realPath)
        ? { status: 200, filePath: realPath, stats }
        : { status: 403 };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (path.extname(requestPath)) {
    return { status: 404 };
  }

  const routePath = `${candidatePath}.html`;

  try {
    const routeStats = await fs.promises.stat(routePath);

    if (routeStats.isFile()) {
      const realPath = await fs.promises.realpath(routePath);
      return isPathInside(rootPath, realPath)
        ? { status: 200, filePath: realPath, stats: routeStats }
        : { status: 403 };
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const stats = await fs.promises.stat(indexPath);
  return { status: 200, filePath: indexPath, stats };
}

function sendText(res, status, message) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(message),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(message);
}

async function serveRequest(rootPath, indexPath, req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    sendText(res, 405, 'Method Not Allowed');
    return;
  }

  const result = await resolveFile(rootPath, indexPath, req.url);

  if (result.status !== 200) {
    sendText(res, result.status, http.STATUS_CODES[result.status] || 'Error');
    return;
  }

  res.writeHead(200, {
    'Content-Type':
      CONTENT_TYPES.get(path.extname(result.filePath).toLowerCase()) ||
      'application/octet-stream',
    'Content-Length': result.stats.size,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  fs.createReadStream(result.filePath).pipe(res);
}

async function startStaticRendererServer(rootDir) {
  const rootPath = await fs.promises.realpath(rootDir);
  const indexPath = path.join(rootPath, 'index.html');
  const indexStats = await fs.promises.stat(indexPath);

  if (!indexStats.isFile()) {
    throw new Error(`Renderer entry is not a file: ${indexPath}`);
  }

  const server = http.createServer((req, res) => {
    serveRequest(rootPath, indexPath, req, res).catch(() => {
      if (!res.headersSent) {
        sendText(res, 500, 'Internal Server Error');
      } else {
        res.destroy();
      }
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, RENDERER_HOST, resolve);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;

  if (!port) {
    server.close();
    throw new Error('Static renderer server did not receive a TCP port');
  }

  return {
    host: RENDERER_HOST,
    origin: `http://${RENDERER_HOST}:${port}`,
    port,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

module.exports = {
  RENDERER_HOST,
  startStaticRendererServer,
};
