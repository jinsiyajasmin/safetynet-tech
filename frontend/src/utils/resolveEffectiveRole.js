/** Matches backend `resolveTokenRole` — Safetynett company_admin maps to superadmin only. */

export function isSafetynettCompanyName(name) {
  return (name || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "") === "safetynett";
}

/** Account role from JWT/DB only — no Safetynett elevation. */
export function getStoredRole(user) {
  if (!user) return "worker";
  return (user.role || "worker").toString().toLowerCase();
}

export function resolveEffectiveRole(user) {
  const dbRole = getStoredRole(user);
  const company = user?.companyname || user?.company || user?.employer || "";
  if (isSafetynettCompanyName(company) && dbRole === "company_admin") {
    return "superadmin";
  }
  return dbRole;
}
