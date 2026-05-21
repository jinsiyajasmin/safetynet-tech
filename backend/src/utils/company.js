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

/** Safetynett org users must not hold or receive the superadmin role. */
function assertRoleAllowedForCompany(role, companyName) {
  const r = String(role || "").toLowerCase();
  if (r === "superadmin" && isSafetynettCompanyName(companyName)) {
    return {
      ok: false,
      message: "The superadmin role cannot be assigned to Safetynett company users.",
    };
  }
  return { ok: true };
}

module.exports = { isSafetynettCompanyName, assertRoleAllowedForCompany };
