import React from "react";
import { Box } from "@mui/material";

export default function KpiTrackingLegend() {
  return (
    <Box
      sx={{
        mb: 3,
        p: 1.5,
        bgcolor: "#ffedd5",
        borderRadius: 1,
        border: "1px solid #fdba74",
      }}
    >
      <span style={{ fontSize: 12, color: "#9a3412", lineHeight: 1.5 }}>
        On Track = actual meets or beats target · Off Target = action required. Lower-is-better
        indicators (e.g. non-conformances, complaints) are on track when actual is at or below
        target.
      </span>
    </Box>
  );
}
