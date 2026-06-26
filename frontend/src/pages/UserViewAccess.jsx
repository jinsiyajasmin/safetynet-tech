import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Snackbar,
  Alert,
  TextField,
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
  Chip,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import Layout from "../components/Layout";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import UserPageAccessFields from "../components/UserPageAccessFields";
import { APP_PAGES } from "../constants/pageAccess";
import { VIEW_ONLY_FORBIDDEN_PAGE_KEYS, isViewOnlyUser } from "../utils/pageAccess";
import { formatLastSignIn } from "../utils/userPresence";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

function filterSelectablePages(pages) {
  return pages.filter((p) => !VIEW_ONLY_FORBIDDEN_PAGE_KEYS.has(p.key));
}

function normalizeUser(user) {
  if (!user || typeof user !== "object") return user;
  return {
    ...user,
    lastLoginAt: user.lastLoginAt ?? user.last_login_at ?? null,
    lastSeenAt: user.lastSeenAt ?? user.last_seen_at ?? null,
  };
}

function formatUserName(user) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return name || user?.username || "—";
}

function formatPageLabels(allowedPages, pageCatalog) {
  const keys = Array.isArray(allowedPages) ? allowedPages : [];
  if (!keys.length) return "—";
  const labelByKey = Object.fromEntries(pageCatalog.map((p) => [p.key, p.label]));
  return keys.map((key) => labelByKey[key] || key).join(", ");
}

function getUserId(user) {
  return user?._id ?? user?.id;
}

