/** Consider the user "online" if we saw sign-in or app activity within this window. */
export const ONLINE_WINDOW_MS = 10 * 60 * 1000;

/**
 * @param {string | Date | null | undefined} lastSeenAt
 * @param {string | Date | null | undefined} lastLoginAt
 */
export function isUserOnline(lastSeenAt, lastLoginAt) {
  const times = [lastSeenAt, lastLoginAt]
    .filter((v) => v != null && v !== "")
    .map((v) => new Date(v).getTime())
    .filter((t) => !Number.isNaN(t));
  if (!times.length) return false;
  const freshest = Math.max(...times);
  return Date.now() - freshest < ONLINE_WINDOW_MS;
}

export function formatLastLogin(iso) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

/** Prefer last login; if missing, show last activity from lastSeenAt. */
export function formatLastSignIn(lastLoginAt, lastSeenAt) {
  if (lastLoginAt) return formatLastLogin(lastLoginAt);
  if (lastSeenAt) return formatLastLogin(lastSeenAt);
  return "Never";
}
