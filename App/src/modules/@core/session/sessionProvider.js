let tokenProvider = () => null;

export function setSessionTokenProvider(provider) {
  if (provider !== null && typeof provider !== 'function') {
    throw new TypeError('Session token provider must be a function or null');
  }
  tokenProvider = provider ?? (() => null);
}

export function getSessionToken() {
  return tokenProvider() ?? null;
}
