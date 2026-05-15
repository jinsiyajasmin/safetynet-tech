/**
 * Base URL for backend HTTP (no trailing slash).
 * - `npm run dev`: same origin + Vite proxy → /api and /uploads hit localhost:4000.
 * - Docker/nginx: VITE_USE_RELATIVE_API → same origin; nginx proxies to the backend service.
 */
export function getBackendOrigin() {
  if (typeof window === "undefined") {
    return import.meta.env.VITE_BACKEND_URL || "https://api.site-mateai.co.uk";
  }

  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  const useRelative =
    import.meta.env.VITE_USE_RELATIVE_API === "true" ||
    import.meta.env.VITE_USE_RELATIVE_API === "1";

  if (useRelative) {
    return window.location.origin;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "[::1]" ||
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/.test(
      window.location.hostname
    );

  if (isLocalhost) {
    return "http://localhost:4000";
  }

  return import.meta.env.VITE_BACKEND_URL || "https://api.site-mateai.co.uk";
}
