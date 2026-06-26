/** Query flag when opening a template from /general-forms (Templates page). */
export const TEMPLATES_PAGE_SOURCE = "templates";

export const TEMPLATES_PAGE_TAB_SAVED = "saved";

export function isTemplatesPageEditContext(searchParams) {
  if (!searchParams) return false;
  if (searchParams.get("source") !== TEMPLATES_PAGE_SOURCE) return false;
  if (searchParams.get("siteId")) return false;
  if (searchParams.get("monitoringSection")) return false;
  return true;
}

export function appendTemplatesPageMetadata(payload, searchParams, templateModuleTitle = "") {
  if (!isTemplatesPageEditContext(searchParams)) return payload;
  return {
    ...payload,
    savedFromTemplatesPage: true,
    ...(templateModuleTitle ? { templateModuleTitle } : {}),
  };
}

export function templatesPageListUrl() {
  return `/general-forms?tab=${TEMPLATES_PAGE_TAB_SAVED}`;
}

export function templateSaveButtonLabel({ saving = false, downloading = false } = {}) {
  if (downloading) return "Downloading PDF...";
  if (saving) return "Saving...";
  return "Save";
}
