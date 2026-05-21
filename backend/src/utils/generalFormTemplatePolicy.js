const { STATIC_CONCERN_FORM_ID } = require("./formOwnership");

const GENERAL_FORM_TEMPLATE_ROLES = ["superadmin", "company_admin", "site_manager"];

/** Built-in report pages (GenericReportPage) — not general-form templates. */
const BUILTIN_REPORT_CATEGORIES = new Set([
  "Health & Safety concern",
  "Sustainability concern",
  "Quality concern",
  "Positive observation",
  "Weekly supervisor health & safety inspection",
  "Weekly supervisor reports",
]);

/**
 * Built-in concern/weekly reports bypass template-editor checks.
 * - Route form id (save) or stored form id (update/delete).
 * - Category counts only when trustCategory is true (DB-backed rows), never from request body alone.
 */
function isBuiltinReportSubmission(meta = {}) {
  if (meta.formId === STATIC_CONCERN_FORM_ID) return true;
  if (meta.trustCategory && meta.category) {
    const cat = String(meta.category).trim();
    if (BUILTIN_REPORT_CATEGORIES.has(cat)) return true;
  }
  return false;
}

function isSafetynettUser(user) {
  const n = (user?.companyname || user?.company || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  return n === "safetynett";
}

function siteContextPresent(answers, body) {
  const a = answers?.siteId;
  if (a != null && String(a).trim() !== "") return true;
  const b = body?.siteId;
  if (b != null && String(b).trim() !== "") return true;
  return false;
}

/** When saving/updating without site context, only template editors may write. */
function assertGeneralFormTemplateWrite(req, answers, body = {}, meta = {}) {
  if (!req.user) {
    return { ok: false, status: 401, message: "Not authenticated" };
  }
  if (isSafetynettUser(req.user)) return { ok: true };
  if (isBuiltinReportSubmission(meta)) return { ok: true };
  if (siteContextPresent(answers, body)) return { ok: true };
  if (GENERAL_FORM_TEMPLATE_ROLES.includes(req.user.role)) return { ok: true };
  return {
    ok: false,
    status: 403,
    message:
      "Only Super Admin, Company Admin, or Site Manager can edit general form templates. Use a site pack link if you are filling this for a site.",
  };
}

module.exports = {
  BUILTIN_REPORT_CATEGORIES,
  isBuiltinReportSubmission,
  assertGeneralFormTemplateWrite,
  siteContextPresent,
};
