/** Same rules as backend: Unicode letters + marks, spaces, '.- only */
export const PLAIN_NAME_RE = /^[\p{L}\p{M}\s'.\-]+$/u;
export const MAX_NAME_LEN = 50;

/** @returns {string|null} error message or null if valid */
export function plainNameError(value, label) {
  if (typeof value !== "string") return `${label} must be plain text`;
  const s = value.trim();
  if (!s) return `${label} is required`;
  if (s.length > MAX_NAME_LEN) return `${label} must be at most ${MAX_NAME_LEN} characters`;
  if (/[\u0000-\u001F\u007F]/.test(s)) return `${label} contains invalid characters`;
  if (!PLAIN_NAME_RE.test(s)) {
    return `${label} may only contain letters, spaces, apostrophes, hyphens, and periods`;
  }
  return null;
}
