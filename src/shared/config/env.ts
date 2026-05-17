const DEFAULT_ADMIN_API_BASE_URL = "/api/v1";

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isSupportedBaseUrl(value: string) {
  return value.startsWith("/") || /^https?:\/\//.test(value);
}

function resolveAdminApiBaseUrl() {
  const configuredValue = import.meta.env.VITE_ADMIN_API_BASE_URL?.trim();
  const baseUrl = normalizeBaseUrl(configuredValue || DEFAULT_ADMIN_API_BASE_URL);

  if (!isSupportedBaseUrl(baseUrl)) {
    throw new Error("VITE_ADMIN_API_BASE_URL must be an absolute http(s) URL or root-relative path.");
  }

  return baseUrl;
}

export const runtimeEnv = Object.freeze({
  adminApiBaseUrl: resolveAdminApiBaseUrl()
});
