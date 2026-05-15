/** Roles allowed to create/edit general form templates from /general-forms (no site pack context). */
export const GENERAL_FORM_TEMPLATE_EDITOR_ROLES = [
  "superadmin",
  "company_admin",
  "supervisor",
];

/**
 * @param {string} role — effective role from AuthContext (Safetynett → superadmin already applied).
 * @param {{ siteId?: string | null }} opts — site pack / site context allows operational editing for all roles that can open the route.
 */
export function canEditGeneralFormTemplate(role, { siteId } = {}) {
  if (siteId != null && String(siteId).trim() !== "") return true;
  return GENERAL_FORM_TEMPLATE_EDITOR_ROLES.includes(role);
}

export function canEditGeneralFormTemplatesList(role) {
  return GENERAL_FORM_TEMPLATE_EDITOR_ROLES.includes(role);
}
