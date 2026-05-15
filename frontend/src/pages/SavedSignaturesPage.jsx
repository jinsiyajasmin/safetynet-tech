import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Stack,
} from "@mui/material";
import { PenLine, Plus, Trash2, Save } from "lucide-react";
import Layout from "../components/Layout";
import SignatureCapture from "../components/SignatureCapture";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getSavedSignatureStorageKey } from "../utils/savedSignatureLibrary";

const makeId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `sig-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function SavedSignaturesPage() {
  const { isDarkMode } = useTheme();
  const { currentUser } = useAuth();
  const userId = currentUser?.id || currentUser?._id || "me";
  const lsKey = useMemo(() => getSavedSignatureStorageKey(userId), [userId]);

  const [items, setItems] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(
            parsed.map((row) => ({
              id: row.id || makeId(),
              label: typeof row.label === "string" ? row.label : "",
              image: typeof row.image === "string" && row.image ? row.image : null,
            }))
          );
          return;
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setItems([{ id: makeId(), label: "Signature 1", image: null }]);
  }, [lsKey]);

  const persist = useCallback(() => {
    try {
      const payload = items.map(({ id, label, image }) => ({
        id,
        label: (label || "").trim(),
        image: image || null,
      }));
      localStorage.setItem(lsKey, JSON.stringify(payload));
      setSnack({ open: true, message: "Saved on this device. You can copy these into forms when needed.", severity: "success" });
    } catch (e) {
      console.error(e);
      setSnack({
        open: true,
        message: "Could not save (browser storage may be full). Remove a signature or use smaller images.",
        severity: "error",
      });
    }
  }, [items, lsKey]);

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      { id: makeId(), label: `Signature ${prev.length + 1}`, image: null },
    ]);
  };

  const removeRow = (id) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  };

  const updateRow = (id, patch) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const headingColor = isDarkMode ? "#F9FAFB" : "#111827";
  const subColor = isDarkMode ? "#9CA3AF" : "#6B7280";

  return (
    <Layout pageTitle="Saved signatures">
      <Box sx={{ maxWidth: 720, mx: "auto", py: 2, px: { xs: 2, md: 0 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              bgcolor: "rgba(232, 159, 23, 0.12)",
              color: "#E89F17",
              display: "flex",
            }}
          >
            <PenLine size={22} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: headingColor }}>
              Saved signatures
            </Typography>
            <Typography sx={{ color: subColor, fontSize: "0.95rem", mt: 0.5 }}>
              Draw or upload each signature, give it a name, then save. Stored only on this browser for your account.
            </Typography>
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Save size={18} />}
            onClick={persist}
            sx={{
              bgcolor: "#E89F17",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#cc8b14" },
            }}
          >
            Save
          </Button>
          <Button
            variant="outlined"
            startIcon={<Plus size={18} />}
            onClick={addRow}
            sx={{ textTransform: "none", borderColor: isDarkMode ? "#4B5563" : "#E5E7EB", color: headingColor }}
          >
            Add signature
          </Button>
        </Stack>

        <Stack spacing={2.5}>
          {items.map((row, index) => (
            <Paper
              key={row.id}
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
                bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF",
              }}
            >
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <Typography sx={{ fontWeight: 600, color: headingColor }}>
                  Signature {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  aria-label="Remove signature"
                  disabled={items.length <= 1}
                  onClick={() => removeRow(row.id)}
                  sx={{ color: isDarkMode ? "#F87171" : "#DC2626" }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </Stack>
              <TextField
                label="Name (e.g. Site manager, Visitor)"
                fullWidth
                size="small"
                value={row.label}
                onChange={(e) => updateRow(row.id, { label: e.target.value })}
                sx={{ mb: 2 }}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <SignatureCapture
                value={row.image}
                onChange={(url) => updateRow(row.id, { image: url })}
                readOnly={false}
                savedLibraryEnabled={false}
              />
            </Paper>
          ))}
        </Stack>
      </Box>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
