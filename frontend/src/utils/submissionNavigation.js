import { GENERAL_FORM_TEMPLATE_BY_TITLE } from "../constants/generalFormTemplates";
import {
  getFormPathForSubmission,
  getTemplatePathForSubmission,
  pathWithSearchParams,
} from "./monitoringContext";

function submissionRowToShape(row) {
  return {
    id: row.id,
    formId: row.formId,
    category: row.category,
    form: { title: row.formTitle },
    answers: {
      siteId: row.siteId,
      subfolderId: row.subfolderId,
      monitoringSection: row.monitoringSection,
      sheqFormCategory: row.sheqFormCategory,
    },
  };
}

function appendSubmissionContext(params, row) {
  const out = { ...params };
  if (row.siteId) out.siteId = row.siteId;
  if (row.subfolderId) out.subfolderId = row.subfolderId;
  if (row.monitoringSection) out.monitoringSection = row.monitoringSection;
  if (row.category) out.category = row.category;
  return out;
}

function applyActionMode(params, mode) {
  const out = { ...params };
  if (mode === "view") out.preview = "true";
  else if (mode === "download_pdf") out.action = "download";
  else if (mode === "download_word") out.action = "download_word";
  return out;
}

/** Build a URL to view or download a form response (admin / user detail contexts). */
export function buildSubmissionActionUrl(row, mode = "view") {
  const responseId = row?.id;
  if (!responseId) return null;

  const sub = submissionRowToShape(row);
  const modeParams = applyActionMode({}, mode);

  const generalPath = getTemplatePathForSubmission(sub);
  if (generalPath) {
    return pathWithSearchParams(
      `${generalPath}/${responseId}`,
      appendSubmissionContext(modeParams, row)
    );
  }

  const reportPath = getFormPathForSubmission(sub);
  if (reportPath === "/sheq-install-form") {
    const params = appendSubmissionContext(
      {
        ...modeParams,
        category: row.sheqFormCategory || row.category,
      },
      row
    );
    if (mode === "view") params.view = "true";
    return pathWithSearchParams(`${reportPath}/${responseId}`, params);
  }
  if (reportPath) {
    return pathWithSearchParams(
      reportPath,
      appendSubmissionContext(
        { ...modeParams, responseId: String(responseId) },
        row
      )
    );
  }

  if (row.formId) {
    return pathWithSearchParams(
      `/forms/${row.formId}/use`,
      appendSubmissionContext(
        { ...modeParams, responseId: String(responseId) },
        row
      )
    );
  }

  return null;
}

export function isCustomBuilderSubmission(row) {
  const title = row?.formTitle;
  if (!title || GENERAL_FORM_TEMPLATE_BY_TITLE[title]) return false;
  return Boolean(row?.formId);
}
