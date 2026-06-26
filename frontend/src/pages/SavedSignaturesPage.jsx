import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import { PenLine, Plus, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import SignatureCapture from "../components/SignatureCapture";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  loadSavedSignaturesWithMigration,
  syncSavedSignatures,
} from "../utils/savedSignatureLibrary";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sig-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function mapSavedRow(row) {
  return {
    id: row.id || makeId(),
    label: typeof row.label === "string" ? row.label.trim() : "",
    image: typeof row.image === "string" && row.image ? row.image : null,
  };
}

function hasDisplayableImage(row) {
  return Boolean(row?.image);
}

export default function SavedSignaturesPage() {
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const userId = currentUser?.id || currentUser?._id || "me";

  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const [addOpen, setAddOpen] = useState(false);
  const [addModalKey, setAddModalKey] = useState(0);
  const [draftName, setDraftName] = useState("");
  const [draftImage, setDraftImage] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const headingColor = isDarkMode ? "#F9FAFB" : "#111827";
  const subColor = isDarkMode ? "#9CA3AF" : "#6B7280";
  const borderColor = isDarkMode ? "#374151" : "#E5E7EB";
  const paperBg = isDarkMode ? "#1B212C" : "#FFFFFF";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { signatures: loaded, migrated, offline } =
          await loadSavedSignaturesWithMigration(userId);
        if (cancelled) return;
        setSignatures(loaded.filter(hasDisplayableImage).map(mapSavedRow));
        if (migrated) {
          setSnack({
            open: true,
            message: "Signatures from this browser were synced to your account.",
            severity: "success",
          });
        } else if (offline) {
          setSnack({
            open: true,
            message:
              "Could not reach the server. Showing signatures saved on this device only.",
            severity: "warning",
          });
        }
      } catch {
        if (!cancelled) {
          setSignatures([]);
          setSnack({
            open: true,
            message: "Could not load saved signatures. You can still add new ones.",
            severity: "warning",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persistSignatures = useCallback(async (next) => {
    setSaving(true);
    try {
      const saved = await syncSavedSignatures(next);
      const mapped = saved.filter(hasDisplayableImage).map(mapSavedRow);
      setSignatures(mapped);
      return mapped;
    } catch (e) {
      console.error(e);
      const message =
        e?.response?.data?.message ||
        "Could not save signatures. Check your connection and try again.";
      setSnack({ open: true, message, severity: "error" });
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const openAddModal = () => {
    setDraftName("");
    setDraftImage(null);
    setAddModalKey((k) => k + 1);
    setAddOpen(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setAddOpen(false);
    setDraftName("");
    setDraftImage(null);
  };

  const handleSaveNewSignature = async () => {
    const label = draftName.trim();
    if (!label) {
      setSnack({ open: true, message: "Please enter a name for this signature.", severity: "warning" });
      return;
    }
    if (!draftImage) {
      setSnack({
        open: true,
        message: "Please draw or upload a signature before saving.",
        severity: "warning",
      });
      return;
    }
    const next = [...signatures, { id: makeId(), label, image: draftImage }];
    try {
      await persistSignatures(next);
      setAddOpen(false);
      setDraftName("");
      setDraftImage(null);
      setSnack({
        open: true,
        message: "Signature saved to your account.",
        severity: "success",
      });
    } catch {
      /* snack shown in persistSignatures */
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const next = signatures.filter((row) => row.id !== deleteTarget.id);
    try {
      await persistSignatures(next);
      setSnack({ open: true, message: "Signature deleted.", severity: "success" });
      setDeleteTarget(null);
      const maxPage = Math.max(0, Math.ceil(next.length / rowsPerPage) - 1);
      if (page > maxPage) setPage(maxPage);
    } catch {
      /* snack shown in persistSignatures */
    }
  };

  const paginatedRows = signatures.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Layout pageTitle="Saved signatures">
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#E89F17" }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout pageTitle="Saved signatures">
      <Box sx={{ width: "100%", minWidth: 0, py: 2 }}>
        <Box
          sx={{
            mb: 4,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, minWidth: 0 }}>
            <Box
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: "rgba(232, 159, 23, 0.12)",
                color: "#E89F17",
                display: "flex",
                flexShrink: 0,
              }}
            >
              <PenLine size={22} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: headingColor, mb: 0.5 }}>
                Saved signatures
              </Typography>
              <Typography sx={{ color: subColor, fontSize: "0.95rem", mt: 0.5, maxWidth: 560 }}>
                Create named signatures you can reuse when filling in forms. Draw or upload an image,
                then pick it from any signature field across the app.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={openAddModal}
            disabled={saving || signatures.length >= 20}
            sx={{
              bgcolor: "#E89F17",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "8px",
              boxShadow: "none",
              flexShrink: 0,
              "&:hover": { bgcolor: "#cc8b14", boxShadow: "none" },
            }}
          >
            Add signature
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: `1px solid ${borderColor}`,
            bgcolor: paperBg,
            overflow: "hidden",
          }}
        >
          {signatures.length === 0 ? (
            <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 2,
                  bgcolor: "rgba(232, 159, 23, 0.1)",
                  color: "#E89F17",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <PenLine size={26} />
              </Box>
              <Typography sx={{ fontWeight: 600, color: headingColor, mb: 0.5 }}>
                No saved signatures yet
              </Typography>
              <Typography sx={{ color: subColor, fontSize: "0.9rem", mb: 3 }}>
                Add your first signature to use it quickly when completing forms.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Plus size={18} />}
                onClick={openAddModal}
                sx={{
                  bgcolor: "#E89F17",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#cc8b14" },
                }}
              >
                Add signature
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow
                      sx={{
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F9FAFB",
                        "& th": {
                          fontWeight: 600,
                          color: subColor,
                          fontSize: "0.8rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          borderBottom: `1px solid ${borderColor}`,
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell width={72}>SL No</TableCell>
                      <TableCell width={180}>Signature</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell width={100} align="right">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedRows.map((row, index) => {
                      const slNo = page * rowsPerPage + index + 1;
                      return (
                        <TableRow
                          key={row.id}
                          hover
                          sx={{
                            "& td": { borderBottom: `1px solid ${borderColor}`, py: 2 },
                            "&:last-child td": { borderBottom: 0 },
                          }}
                        >
                          <TableCell sx={{ color: headingColor, fontWeight: 500 }}>
                            {slNo}
                          </TableCell>
                          <TableCell>
                            <Box
                              component="img"
                              src={row.image}
                              alt={row.label || "Signature"}
                              sx={{
                                width: 140,
                                height: 56,
                                objectFit: "contain",
                                border: `1px solid ${borderColor}`,
                                borderRadius: 1.5,
                                bgcolor: "#fff",
                                p: 0.5,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: headingColor, fontWeight: 500 }}>
                            {row.label || "Untitled"}
                          </TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              aria-label="Delete signature"
                              disabled={saving}
                              onClick={() => setDeleteTarget(row)}
                              sx={{
                                color: isDarkMode ? "#F87171" : "#DC2626",
                                "&:hover": { bgcolor: isDarkMode ? "rgba(248,113,113,0.12)" : "rgba(220,38,38,0.08)" },
                              }}
                            >
                              <Trash2 size={18} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={signatures.length}
                page={page}
                onPageChange={(_, nextPage) => setPage(nextPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                sx={{
                  borderTop: `1px solid ${borderColor}`,
                  color: subColor,
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    color: subColor,
                  },
                }}
              />
            </>
          )}
        </Paper>
      </Box>

      <Dialog open={addOpen} onClose={closeAddModal} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700, color: headingColor, pb: 1 }}>
          Add signature
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TextField
            label="Name"
            placeholder="e.g. Site manager, Visitor"
            fullWidth
            size="small"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            disabled={saving}
            sx={{ mb: 2.5 }}
            InputProps={{ sx: { borderRadius: 2 } }}
          />
          <Typography variant="body2" sx={{ color: subColor, mb: 1.5 }}>
            Draw your signature below, or upload an image file.
          </Typography>
          <SignatureCapture
            key={`add-signature-${addModalKey}`}
            value={draftImage}
            onChange={setDraftImage}
            readOnly={saving}
            savedLibraryEnabled={false}
            autoApplyDrawing
            helperText=""
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeAddModal} disabled={saving} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveNewSignature}
            disabled={saving}
            sx={{
              bgcolor: "#E89F17",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#cc8b14" },
            }}
          >
            {saving ? "Saving…" : "Save signature"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !saving && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: headingColor }}>
          Delete signature?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: subColor }}>
            {deleteTarget
              ? `Remove "${deleteTarget.label || "Untitled"}" from your saved signatures? This cannot be undone.`
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={saving} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={saving}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {saving ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
