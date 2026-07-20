export function normalizeApiError(error, fallbackMessage) {
  const data = error?.data || {};

  return {
    status: error?.status ?? null,
    code: data.code ?? null,
    message: data.message || error?.message || fallbackMessage,
    details: data.details ?? null,
    latestPublicationVersion: data.latestPublicationVersion ?? null,
    requiresReload: data.requiresReload ?? false,
    requiresManualSetup: data.requiresManualSetup ?? false,
  };
}
