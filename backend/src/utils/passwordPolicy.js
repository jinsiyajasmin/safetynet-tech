/**
 * Password rules for new accounts (signup, invite, password change).
 * Min 8 chars; at least one uppercase (A–Z), one digit, one special (non-letter, non-digit, non-whitespace).
 */
const MIN_LEN = 8;
const MAX_LEN = 128;

/** Used by Joi signup schema */
const NEW_PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,128}$/;

/**
 * @param {unknown} password
 * @returns {{ ok: true, value: string } | { ok: false, message: string }}
 */
function validateNewPassword(password) {
  const p = String(password ?? "");
  if (!p) {
    return { ok: false, message: "Password is required" };
  }
  if (p.length < MIN_LEN) {
    return { ok: false, message: `Password must be at least ${MIN_LEN} characters` };
  }
  if (p.length > MAX_LEN) {
    return { ok: false, message: `Password must be at most ${MAX_LEN} characters` };
  }
  if (!/[A-Z]/.test(p)) {
    return { ok: false, message: "Password must include at least one uppercase letter" };
  }
  if (!/[0-9]/.test(p)) {
    return { ok: false, message: "Password must include at least one number" };
  }
  if (!/[^A-Za-z0-9\s]/.test(p)) {
    return {
      ok: false,
      message:
        "Password must include at least one special character (e.g. ! @ # $ % ^ & *)",
    };
  }
  return { ok: true, value: p };
}

module.exports = {
  validateNewPassword,
  NEW_PASSWORD_PATTERN,
  PASSWORD_MIN_LEN: MIN_LEN,
  PASSWORD_MAX_LEN: MAX_LEN,
};
