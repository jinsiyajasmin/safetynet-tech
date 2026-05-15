/**
 * Browser-local library of named signatures (see Saved signatures page).
 * Keyed per user id so multiple accounts on one device stay separate.
 */
export function getSavedSignatureStorageKey(userId) {
  return `savedSignatureLibrary:${userId || "me"}`;
}

/** Entries that have an image, suitable for the "select saved" picker. */
export function readSavedSignaturesWithImages(userId) {
  try {
    const raw = localStorage.getItem(getSavedSignatureStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row) =>
          row &&
          typeof row.image === "string" &&
          (row.image.startsWith("data:image") || row.image.startsWith("http"))
      )
      .map((row, i) => ({
        id: row.id || `row-${i}`,
        label: typeof row.label === "string" ? row.label.trim() : "",
        image: row.image,
      }));
  } catch {
    return [];
  }
}
