import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { DASHBOARD_THEME } from "./dashboardUi";

const T = DASHBOARD_THEME;

export function kpiStatusCellStyle(status, fallbackBg = "#fff") {
  if (status === "onTrack") return { background: "#dcfce7" };
  if (status === "offTarget") return { background: "#fee2e2" };
  return { background: fallbackBg };
}

export default function KpiStatusBadge({ status }) {
  if (status === "pending") {
    return <span style={{ fontSize: 12, color: T.inkFaint, fontWeight: 500 }}>—</span>;
  }

  if (status === "onTrack") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 12,
          fontWeight: 600,
          color: "#15803d",
          background: "#dcfce7",
          border: "1px solid #86efac",
          borderRadius: 6,
          padding: "4px 8px",
        }}
      >
        <CheckCircle2 size={14} />
        On Track
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        color: "#b91c1c",
        background: "#fee2e2",
        border: "1px solid #fca5a5",
        borderRadius: 6,
        padding: "4px 8px",
      }}
    >
      <XCircle size={14} />
      Off Target
    </span>
  );
}
