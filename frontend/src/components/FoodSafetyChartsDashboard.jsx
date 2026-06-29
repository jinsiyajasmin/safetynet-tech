import React, { useMemo } from "react";
import { Box } from "@mui/material";
import { AlertTriangle, BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DASHBOARD_THEME,
  DashboardCard,
  DashboardChartBox,
  DashboardChartTooltip,
  DashboardMiniStat,
  DashboardSectionHeader,
} from "./dashboard/dashboardUi";
import {
  buildFsMonthlySeries,
  buildIncidentChartSeries,
  getChartableFsRows,
  hasIncidentData,
  hasFoodSafetyChartData,
  summarizeFoodSafetyScorecard,
} from "../utils/foodSafetyDashboardUtils";

const T = DASHBOARD_THEME;
const ORANGE = "#ea580c";

export default function FoodSafetyChartsDashboard({
  statRows,
  incidents,
  targets,
  exportMode = false,
}) {
  const chartableRows = useMemo(() => getChartableFsRows(statRows), [statRows]);
  const activeRow = chartableRows[0];

  const monthlyData = useMemo(
    () => (activeRow ? buildFsMonthlySeries(activeRow) : []),
    [activeRow]
  );

  const incidentData = useMemo(() => buildIncidentChartSeries(incidents), [incidents]);

  const summary = useMemo(
    () => summarizeFoodSafetyScorecard(statRows, targets),
    [statRows, targets]
  );

  const hasIncidentChart = hasIncidentData(incidents);
  const hasChartData = hasFoodSafetyChartData(statRows, incidents);

  if (!hasChartData) {
    if (exportMode) return null;
    return (
      <DashboardCard style={{ marginBottom: 24 }}>
        <DashboardSectionHeader
          icon={BarChart3}
          title="Performance dashboard"
          hint="Enter food safety statistics and incident data to generate charts."
        />
      </DashboardCard>
    );
  }

  const charts = (
    <Box sx={{ mb: exportMode ? 0 : 3 }}>
      {!exportMode ? (
        <>
          <DashboardSectionHeader
            icon={BarChart3}
            title="Performance dashboard"
            hint="Charts update automatically from your statistics, incident snapshot, and scorecard."
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 1.5,
              mb: 2,
            }}
          >
            <DashboardMiniStat label="KPIs tracked" value={summary.total} tone="neutral" />
            <DashboardMiniStat label="On track" value={summary.onTrack} tone="green" />
            <DashboardMiniStat label="Off target" value={summary.offTarget} tone="red" />
            <DashboardMiniStat label="Awaiting target" value={summary.pending} tone="brand" />
          </Box>
        </>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
          gap: 2,
        }}
      >
        <DashboardCard>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.ink, display: "block", marginBottom: 12 }}>
            Monthly indicator trend
          </span>
          {activeRow ? (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: T.inkMid }}>{activeRow.indicator}</p>
              <DashboardChartBox height={280} pdfChart={exportMode}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.border} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: T.inkFaint }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: T.inkFaint }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<DashboardChartTooltip />} cursor={{ fill: "rgba(234, 88, 12, 0.06)" }} />
                    <Bar dataKey="value" name="Value" fill={ORANGE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </DashboardChartBox>
            </>
          ) : null}
        </DashboardCard>

        <DashboardCard>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <AlertTriangle size={16} color={T.inkMid} />
            <span style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>Incident classification</span>
          </Box>
          {hasIncidentChart ? (
            <DashboardChartBox height={280} pdfChart={exportMode}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={incidentData}
                  margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  barCategoryGap={8}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: T.inkFaint }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 10, fill: T.inkMid }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<DashboardChartTooltip />} cursor={{ fill: "rgba(234, 88, 12, 0.06)" }} />
                  <Bar dataKey="value" name="Count" fill={ORANGE} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </DashboardChartBox>
          ) : null}
        </DashboardCard>
      </Box>
    </Box>
  );

  if (!exportMode) return charts;

  return (
    <div data-pdf-block data-pdf-break-before style={{ marginBottom: 0 }}>
      <Box sx={{ p: 2, border: "1px solid #d1d5db", borderRadius: 2, bgcolor: "#fff" }}>
        <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.ink }}>
          Food Safety — Performance Dashboard
        </p>
        {charts}
      </Box>
    </div>
  );
}
