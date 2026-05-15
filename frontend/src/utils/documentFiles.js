/** Browser file input accept attribute */
export const DOCUMENT_UPLOAD_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.csv,.txt,.ppt,.pptx,.rtf,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.mp4,.mov,.webm";

const IMAGE_TYPES = new Set(["JPG", "JPEG", "PNG", "GIF", "WEBP", "SVG", "BMP"]);
const OFFICE_TYPES = new Set(["DOC", "DOCX", "XLS", "XLSX", "XLSM", "CSV", "PPT", "PPTX", "RTF"]);
const VIDEO_TYPES = new Set(["MP4", "MOV", "WEBM"]);

const EXT_FROM_MIME = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/webp": "WEBP",
};

export const MAX_DOCUMENT_MB = 50;

export function extensionFromFilename(name = "") {
  const parts = String(name).toLowerCase().split(".");
  if (parts.length < 2) return "";
  return parts.pop();
}

export function documentTypeFromFile(file) {
  if (!file) return "FILE";
  const ext = extensionFromFilename(file.name);
  if (ext) return ext.toUpperCase();
  const fromMime = EXT_FROM_MIME[file.type];
  return fromMime || "FILE";
}

export function isAllowedDocumentFile(file) {
  if (!file?.name) return false;
  const ext = extensionFromFilename(file.name);
  if (!ext) return false;
  const allowed = DOCUMENT_UPLOAD_ACCEPT.split(",").map((s) => s.replace(".", "").toLowerCase());
  return allowed.includes(ext);
}

export function buildDownloadFilename(doc) {
  const title = (doc?.title || "document").trim();
  const type = (doc?.type || "").toUpperCase();
  if (!type || type === "FORM" || type === "FILE") return title;
  if (title.toLowerCase().endsWith(`.${type.toLowerCase()}`)) return title;
  return `${title}.${type.toLowerCase()}`;
}

/** Cloudinary: force download with correct filename when possible */
export function getDocumentDownloadUrl(url, filename) {
  if (!url) return "";
  if (!url.includes("res.cloudinary.com")) return url;

  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const uploadIdx = path.indexOf("/upload/");
    if (uploadIdx === -1) return url;

    const prefix = path.slice(0, uploadIdx + "/upload/".length);
    const suffix = path.slice(uploadIdx + "/upload/".length);
    const flag = filename
      ? `fl_attachment:${encodeURIComponent(filename)}/`
      : "fl_attachment/";
    parsed.pathname = `${prefix}${flag}${suffix}`;
    return parsed.toString();
  } catch {
    return url;
  }
}

export function getDocumentViewUrl(url, docType) {
  const type = (docType || "").toUpperCase();
  if (!url) return "";

  if (type === "PDF" || IMAGE_TYPES.has(type) || VIDEO_TYPES.has(type) || type === "TXT") {
    return url;
  }

  if (OFFICE_TYPES.has(type)) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function canPreviewInline(docType) {
  const type = (docType || "").toUpperCase();
  return (
    type === "PDF" ||
    IMAGE_TYPES.has(type) ||
    VIDEO_TYPES.has(type) ||
    OFFICE_TYPES.has(type) ||
    type === "TXT"
  );
}

export function triggerBrowserDownload(url, filename) {
  if (!url) return;
  const link = document.createElement("a");
  link.href = getDocumentDownloadUrl(url, filename);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  if (filename) link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
