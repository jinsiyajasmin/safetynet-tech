/**
 * After login / 2FA, only true superadmins and Safetynett-company accounts
 * should land on the global clients hub (/clients).
 */
export function shouldLandOnClientsHub(user) {
  if (!user) return false;
  const role = (user.role || "").toString().toLowerCase();
  const company = (user.companyname || user.company || user.employer || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  return role === "superadmin" || company === "safetynett";
}
