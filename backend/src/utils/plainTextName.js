/**
 * Human names only: letters (any Unicode script), marks, spaces, '.-'
 * Rejects HTML/script injection, angle brackets, digits, symbols, etc.
 */
const MAX_LEN = 50;
const PLAIN_NAME_RE = /^[\p{L}\p{M}\s'.\-]+$/u;

/**
 * @param {unknown} raw
 * @param {string} fieldLabel e.g. "First name"
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
function validatePlainName(raw, fieldLabel) {
  if (typeof raw !== "string") {
    return { ok: false, message: `${fieldLabel} must be plain text` };
  }
  const s = raw.trim();
  if (!s) {
    return { ok: false, message: `${fieldLabel} is required` };
  }
  if (s.length > MAX_LEN) {
    return { ok: false, message: `${fieldLabel} must be at most ${MAX_LEN} characters` };
  }
  if (/[\u0000-\u001F\u007F]/.test(s)) {
    return { ok: false, message: `${fieldLabel} contains invalid characters` };
  }
  if (!PLAIN_NAME_RE.test(s)) {
    return {
      ok: false,
      message: `${fieldLabel} may only contain letters, spaces, apostrophes, hyphens, and periods (no HTML or numbers)`,
    };
  }
  return { ok: true, value: s };
}

module.exports = { validatePlainName, PLAIN_NAME_RE, MAX_NAME_LEN: MAX_LEN };
