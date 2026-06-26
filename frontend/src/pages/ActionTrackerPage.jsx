import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
  Menu,
  MenuItem,
} from "@mui/material";
import { Eye, Pencil, Send, Download } from "lucide-react";
import Layout from "../components/Layout";
import PageContent from "../components/PageContent";
import { useTheme } from "../context/ThemeContext";
import {
  fetchActionTrackerItem,
  fetchActionTrackerItems,
  sendActionTrackerItem,
  updateActionTrackerItem,
} from "../services/api";
import {
  ACTION_TRACKER_FIELD_SECTIONS,
  actionToFormValues,
  formValuesToUpdatePayload,
} from "../constants/actionTrackerFields";
import { downloadPdfFromRef } from "../utils/pdfGenerator";

function statusChip(status) {
  switch (status) {
    case "sent":
      return { label: "Sent", color: "success" };
    case "draft":
      return { label: "Draft", color: "warning" };
    default:
      return { label: "Pending", color: "info" };
  }
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function FieldDisplay({ field, value }) {
  if (field.type === "textarea") {
    return (
      <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.25 }}>
        {value || "—"}
      </Typography>
    );
  }
  return <Typography sx={{ mt: 0.25 }}>{value || "—"}</Typography>;
}

function ActionFormBody({ formValues, editable, onChange }) {
  return (
    <Box>
      {ACTION_TRACKER_FIELD_SECTIONS.map((section) => (
        <Box key={section.heading} sx={{ mb: 3 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#0B4DA6", mb: 1.5 }}
          >
            {section.heading}
          </Typography>
          {section.fields.map((field) => {
            const value = formValues[field.id] ?? "";
            const readOnly = !editable || field.readOnlyInEdit;
            return (
              <Box key={field.id} sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}
                >
                  {field.label}
                </Typography>
                {readOnly ? (
                  <FieldDisplay field={field} value={value} />
                ) : field.type === "textarea" ? (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    sx={{ mt: 0.5 }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    type={field.type === "date" ? "date" : "text"}
                    value={value}
                    onChange={(e) => onChange(field.id, e.target.value)}
                    InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                    sx={{ mt: 0.5 }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
      ))}

      {Array.isArray(formValues.incidents) && formValues.incidents.length > 0 ? (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}
          >
            Incident classification
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
            {formValues.incidents.map((inc) => (
              <Chip key={inc} size="small" label={inc} />
            ))}
          </Box>
          {formValues.incidents_other ? (
            <Typography variant="body2" sx={{ mt: 1, color: "#64748b" }}>
              Other: {formValues.incidents_other}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function ActionPrintView({ action, formValues }) {
  if (!action) return null;
  return (
    <Box
      sx={{
        fontFamily: "'Inter', sans-serif",
        color: "#1e293b",
        p: 2,
        bgcolor: "#fff",
      }}
    >
      <Box data-pdf-block sx={{ mb: 2, pb: 1, borderBottom: "2px solid #0B4DA6" }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#0B4DA6" }}>
          {action.title || "Nonconformance report"}
        </Typography>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Reported by {action.reporter?.name || "—"} · {formatDate(action.createdAt)}
        </Typography>
        <Chip
          size="small"
          label={statusChip(action.status).label}
          color={statusChip(action.status).color}
          sx={{ mt: 1 }}
        />
      </Box>

      {ACTION_TRACKER_FIELD_SECTIONS.map((section) => (
        <Box key={section.heading} data-pdf-block sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "#0B4DA6", mb: 1 }}>
            {section.heading}
          </Typography>
          {section.fields.map((field) => (
            <Box key={field.id} sx={{ mb: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, color: "#64748b" }}>
                {field.label}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {formValues[field.id] || "—"}
              </Typography>
            </Box>
          ))}
        </Box>
      ))}

      {action.responseNotes ? (
        <Box data-pdf-block sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700, color: "#0B4DA6", mb: 1 }}>
            Assignee response
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {action.responseNotes}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

export default function ActionTrackerPage() {
  const { isDarkMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const itemIdFromUrl = searchParams.get("item");
  const pdfRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [relatedActions, setRelatedActions] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("view");
  const [versionTab, setVersionTab] = useState(0);
  const [editForm, setEditForm] = useState({});
  const [responseNotes, setResponseNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState(null);
  const [downloadTarget, setDownloadTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const headingColor = isDarkMode ? "#F9FAFB" : "#111827";
  const subColor = isDarkMode ? "#9CA3AF" : "#6B7280";
  const borderColor = isDarkMode ? "#374151" : "#E5E7EB";

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchActionTrackerItems();
      setItems(res?.data || []);
    } catch (err) {
      console.error("Failed to load action tracker items", err);
      setSnack({
        open: true,
        message: "Could not load nonconformance actions.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const latestAction = useMemo(
    () => relatedActions[0] || selected,
    [relatedActions, selected]
  );

  const previousActions = useMemo(
    () => (relatedActions.length > 1 ? relatedActions.slice(1) : []),
    [relatedActions]
  );

  const displayAction = useMemo(() => {
    if (versionTab === 0) return latestAction;
    return previousActions[0] || latestAction;
  }, [versionTab, latestAction, previousActions]);

  const displayFormValues = useMemo(
    () => actionToFormValues(displayAction),
    [displayAction]
  );

  const openItem = useCallback(async (id, mode = "view") => {
    try {
      const res = await fetchActionTrackerItem(id);
      const row = res?.data;
      if (!row) return;
      const related = res?.relatedActions?.length ? res.relatedActions : [row];
      setSelected(row);
      setRelatedActions(related);
      const focus = related[0] || row;
      setEditForm(actionToFormValues(focus));
      setResponseNotes(focus.responseNotes || "");
      setVersionTab(0);
      setDialogMode(mode);
      setDialogOpen(true);
      setSearchParams({ item: id });
    } catch (err) {
      console.error("Failed to load action", err);
      setSnack({ open: true, message: "Could not open this action.", severity: "error" });
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (itemIdFromUrl && !dialogOpen) {
      openItem(itemIdFromUrl, "view");
    }
  }, [itemIdFromUrl, dialogOpen, openItem]);

  const closeDialog = () => {
    setDialogOpen(false);
    setSelected(null);
    setRelatedActions([]);
    if (searchParams.get("item")) {
      setSearchParams({});
    }
  };

  const handleFormChange = (fieldId, value) => {
    setEditForm((prev) => ({ ...prev, [fieldId]: value }));
  };

  const buildPayload = () => {
    const payload = formValuesToUpdatePayload(editForm, responseNotes);
    return payload;
  };

  const handleSaveDraft = async () => {
    if (!latestAction) return;
    setSaving(true);
    try {
      const res = await updateActionTrackerItem(latestAction.id, {
        ...buildPayload(),
        asDraft: true,
      });
      setSelected(res.data);
      setRelatedActions((prev) =>
        prev.map((a) => (a.id === res.data.id ? res.data : a))
      );
      await loadItems();
      setSnack({ open: true, message: "Draft saved.", severity: "success" });
    } catch (err) {
      setSnack({
        open: true,
        message: err?.response?.data?.message || "Could not save draft.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!latestAction) return;
    setSaving(true);
    try {
      const res = await sendActionTrackerItem(latestAction.id, buildPayload());
      setSelected(res.data);
      setRelatedActions((prev) =>
        prev.map((a) => (a.id === res.data.id ? res.data : a))
      );
      await loadItems();
      setSnack({
        open: true,
        message: "Response sent to the reporter.",
        severity: "success",
      });
      setDialogMode("view");
    } catch (err) {
      setSnack({
        open: true,
        message: err?.response?.data?.message || "Could not send response.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPdf = async (action) => {
    setDownloadAnchor(null);
    setDownloading(true);
    setDownloadTarget(action);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 150)));
    try {
      const fileName = `Nonconformance_${(action.title || "report").replace(/\s+/g, "_")}`;
      await downloadPdfFromRef(pdfRef, fileName, (err) => {
        if (err) throw err;
      });
    } catch (err) {
      console.error("PDF download failed", err);
      setSnack({ open: true, message: "Could not download PDF.", severity: "error" });
    } finally {
      setDownloading(false);
      setDownloadTarget(null);
    }
  };

  const openDownloadMenu = (e, row) => {
    setDownloadAnchor(e.currentTarget);
    setDownloadTarget(row);
  };

  const canEditLatest =
    latestAction?.status !== "sent" && versionTab === 0 && dialogMode === "edit";

  const showVersionTabs = relatedActions.length > 1;

  return (
    <Layout disablePadding>
      <PageContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: headingColor, mb: 0.5 }}>
            Action tracker
          </Typography>
          <Typography sx={{ color: subColor, fontSize: "0.95rem" }}>
            Nonconformance reports assigned to you from Health &amp; Safety concern forms.
          </Typography>
        </Box>

        <Paper
          elevation={0}
          sx={{ borderRadius: 3, border: `1px solid ${borderColor}`, overflow: "hidden" }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#E89F17" }} />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
              <Typography sx={{ fontWeight: 600, color: headingColor, mb: 0.5 }}>
                No assigned nonconformances
              </Typography>
              <Typography sx={{ color: subColor, fontSize: "0.9rem" }}>
                When someone reports a nonconformance with your email as responsible person, it will appear here.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F9FAFB" }}>
                    <TableCell sx={{ fontWeight: 600, color: subColor }}>SL No</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: subColor }}>Report</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: subColor }}>Reported by</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: subColor }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: subColor }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: subColor }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((row, index) => {
                    const chip = statusChip(row.status);
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={{ color: headingColor }}>{index + 1}</TableCell>
                        <TableCell sx={{ color: headingColor, fontWeight: 600 }}>
                          {row.title}
                        </TableCell>
                        <TableCell sx={{ color: subColor }}>
                          {row.reporter?.name || "—"}
                        </TableCell>
                        <TableCell sx={{ color: subColor }}>
                          {formatDate(row.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={chip.label} color={chip.color} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<Eye size={16} />}
                            onClick={() => openItem(row.id, "view")}
                            sx={{ textTransform: "none", mr: 0.5 }}
                          >
                            View
                          </Button>
                          {row.status !== "sent" ? (
                            <Button
                              size="small"
                              startIcon={<Pencil size={16} />}
                              onClick={() => openItem(row.id, "edit")}
                              sx={{ textTransform: "none", mr: 0.5 }}
                            >
                              Edit
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            startIcon={<Download size={16} />}
                            disabled={downloading}
                            onClick={(e) => openDownloadMenu(e, row)}
                            sx={{ textTransform: "none" }}
                          >
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Menu
          anchorEl={downloadAnchor}
          open={Boolean(downloadAnchor)}
          onClose={() => setDownloadAnchor(null)}
        >
          <MenuItem
            onClick={() => downloadTarget && handleDownloadPdf(downloadTarget)}
          >
            Download as PDF
          </MenuItem>
        </Menu>

        <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
          <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
            {displayAction?.title || "Nonconformance"}
            <Button
              size="small"
              startIcon={<Download size={16} />}
              disabled={downloading}
              onClick={() => handleDownloadPdf(displayAction)}
              sx={{ position: "absolute", right: 48, top: 12, textTransform: "none" }}
            >
              PDF
            </Button>
          </DialogTitle>
          <DialogContent dividers>
            {displayAction ? (
              <Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
                  <Chip
                    size="small"
                    label={statusChip(displayAction.status).label}
                    color={statusChip(displayAction.status).color}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={`Reported by ${displayAction.reporter?.name || "—"}`}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    label={formatDate(displayAction.createdAt)}
                  />
                </Box>

                {showVersionTabs ? (
                  <Tabs
                    value={versionTab}
                    onChange={(_, v) => setVersionTab(v)}
                    sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
                  >
                    <Tab label="Latest" sx={{ textTransform: "none", fontWeight: 600 }} />
                    <Tab
                      label={`Previous (${previousActions.length})`}
                      sx={{ textTransform: "none", fontWeight: 600 }}
                    />
                  </Tabs>
                ) : null}

                {versionTab === 0 ? (
                  <>
                    <ActionFormBody
                      formValues={canEditLatest ? editForm : displayFormValues}
                      editable={canEditLatest}
                      onChange={handleFormChange}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}
                      >
                        Your response to reporter
                      </Typography>
                      {canEditLatest ? (
                        <TextField
                          fullWidth
                          multiline
                          minRows={4}
                          value={responseNotes}
                          onChange={(e) => setResponseNotes(e.target.value)}
                          placeholder="Add your response, actions taken, or notes for the reporter..."
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                          {displayAction.responseNotes || "No response yet."}
                        </Typography>
                      )}
                    </Box>
                  </>
                ) : (
                  <Box>
                    {previousActions.length === 0 ? (
                      <Typography sx={{ color: subColor }}>No previous actions.</Typography>
                    ) : (
                      previousActions.map((prev, idx) => {
                        const prevValues = actionToFormValues(prev);
                        return (
                          <Paper
                            key={prev.id}
                            variant="outlined"
                            sx={{ p: 2, mb: 2, borderRadius: 2 }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1.5,
                              }}
                            >
                              <Typography sx={{ fontWeight: 700 }}>
                                Previous action {previousActions.length - idx}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Chip
                                  size="small"
                                  label={statusChip(prev.status).label}
                                  color={statusChip(prev.status).color}
                                />
                                <Button
                                  size="small"
                                  startIcon={<Download size={14} />}
                                  onClick={() => handleDownloadPdf(prev)}
                                  sx={{ textTransform: "none" }}
                                >
                                  PDF
                                </Button>
                              </Box>
                            </Box>
                            <Typography variant="caption" sx={{ color: subColor }}>
                              {formatDate(prev.createdAt)} · {prev.assignee?.name || "—"}
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                              <ActionFormBody
                                formValues={prevValues}
                                editable={false}
                                onChange={() => {}}
                              />
                              {prev.responseNotes ? (
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    Response
                                  </Typography>
                                  <Typography sx={{ whiteSpace: "pre-wrap" }}>
                                    {prev.responseNotes}
                                  </Typography>
                                </Box>
                              ) : null}
                            </Box>
                          </Paper>
                        );
                      })
                    )}
                  </Box>
                )}
              </Box>
            ) : null}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={closeDialog} sx={{ textTransform: "none" }}>
              Close
            </Button>
            {versionTab === 0 && latestAction?.status !== "sent" ? (
              dialogMode === "edit" ? (
                <>
                  <Button
                    variant="outlined"
                    disabled={saving}
                    onClick={handleSaveDraft}
                    sx={{ textTransform: "none" }}
                  >
                    Save draft
                  </Button>
                  <Button
                    variant="contained"
                    disabled={saving}
                    startIcon={<Send size={16} />}
                    onClick={handleSend}
                    sx={{
                      textTransform: "none",
                      bgcolor: "#E89F17",
                      "&:hover": { bgcolor: "#cc8b14" },
                    }}
                  >
                    Send to reporter
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setDialogMode("edit")}
                  sx={{
                    textTransform: "none",
                    bgcolor: "#E89F17",
                    "&:hover": { bgcolor: "#cc8b14" },
                  }}
                >
                  Edit response
                </Button>
              )
            ) : null}
          </DialogActions>
        </Dialog>

        {/* Hidden print target for PDF export */}
        <Box
          sx={{
            position: "fixed",
            left: -10000,
            top: 0,
            width: 794,
            bgcolor: "#fff",
            zIndex: -1,
          }}
        >
          <Box ref={pdfRef}>
            {downloadTarget ? (
              <ActionPrintView
                action={downloadTarget}
                formValues={actionToFormValues(downloadTarget)}
              />
            ) : null}
          </Box>
        </Box>

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.message}
          </Alert>
        </Snackbar>
      </PageContent>
    </Layout>
  );
}