export default function UserViewAccessPage() {
  const { isDarkMode } = useTheme();
  const { isSuperAdmin } = useAuth();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [lookupMsg, setLookupMsg] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [selectedPages, setSelectedPages] = useState(["dashboard"]);
  const [pageCatalog, setPageCatalog] = useState(APP_PAGES);

  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  const [editUser, setEditUser] = useState(null);
  const [editPages, setEditPages] = useState(["dashboard"]);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);
  const [deleteInFlight, setDeleteInFlight] = useState(false);

  const emailValid = useMemo(
    () => /^\S+@\S+\.\S+$/.test(email.trim()),
    [email]
  );
  const showPageSelection = emailValid;

  const paginatedUsers = useMemo(
    () => users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [users, page, rowsPerPage]
  );

  const headCellSx = {
    fontWeight: 600,
    color: isDarkMode ? "#D1D5DB" : "#374151",
    fontSize: "0.85rem",
    whiteSpace: "nowrap",
  };

  const bodyCellSx = {
    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
  };

  const fieldSx = {
    mb: 2,
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
      "& fieldset": { borderColor: isDarkMode ? "#374151" : "#E5E7EB" },
      "&.Mui-focused fieldset": { borderColor: "#0B4DA6", borderWidth: 1.5 },
    },
  };

  const loadViewAccessUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/users/");
      const all = (res.data?.users || []).map(normalizeUser).filter(isViewOnlyUser);
      setUsers(all);
    } catch (err) {
      setSnack({
        open: true,
        msg: err?.response?.data?.message || "Failed to load users with view access",
        severity: "error",
      });
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    api.get("/users/page-access-catalog").then((res) => {
      if (res.data?.pages?.length) {
        setPageCatalog(filterSelectablePages(res.data.pages));
      }
    }).catch(() => {});
    loadViewAccessUsers();
  }, [isSuperAdmin, loadViewAccessUsers]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(users.length / rowsPerPage) - 1);
    if (page > maxPage) setPage(maxPage);
  }, [users.length, page, rowsPerPage]);

  const openMenu = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const lookupEmail = async () => {
    const trimmed = email.trim();
    if (!emailValid) {
      setLookupMsg("");
      return;
    }

    setCheckingEmail(true);
    try {
      const res = await api.post("/users/lookup-by-email", { email: trimmed });
      if (res.data?.exists) {
        setLookupMsg(
          res.data.user?.viewOnly || res.data.user?.accessMode === "view_only"
            ? "Existing user — a new invitation email will be sent."
            : "Existing user — they will receive a view-access invitation."
        );
      } else {
        setLookupMsg(res.data?.message || "New user — an invitation email will be sent.");
      }
    } catch (err) {
      setLookupMsg(err?.response?.data?.message || "");
    } finally {
      setCheckingEmail(false);
    }
  };

  const togglePage = (key) => {
    setSelectedPages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleEditPage = (key) => {
    setEditPages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetForm = () => {
    setEmail("");
    setLookupMsg("");
    setSelectedPages(["dashboard"]);
  };

  const closeInviteModal = () => {
    if (submitting) return;
    setInviteOpen(false);
    resetForm();
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();

    if (!emailValid) {
      setSnack({ open: true, msg: "Enter a valid email address.", severity: "warning" });
      return;
    }

    if (selectedPages.length === 0) {
      setSnack({ open: true, msg: "Select at least one page.", severity: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/users/invite-view-access", {
        email: email.trim(),
        allowedPages: selectedPages,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");

      const msg = res.data.emailSent
        ? res.data.message || "Invitation sent."
        : `${res.data.message || "Saved."} ${res.data.emailError || "Email could not be sent."}`;

      setSnack({
        open: true,
        msg,
        severity: res.data.emailSent ? "success" : "warning",
      });

      if (res.data.emailSent) {
        setInviteOpen(false);
        resetForm();
        loadViewAccessUsers();
      }
    } catch (err) {
      setSnack({
        open: true,
        msg: err?.response?.data?.message || err.message || "Failed to send invitation",
        severity: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAccess = (user) => {
    const pages = Array.isArray(user.allowedPages)
      ? user.allowedPages.filter((k) => k !== "profile" && k !== "account-settings")
      : [];
    setEditUser(user);
    setEditPages(pages.length ? pages : ["dashboard"]);
    closeMenu();
  };

  const handleSaveEditAccess = async () => {
    if (!editUser || editSaving) return;
    if (editPages.length === 0) {
      setSnack({ open: true, msg: "Select at least one page.", severity: "warning" });
      return;
    }

    const userId = getUserId(editUser);
    setEditSaving(true);
    try {
      const res = await api.put(`/users/${userId}`, {
        accessMode: "view_only",
        allowedPages: editPages,
      });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");

      setUsers((prev) =>
        prev.map((u) =>
          getUserId(u) === userId ? { ...u, allowedPages: editPages, accessMode: "view_only", viewOnly: true } : u
        )
      );
      setSnack({ open: true, msg: "Access pages updated.", severity: "success" });
      setEditUser(null);
    } catch (err) {
      setSnack({
        open: true,
        msg: err?.response?.data?.message || err.message || "Failed to update access",
        severity: "error",
      });
    } finally {
      setEditSaving(false);
    }
  };

  const toggleActive = async (user) => {
    const userId = getUserId(user);
    const previousActive = user.active !== false;
    const newActive = !previousActive;

    setUsers((prev) =>
      prev.map((u) => (getUserId(u) === userId ? { ...u, active: newActive } : u))
    );
    closeMenu();

    try {
      const res = await api.put(`/users/${userId}/status`, { active: newActive });
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      setSnack({
        open: true,
        msg: newActive ? "User activated." : "User deactivated.",
        severity: "success",
      });
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (getUserId(u) === userId ? { ...u, active: previousActive } : u))
      );
      setSnack({
        open: true,
        msg: err?.response?.data?.message || "Failed to update status",
        severity: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser || deleteInFlight) return;
    const userId = getUserId(deleteUser);
    setDeleteInFlight(true);
    try {
      const res = await api.delete(`/users/${userId}`);
      if (!res.data?.success) throw new Error(res.data?.message || "Failed");
      setUsers((prev) => prev.filter((u) => getUserId(u) !== userId));
      setSnack({ open: true, msg: "User deleted.", severity: "success" });
      setDeleteUser(null);
    } catch (err) {
      setSnack({
        open: true,
        msg: err?.response?.data?.message || err.message || "Failed to delete user",
        severity: "error",
      });
    } finally {
      setDeleteInFlight(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ width: "100%", minWidth: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, mb: 0.5, color: isDarkMode ? "#F9FAFB" : "#111827" }}
            >
              View access
            </Typography>
            <Typography
              variant="body2"
              sx={{ maxWidth: 720, color: isDarkMode ? "#9CA3AF" : "text.secondary" }}
            >
              Manage users with view-only access. Invite someone by email and choose which pages they can view.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => setInviteOpen(true)}
            startIcon={<PersonAddOutlinedIcon />}
            sx={{
              textTransform: "none",
              borderRadius: 50,
              px: 3,
              py: 1.1,
              bgcolor: "#0B57D0",
              fontWeight: 700,
              boxShadow: "none",
              flexShrink: 0,
              "&:hover": { bgcolor: "#0842A0", boxShadow: "none" },
            }}
          >
            Invite access
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            width: "100%",
            borderRadius: 4,
            bgcolor: isDarkMode ? "#1B212C" : "#FBFBFA",
            border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
            overflow: "hidden",
          }}
        >
          {loadingUsers ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={32} />
            </Box>
          ) : users.length === 0 ? (
            <Box sx={{ px: 3, py: 8, textAlign: "center" }}>
              <Typography sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280", mb: 2 }}>
                No users with view access yet.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => setInviteOpen(true)}
                sx={{ textTransform: "none", borderRadius: 50 }}
              >
                Invite access
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: isDarkMode ? "#111827" : "#F9FAFB" }}>
                      <TableCell sx={headCellSx}>SL No</TableCell>
                      <TableCell sx={headCellSx}>Name</TableCell>
                      <TableCell sx={headCellSx}>Email</TableCell>
                      <TableCell sx={headCellSx}>Pages</TableCell>
                      <TableCell sx={headCellSx}>Last login</TableCell>
                      <TableCell sx={headCellSx}>Status</TableCell>
                      <TableCell align="right" sx={headCellSx}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedUsers.map((user, idx) => {
                      const slNo = page * rowsPerPage + idx + 1;
                      const isActive = user.active !== false;
                      return (
                        <TableRow
                          key={getUserId(user)}
                          hover
                          sx={{
                            "&:last-child td": { borderBottom: 0 },
                            "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" },
                          }}
                        >
                          <TableCell sx={{ ...bodyCellSx, color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                            {slNo}
                          </TableCell>
                          <TableCell sx={{ ...bodyCellSx, color: isDarkMode ? "#F9FAFB" : "#111827", fontWeight: 500 }}>
                            {formatUserName(user)}
                          </TableCell>
                          <TableCell sx={{ ...bodyCellSx, color: isDarkMode ? "#D1D5DB" : "#4B5563" }}>
                            {user.email || "—"}
                          </TableCell>
                          <TableCell sx={bodyCellSx}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                maxWidth: 280,
                              }}
                              title={formatPageLabels(user.allowedPages, pageCatalog)}
                            >
                              {formatPageLabels(user.allowedPages, pageCatalog)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ ...bodyCellSx, color: isDarkMode ? "#9CA3AF" : "#6B7280", whiteSpace: "nowrap" }}>
                            {formatLastSignIn(user.lastLoginAt, user.lastSeenAt)}
                          </TableCell>
                          <TableCell sx={bodyCellSx}>
                            <Chip
                              label={isActive ? "Active" : "Inactive"}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: isActive
                                  ? (isDarkMode ? "rgba(34,197,94,0.15)" : "#F0FDF4")
                                  : (isDarkMode ? "rgba(239,68,68,0.15)" : "#FEF2F2"),
                                color: isActive ? "#16A34A" : "#EF4444",
                              }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={bodyCellSx}>
                            <IconButton
                              size="small"
                              onClick={(e) => openMenu(e, user)}
                              aria-label="User actions"
                              sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}
                            >
                              <MoreHorizIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                  px: { xs: 2, sm: 3 },
                  py: 1,
                  borderTop: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
                }}
              >
                <Typography variant="body2" sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                  Showing {users.length === 0 ? 0 : page * rowsPerPage + 1} to{" "}
                  {Math.min(page * rowsPerPage + rowsPerPage, users.length)} of {users.length}
                </Typography>
                <TablePagination
                  component="div"
                  count={users.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  sx={{
                    color: isDarkMode ? "#F9FAFB" : "inherit",
                    "& .MuiTablePagination-toolbar": { p: 0, minHeight: 48 },
                    "& .MuiTablePagination-selectIcon": { color: isDarkMode ? "#9CA3AF" : "inherit" },
                  }}
                />
              </Box>
            </>
          )}
        </Paper>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        PaperProps={{
          sx: {
            borderRadius: 3,
            mt: 1,
            minWidth: 200,
            bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF",
            border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
            p: 1,
          },
        }}
      >
        <MenuItem
          onClick={() => menuUser && handleEditAccess(menuUser)}
          sx={{ borderRadius: 2, py: 1, fontSize: "0.9rem" }}
        >
          <Pencil size={16} style={{ marginRight: 10 }} />
          Edit access pages
        </MenuItem>
        <MenuItem
          onClick={() => menuUser && toggleActive(menuUser)}
          sx={{ borderRadius: 2, py: 1, fontSize: "0.9rem" }}
        >
          {menuUser?.active !== false ? (
            <>
              <UserX size={16} style={{ marginRight: 10 }} />
              Make inactive
            </>
          ) : (
            <>
              <UserCheck size={16} style={{ marginRight: 10 }} />
              Make active
            </>
          )}
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            if (menuUser) setDeleteUser(menuUser);
            closeMenu();
          }}
          sx={{ borderRadius: 2, py: 1, fontSize: "0.9rem", color: "#EF4444" }}
        >
          <Trash2 size={16} style={{ marginRight: 10 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={inviteOpen}
        onClose={closeInviteModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
            color: isDarkMode ? "#F9FAFB" : "inherit",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: isDarkMode ? "1px solid #374151" : "1px solid #F3F4F6" }}>
          Invite view access
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? "#9CA3AF" : "text.secondary" }}>
              Enter their email and choose pages. We send an invitation with a link and a 6-digit code.
            </Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Email address
            </Typography>
            <TextField
              fullWidth
              type="email"
              autoComplete="email"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setLookupMsg("");
              }}
              onBlur={lookupEmail}
              sx={fieldSx}
              helperText={checkingEmail ? "Checking…" : lookupMsg}
            />
            {showPageSelection && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Select pages they can view
                </Typography>
                <UserPageAccessFields
                  viewOnly
                  onViewOnlyChange={() => {}}
                  selectedPages={selectedPages}
                  onTogglePage={togglePage}
                  pageCatalog={pageCatalog}
                  isDarkMode={isDarkMode}
                  forceViewOnly
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 0, gap: 1 }}>
            <Button onClick={closeInviteModal} disabled={submitting} sx={{ textTransform: "none", borderRadius: 50 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !showPageSelection || selectedPages.length === 0}
              startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
              sx={{
                textTransform: "none",
                borderRadius: 50,
                px: 3,
                bgcolor: "#0B57D0",
                fontWeight: 700,
                boxShadow: "none",
                "&:hover": { bgcolor: "#0842A0", boxShadow: "none" },
              }}
            >
              {submitting ? "Sending…" : "Send invitation"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(editUser)}
        onClose={() => !editSaving && setEditUser(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
            color: isDarkMode ? "#F9FAFB" : "inherit",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, borderBottom: isDarkMode ? "1px solid #374151" : "1px solid #F3F4F6" }}>
          Edit access pages
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editUser && (
            <>
              <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                Update which pages <strong>{formatUserName(editUser)}</strong> ({editUser.email}) can view.
              </Typography>
              <UserPageAccessFields
                viewOnly
                onViewOnlyChange={() => {}}
                selectedPages={editPages}
                onTogglePage={toggleEditPage}
                pageCatalog={pageCatalog}
                isDarkMode={isDarkMode}
                forceViewOnly
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setEditUser(null)}
            disabled={editSaving}
            sx={{ textTransform: "none", borderRadius: 50 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEditAccess}
            disabled={editSaving || editPages.length === 0}
            sx={{
              textTransform: "none",
              borderRadius: 50,
              px: 3,
              bgcolor: "#0B57D0",
              fontWeight: 700,
              boxShadow: "none",
              "&:hover": { bgcolor: "#0842A0", boxShadow: "none" },
            }}
          >
            {editSaving ? "Saving…" : "Save changes"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(deleteUser)}
        onClose={() => !deleteInFlight && setDeleteUser(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
            color: isDarkMode ? "#F9FAFB" : "inherit",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete user</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: isDarkMode ? "#F9FAFB" : "#111827" }}>
              {formatUserName(deleteUser)}
            </strong>
            ? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button
            onClick={() => setDeleteUser(null)}
            disabled={deleteInFlight}
            sx={{ textTransform: "none", borderRadius: 50 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleteInFlight}
            sx={{ textTransform: "none", borderRadius: 50, px: 3 }}
          >
            {deleteInFlight ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
