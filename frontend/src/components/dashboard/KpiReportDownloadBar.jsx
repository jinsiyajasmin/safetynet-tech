import React from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import { Download, FileText, Save } from "lucide-react";

export default function KpiReportDownloadBar({
  saving = false,
  downloading = false,
  downloadFormat = null,
  lastSavedLabel,
  onSave,
  onDownloadPdf,
  onDownloadWord,
  saveColor = "#16a34a",
  saveHoverColor = "#15803d",
  accentColor,
  helpText,
}) {
  const outlineSx = accentColor
    ? { borderColor: accentColor, color: accentColor }
    : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        mb: 3,
        p: 2,
        bgcolor: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
          onClick={onSave}
          disabled={saving || downloading}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            bgcolor: saveColor,
            "&:hover": { bgcolor: saveHoverColor },
          }}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          variant="outlined"
          startIcon={
            downloading && downloadFormat === "pdf" ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Download size={16} />
            )
          }
          onClick={onDownloadPdf}
          disabled={saving || downloading}
          sx={{ textTransform: "none", fontWeight: 600, ...outlineSx }}
        >
          {downloading && downloadFormat === "pdf" ? "Downloading…" : "Download PDF"}
        </Button>
        <Button
          variant="outlined"
          startIcon={
            downloading && downloadFormat === "word" ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <FileText size={16} />
            )
          }
          onClick={onDownloadWord}
          disabled={saving || downloading}
          sx={{ textTransform: "none", fontWeight: 600, ...outlineSx }}
        >
          {downloading && downloadFormat === "word" ? "Downloading…" : "Download Word"}
        </Button>
        {lastSavedLabel ? (
          <span style={{ fontSize: 12, color: "#6b7280" }}>{lastSavedLabel}</span>
        ) : null}
      </Box>
      {helpText ? (
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280", maxWidth: 460 }}>{helpText}</p>
      ) : null}
    </Box>
  );
}
