function normalizeSitepackId(value) {
  if (value == null) return null;
  const t = String(value).trim();
  return t !== "" ? t : null;
}

function matchesSitepackScope(record, { siteId, subfolderId }) {
  const answers =
    record?.answers && typeof record.answers === "object" ? record.answers : {};
  const rSiteId = answers.siteId ?? record.siteId;
  const rSubfolderId = normalizeSitepackId(answers.subfolderId ?? record.subfolderId);
  const wantSite = normalizeSitepackId(siteId);
  const wantSubfolder = normalizeSitepackId(subfolderId);

  if (wantSite && normalizeSitepackId(rSiteId) !== wantSite) return false;
  if (wantSubfolder) return rSubfolderId === wantSubfolder;
  // Site-only filter: include responses in any subfolder (matches JSON contains { siteId }).
  if (wantSite) return true;
  return !rSubfolderId;
}

function buildSitepackScopeWhere({ siteId, subfolderId }) {
  const wantSite = normalizeSitepackId(siteId);
  const wantSubfolder = normalizeSitepackId(subfolderId);
  if (!wantSite && !wantSubfolder) return null;

  const clauses = [];
  if (wantSite) {
    clauses.push({ answers: { path: ["siteId"], equals: wantSite } });
  }
  if (wantSubfolder) {
    clauses.push({ answers: { path: ["subfolderId"], equals: wantSubfolder } });
  }
  if (clauses.length === 1) return clauses[0];
  return { AND: clauses };
}

module.exports = {
  normalizeSitepackId,
  matchesSitepackScope,
  buildSitepackScopeWhere,
};
