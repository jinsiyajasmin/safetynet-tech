import React from "react";
import { Alert } from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import {
  GENERAL_FORM_TEMPLATE_EDITOR_MESSAGE,
  GENERAL_FORM_TEMPLATE_VIEW_MESSAGE,
} from "../utils/generalFormTemplateAccess";

/**
 * Shown at the top of /general-forms templates (not site-pack fill mode).
 */
export default function GeneralFormTemplateInfoBanner({
  canEdit = false,
  isSitePackContext = false,
  pdfLayout = false,
}) {
  const { isDarkMode } = useTheme();

  if (isSitePackContext || pdfLayout) return null;

  const message = canEdit
    ? GENERAL_FORM_TEMPLATE_EDITOR_MESSAGE
    : GENERAL_FORM_TEMPLATE_VIEW_MESSAGE;

  return (
    <Alert
      severity="info"
      sx={{
        mb: 3,
        borderRadius: 2,
        alignItems: "flex-start",
        bgcolor: isDarkMode ? "rgba(232, 159, 23, 0.12)" : "rgba(232, 159, 23, 0.08)",
        color: isDarkMode ? "#F9FAFB" : "#374151",
        border: `1px solid ${isDarkMode ? "rgba(232, 159, 23, 0.35)" : "rgba(232, 159, 23, 0.35)"}`,
        "& .MuiAlert-icon": { color: "#E89F17", mt: 0.15 },
        "& .MuiAlert-message": { lineHeight: 1.55, fontSize: "0.9rem" },
      }}
    >
      {message}
    </Alert>
  );
}
