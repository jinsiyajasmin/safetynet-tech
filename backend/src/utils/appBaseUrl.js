const LOCAL_DEV_FALLBACK = "http://localhost:8080";

const PRODUCTION_URL_HINT =
  "Set APP_URL (or BASE_URL, ALLOWED_ORIGINS, or Coolify SERVICE_URL_*) to your public SPA origin, e.g. APP_URL=https://site-mateai.co.uk";

/**
 * Canonical public URL of the SPA (no trailing slash).
 * Priority: APP_URL → BASE_URL → FRONTEND_URL → ALLOWED_ORIGINS → Coolify-injected URLs.
 */
function normalizeBaseUrl(raw) {
  if (raw == null || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function readFirstAllowedOrigin() {
  const raw = process.env.ALLOWED_ORIGINS || "";
  for (const part of raw.split(",")) {
    const normalized = normalizeBaseUrl(part);
    if (normalized) return { url: normalized, source: "ALLOWED_ORIGINS" };
  }
  return null;
}

/** Prefer frontend / :80 URLs when Coolify injects SERVICE_URL_* / SERVICE_FQDN_* per service. */
function scoreCoolifyServiceKey(key) {
  const lower = key.toLowerCase();
  if (lower.includes("frontend")) return 10;
  if (/_80$/.test(lower) || lower.endsWith("_80")) return 5;
  if (lower.includes("backend")) return -10;
  return 0;
}

/**
 * Coolify docker-compose deploys often expose SERVICE_URL_FRONTEND / SERVICE_FQDN_FRONTEND
 * without APP_URL being set manually.
 */
function readCoolifyInjectedUrl() {
  const coolifyUrl = normalizeBaseUrl(process.env.COOLIFY_URL);
  if (coolifyUrl) return { url: coolifyUrl, source: "COOLIFY_URL" };

  const coolifyFqdn = (process.env.COOLIFY_FQDN || "").trim();
  if (coolifyFqdn) {
    const fromFqdn = normalizeBaseUrl(coolifyFqdn);
    if (fromFqdn) return { url: fromFqdn, source: "COOLIFY_FQDN" };
  }

  const envKeys = Object.keys(process.env);

  const serviceUrlKeys = envKeys
    .filter((k) => /^SERVICE_URL_/i.test(k) && String(process.env[k] || "").trim())
    .sort((a, b) => scoreCoolifyServiceKey(b) - scoreCoolifyServiceKey(a));

  for (const key of serviceUrlKeys) {
    const normalized = normalizeBaseUrl(process.env[key]);
    if (normalized) return { url: normalized, source: key };
  }

  const fqdnKeys = envKeys
    .filter((k) => /^SERVICE_FQDN_/i.test(k) && String(process.env[k] || "").trim())
    .sort((a, b) => scoreCoolifyServiceKey(b) - scoreCoolifyServiceKey(a));

  for (const key of fqdnKeys) {
    const host = String(process.env[key]).trim().split(":")[0];
    if (!host) continue;
    const normalized = normalizeBaseUrl(`https://${host}`);
    if (normalized) return { url: normalized, source: key };
  }

  return null;
}

function readConfiguredBaseUrl() {
  const keys = ["APP_URL", "BASE_URL", "FRONTEND_URL"];
  for (const key of keys) {
    const normalized = normalizeBaseUrl(process.env[key]);
    if (normalized) return { url: normalized, source: key };
  }
  const allowed = readFirstAllowedOrigin();
  if (allowed) return allowed;
  return readCoolifyInjectedUrl();
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * @returns {string} Origin of the frontend app (e.g. https://site-mateai.co.uk)
 */
function getAppBaseUrl() {
  const configured = readConfiguredBaseUrl();
  if (configured) return configured.url;

  if (isProduction()) {
    throw new Error(`Application base URL is not configured. ${PRODUCTION_URL_HINT}`);
  }

  console.warn(
    `[config] APP_URL is not set; using ${LOCAL_DEV_FALLBACK} for links in emails. ` +
      "Set APP_URL in .env for staging/production."
  );
  return LOCAL_DEV_FALLBACK;
}

/**
 * @param {string} pathname - Path starting with /
 */
function buildAppUrl(pathname = "/") {
  const base = getAppBaseUrl();
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${path}`;
}

/** Log configuration at startup; exits in production if no public URL is configured. */
function validateAppBaseUrlAtStartup() {
  try {
    const configured = readConfiguredBaseUrl();
    if (configured) {
      console.log(`[config] Application base URL (${configured.source}): ${configured.url}`);
      const fallbackSource =
        configured.source === "ALLOWED_ORIGINS" ||
        configured.source.startsWith("SERVICE_") ||
        configured.source.startsWith("COOLIFY_");
      if (fallbackSource && isProduction()) {
        console.warn(
          "[config] Prefer APP_URL for password-reset and invite emails (using detected public URL fallback)."
        );
      }
      return configured.url;
    }

    if (isProduction()) {
      console.error(
        `[config] FATAL: Application base URL is not configured in production. ${PRODUCTION_URL_HINT}`
      );
      process.exit(1);
    }

    console.warn(`[config] APP_URL not set; dev fallback for email links: ${LOCAL_DEV_FALLBACK}`);
    return LOCAL_DEV_FALLBACK;
  } catch (err) {
    console.error(`[config] FATAL: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  getAppBaseUrl,
  buildAppUrl,
  validateAppBaseUrlAtStartup,
  normalizeBaseUrl,
  readConfiguredBaseUrl,
};
