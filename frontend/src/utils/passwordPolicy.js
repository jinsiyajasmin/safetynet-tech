/** Same rules as backend `passwordPolicy.js` */
const MIN_LEN = 8;
const MAX_LEN = 128;

export const NEW_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9\s]).{8,128}$/;

/**
 * @param {unknown} password
 * @returns {string|null} error message or null if valid
 */
export function newPasswordError(password) {
  const p = String(password ?? "");
  if (!p) return "Password is required";
  if (p.length < MIN_LEN) return `Password must be at least ${MIN_LEN} characters`;
  if (p.length > MAX_LEN) return `Password must be at most ${MAX_LEN} characters`;
  if (!/[A-Z]/.test(p)) return "Password must include at least one uppercase letter";
  if (!/[0-9]/.test(p)) return "Password must include at least one number";
  if (!/[^A-Za-z0-9\s]/.test(p)) {
    return "Password must include at least one special character (e.g. ! @ # $ %)";
  }
  return null;
}

export { MIN_LEN as PASSWORD_MIN_LEN, MAX_LEN as PASSWORD_MAX_LEN };
