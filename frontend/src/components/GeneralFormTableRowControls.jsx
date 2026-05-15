import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

export function isGeneralFormTableReadOnly(downloading, action, accessLocked = false) {
  return Boolean(downloading || action === "download" || accessLocked);
}

/**
 * Per-row + / −: insert an empty row after this index, or remove this row.
 * Use beside each data row (or in a narrow leading column). Hidden when printing / PDF download.
 *
 * @param {'column' | 'compact'} variant — column: stacked icons (trailing strip). compact: horizontal, for narrow # column.
 */
export default function GeneralFormTableRowControls({
  downloading,
  action,
  rowIndex,
  rowCount,
  minRows = 1,
  maxRows = 40,
  onInsertAfter,
  onRemoveAt,
  borderColor = "#CCC",
  variant = "column",
  accessLocked = false,
}) {
  const readOnly = isGeneralFormTableReadOnly(downloading, action, accessLocked);
  if (readOnly) return null;

  const canRemove = rowCount > minRows;
  const canAdd = rowCount < maxRows;
  const compact = variant === "compact";

  return (
    <Box
      sx={{
        flex: "0 0 auto",
        width: { xs: "100%", md: compact ? "auto" : 52 },
        minWidth: compact ? 0 : undefined,
        display: "flex",
        flexDirection: { xs: "row", md: compact ? "row" : "column" },
        alignItems: "center",
        justifyContent: "center",
        gap: compact ? 0 : 0.25,
        borderLeft: { md: compact ? "none" : `1px solid ${borderColor}` },
        borderTop: { xs: `1px solid ${borderColor}`, md: compact ? "none" : "none" },
        py: compact ? 0 : 0.25,
        px: compact ? 0 : 0,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      }}
    >
      <Tooltip title="Add row below">
        <span>
          <IconButton
            size="small"
            disabled={!canAdd}
            onClick={() => onInsertAfter(rowIndex)}
            aria-label="Add row below"
            sx={{ p: compact ? "2px" : undefined }}
          >
            <AddIcon sx={{ fontSize: compact ? 18 : 20 }} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Remove this row">
        <span>
          <IconButton
            size="small"
            disabled={!canRemove}
            onClick={() => onRemoveAt(rowIndex)}
            aria-label="Remove this row"
            sx={{ p: compact ? "2px" : undefined }}
          >
            <RemoveIcon sx={{ fontSize: compact ? 18 : 20 }} />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}

/** Empty header cell to align with trailing row-controls column (desktop only). */
export function GeneralFormTableRowControlsHeaderSpacer({
  downloading,
  action,
  borderColor = "#CCC",
  headerBgColor,
  accessLocked = false,
}) {
  const readOnly = isGeneralFormTableReadOnly(downloading, action, accessLocked);
  if (readOnly) return null;
  return (
    <Box
      sx={{
        display: { xs: "none", md: "flex" },
        width: 52,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
        borderLeft: `1px solid ${borderColor}`,
        bgcolor: headerBgColor,
        minHeight: 36,
      }}
      aria-hidden
    />
  );
}
