const DEV_RENDERER_ORIGIN = 'http://localhost:8081';
const LOCAL_RENDERER_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const LOCAL_RENDERER_PORT = '8081';
const BLOCKED_PROTOCOLS = new Set(['file:', 'javascript:', 'data:', 'vbscript:']);

function parseUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch (error) {
    return null;
  }
}

function isLocalRendererUrl(rawUrl) {
  const url = parseUrl(rawUrl);

  if (!url) {
    return false;
  }

  return (
    url.protocol === 'http:' &&
    LOCAL_RENDERER_HOSTS.has(url.hostname) &&
    url.port === LOCAL_RENDERER_PORT
  );
}

function isTrustedRendererUrl(rawUrl, trustedRendererOrigin) {
  const url = parseUrl(rawUrl);
  const trustedOrigin = parseUrl(trustedRendererOrigin);

  if (
    !url ||
    !trustedOrigin ||
    trustedOrigin.protocol !== 'http:' ||
    trustedOrigin.hostname !== '127.0.0.1'
  ) {
    return false;
  }

  return url.origin === trustedOrigin.origin;
}

function isAllowedNavigationUrl(
  rawUrl,
  { isPackaged = false, trustedRendererOrigin = null } = {}
) {
  if (trustedRendererOrigin) {
    return isTrustedRendererUrl(rawUrl, trustedRendererOrigin);
  }

  if (isPackaged) {
    return false;
  }

  return isLocalRendererUrl(rawUrl);
}

function isAllowedExternalUrl(rawUrl) {
  const url = parseUrl(rawUrl);

  if (!url || BLOCKED_PROTOCOLS.has(url.protocol)) {
    return false;
  }

  return url.protocol === 'https:';
}

module.exports = {
  DEV_RENDERER_ORIGIN,
  isAllowedExternalUrl,
  isAllowedNavigationUrl,
  isLocalRendererUrl,
  isTrustedRendererUrl,
};
