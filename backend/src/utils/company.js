/**
 * True when company name is Safetynett (case- and spacing-insensitive).
 * @param {unknown} name
 */
function isSafetynettCompanyName(name) {
  return (
    String(name ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "") === "safetynett"
  );
}

module.exports = { isSafetynettCompanyName };
