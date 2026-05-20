import { computeLogoUrl } from "../hooks/useCompanyLogo";

/** Pick the best logo src for form view/PDF export (skips expired blob URLs). */
export function resolveFormLogoSrc(values = {}, companyLogoUrl = null) {
  const candidates = [
    values.logo_preview,
    typeof values.logo === "string" ? values.logo : null,
    typeof values.logoUrl === "string" ? values.logoUrl : null,
    typeof values.company_logo === "string" ? values.company_logo : null,
    values.company_logo_preview,
  ];

  for (const src of candidates) {
    if (!src || typeof src !== "string") continue;
    if (src.startsWith("blob:")) continue;
    if (src.startsWith("data:") || /^https?:\/\//i.test(src)) return src;
    if (src.startsWith("/")) return computeLogoUrl(src);
  }

  return companyLogoUrl || null;
}
