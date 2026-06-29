import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { downloadKpiReportPdf, downloadKpiReportWord } from "../utils/kpiReportExporter";
import EnvironmentalMonthlyStatistics from "./EnvironmentalMonthlyStatistics";
import EnvironmentalScorecard from "./EnvironmentalScorecard";
import EnvironmentalChartsDashboard from "./EnvironmentalChartsDashboard";
import EnvironmentalReportDocument from "./EnvironmentalReportDocument";
import KpiTrackingLegend from "./dashboard/KpiTrackingLegend";
import KpiReportDownloadBar from "./dashboard/KpiReportDownloadBar";
import { getActingClient } from "../utils/actingClient";
import {
  createDefaultEnvStatRows,
  createEmptyWasteSnapshot,
  isEnvStatRow,
  normalizeWasteSnapshot,
  shouldSeedDefaultEnvKpis,
} from "../utils/environmentalDashboardUtils";

const STATS_STORAGE_PREFIX = "site-mate:env-monthly-stats:";
const WASTE_STORAGE_PREFIX = "site-mate:env-waste-snapshot:";
const TARGETS_STORAGE_PREFIX = "site-mate:env-scorecard-targets:";
const META_STORAGE_PREFIX = "site-mate:env-dashboard-meta:";

function persistDashboardData({
  statsKey,
  wasteKey,
  targetsKey,
  metaKey,
  statRows,
  waste,
  targets,
  savedAt,
}) {
  localStorage.setItem(statsKey, JSON.stringify(statRows));
  localStorage.setItem(wasteKey, JSON.stringify(waste));
  localStorage.setItem(targetsKey, JSON.stringify(targets));
  localStorage.setItem(metaKey, JSON.stringify({ lastSavedAt: savedAt }));
}

export default function EnvironmentalDashboard() {
  const { currentUser } = useAuth();
  const reportRef = useRef(null);

  const scope =
    currentUser?.actingClientId || currentUser?.clientId || currentUser?.id || "default";

  const statsKey = `${STATS_STORAGE_PREFIX}${scope}`;
  const wasteKey = `${WASTE_STORAGE_PREFIX}${scope}`;
  const targetsKey = `${TARGETS_STORAGE_PREFIX}${scope}`;
  const metaKey = `${META_STORAGE_PREFIX}${scope}`;

  const [statRows, setStatRows] = useState(() => createDefaultEnvStatRows());
  const [waste, setWaste] = useState(() => createEmptyWasteSnapshot());
  const [targets, setTargets] = useState({});
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const organisationName =
    getActingClient()?.name ||
    currentUser?.companyname ||
    currentUser?.company ||
    "";

  useEffect(() => {
    try {
      const rawStats = localStorage.getItem(statsKey);
      if (rawStats) {
        const parsed = JSON.parse(rawStats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStatRows(shouldSeedDefaultEnvKpis(parsed) ? createDefaultEnvStatRows() : parsed);
        }
      }

      const rawWaste = localStorage.getItem(wasteKey);
      if (rawWaste) {
        setWaste(normalizeWasteSnapshot(JSON.parse(rawWaste)));
      }

      const rawTargets = localStorage.getItem(targetsKey);
      if (rawTargets) {
        const parsed = JSON.parse(rawTargets);
        if (parsed && typeof parsed === "object") setTargets(parsed);
      }

      const rawMeta = localStorage.getItem(metaKey);
      if (rawMeta) {
        const parsed = JSON.parse(rawMeta);
        if (parsed?.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [statsKey, wasteKey, targetsKey, metaKey]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(statsKey, JSON.stringify(statRows));
  }, [statRows, statsKey, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(wasteKey, JSON.stringify(waste));
  }, [waste, wasteKey, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(targetsKey, JSON.stringify(targets));
  }, [targets, targetsKey, hydrated]);

  const updateTarget = useCallback((rowId, field, value) => {
    setTargets((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] || {}), [field]: value },
    }));
  }, []);

  const hasReportData = useMemo(() => statRows.some(isEnvStatRow), [statRows]);

  const handleSave = () => {
    if (!hasReportData) {
      setSnackbar({
        open: true,
        message: "Add at least one indicator or monthly value before saving.",
        severity: "warning",
      });
      return;
    }

    setSaving(true);
    const savedAt = new Date().toISOString();

    try {
      persistDashboardData({
        statsKey,
        wasteKey,
        targetsKey,
        metaKey,
        statRows,
        waste,
        targets,
        savedAt,
      });
      setLastSavedAt(savedAt);
      setSnackbar({
        open: true,
        message: "Dashboard saved successfully.",
        severity: "success",
      });
    } catch (err) {
      console.error("Environmental save failed:", err);
      setSnackbar({
        open: true,
        message: "Could not save dashboard. Please try again.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const runReportDownload = async (format) => {
    if (!hasReportData) {
      setSnackbar({
        open: true,
        message: "Add at least one indicator or monthly value before downloading the report.",
        severity: "warning",
      });
      return;
    }

    setDownloading(true);
    setDownloadFormat(format);

    try {
      const savedAt = new Date().toISOString();
      persistDashboardData({
        statsKey,
        wasteKey,
        targetsKey,
        metaKey,
        statRows,
        waste,
        targets,
        savedAt,
      });
      setLastSavedAt(savedAt);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const year = new Date().getFullYear();
      const fileName = `Environmental_Report_${year}`;
      if (format === "pdf") {
        await downloadKpiReportPdf(reportRef, fileName);
      } else {
        await downloadKpiReportWord(reportRef, fileName);
      }

      setSnackbar({
        open: true,
        message: `${format === "pdf" ? "PDF" : "Word"} report downloaded successfully.`,
        severity: "success",
      });
    } catch (err) {
      console.error("Environmental report download failed:", err);
      setSnackbar({
        open: true,
        message: `${format === "pdf" ? "PDF" : "Word"} download failed. Please try again.`,
        severity: "error",
      });
    } finally {
      setDownloading(false);
      setDownloadFormat(null);
    }
  };

  const handleDownloadPdf = () => runReportDownload("pdf");
  const handleDownloadWord = () => runReportDownload("word");

  const lastSavedLabel = lastSavedAt
    ? `Last saved ${new Date(lastSavedAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  return (
    <>
      <KpiTrackingLegend />
      <EnvironmentalMonthlyStatistics
        rows={statRows}
        onRowsChange={setStatRows}
        waste={waste}
        onWasteChange={setWaste}
      />
      <EnvironmentalScorecard statRows={statRows} targets={targets} onUpdateTarget={updateTarget} />
      <EnvironmentalChartsDashboard statRows={statRows} waste={waste} targets={targets} />

      <KpiReportDownloadBar
        saving={saving}
        downloading={downloading}
        downloadFormat={downloadFormat}
        lastSavedLabel={lastSavedLabel}
        onSave={handleSave}
        onDownloadPdf={handleDownloadPdf}
        onDownloadWord={handleDownloadWord}
        helpText="Save updates your dashboard. Download exports statistics, scorecard, and performance charts as PDF or Word."
      />

      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <div ref={reportRef} className="pdf-export-root" style={{ width: 1100, background: "#fff" }}>
          <EnvironmentalReportDocument
            statRows={statRows}
            waste={waste}
            targets={targets}
            organisationName={organisationName}
            savedAt={lastSavedAt}
          />
          <EnvironmentalChartsDashboard exportMode statRows={statRows} waste={waste} targets={targets} />
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
