import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogContent,
  Snackbar,
  Alert,
  DialogTitle,
  DialogActions,
  Button,



} from "@mui/material";
import {
  ToggleOff as ToggleOffIcon,
  ToggleOn as ToggleOnIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/TopNav";
import api from "../services/api";

/* Helper to compute avatar/url */
const computeAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;
  const host = "https://safetynet-tech-zavg.vercel.app";
  return `${host.replace(/\/$/, "")}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

export default function UsersPage() {
  const { id } = useParams(); // optional client id
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  // Access Management State
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessUser, setAccessUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("user");

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);

  const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });

  // get current user (try localStorage then fallback to /auth/me)
  const getCurrentUser = async () => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        /* ignore */
      }
    }
    try {
      const res = await api.get("/auth/me");
      return res?.data?.user ?? null;
    } catch {
      return null;
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const current = await getCurrentUser();
      const isSuper = current?.role === "superadmin";
      // Check if Safetynett
      const isSafetynett = (current?.companyname || current?.company || "")
        .toString()
        .trim()
        .toLowerCase() === "safetynett";

      // If regular user (not admin/super), show nothing? Or handling logic:
      if (current?.role === "user") {
        setUsers([]);
        setLoading(false);
        return;
      }

      let res;
      if (id) {
        // fetching by client ID
        res = await api.get(`/clients/${id}/users`);
      } else {
        // fetch all users (backend usually gives all)
        res = await api.get("/users");
      }

      let list = res?.data?.users ?? res?.data ?? [];

      // FILTERS:
      // 1. If NOT SuperAdmin AND NOT Safetynett => Filter by my company
      if (!isSuper && !isSafetynett) {
        const myCompany = (current?.companyname || current?.company || "").trim().toLowerCase();

        console.log("Filtering users for company:", myCompany); // Debug log

        list = list.filter(u => {
          const uCompany = (u.companyname || u.company || "").trim().toLowerCase();
          return uCompany === myCompany;
        });
      }

      // stable sort by creation so id numbers are consistent (oldest first)
      const sorted = [...list].sort((a, b) => {
        const ta = new Date(a.createdAt || a._id);
        const tb = new Date(b.createdAt || b._id);
        return ta - tb;
      });
      setUsers(sorted);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setSnack({ open: true, msg: "Failed to load users", severity: "error" });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [id]);

  const openMenu = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  // toggle active/inactive
  const toggleActive = async (user) => {
    try {
      const newActive = !user.active;
      const res = await api.put(`/users/${user._id ?? user.id}/status`, { active: newActive });

      if (res?.data?.success) {
        setUsers((prev) => prev.map((u) => ((u._id ?? u.id) === (user._id ?? user.id) ? { ...u, active: newActive } : u)));
        setSnack({ open: true, msg: newActive ? "User activated" : "User deactivated", severity: "success" });
      } else {
        throw new Error(res?.data?.message || "Failed to update");
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      setSnack({ open: true, msg: "Failed to update user status", severity: "error" });
    } finally {
      closeMenu();
    }
  };

  const handleView = async (user) => {
    try {

      const id = user._id ?? user.id;
      const res = await api.get(`/users/${id}`);
      const fullUser = res?.data?.user ?? user;
      setDetailUser(fullUser);
    } catch (err) {
      console.warn("Could not fetch full user, using local copy", err);
      setDetailUser(user);
    }
    setDetailOpen(true);
    closeMenu();
  };


  const closeDetails = () => {
    setDetailOpen(false);
    setDetailUser(null);
  };

  // Manage Access Handlers
  const handleManageAccess = (user) => {
    setAccessUser(user);
    setSelectedRole(user.role || "user");
    setAccessDialogOpen(true);
    closeMenu();
  };

  const handleSaveAccess = async () => {
    if (!accessUser) return;
    try {
      const res = await api.put(`/users/${accessUser._id ?? accessUser.id}`, {
        role: selectedRole
      });

      if (res?.data?.success) {
        setSnack({ open: true, msg: "User role updated", severity: "success" });
        // update local list
        setUsers(prev => prev.map(u =>
          (u._id ?? u.id) === (accessUser._id ?? accessUser.id)
            ? { ...u, role: selectedRole }
            : u
        ));
        setAccessDialogOpen(false);
        setAccessUser(null);
      } else {
        throw new Error(res?.data?.message || "Failed");
      }
    } catch (err) {
      console.error("Update role error:", err);
      setSnack({ open: true, msg: "Failed to update role", severity: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      const res = await api.delete(`/users/${deleteUser._id ?? deleteUser.id}`);
      if (res?.data?.success) {
        setUsers((prev) => prev.filter((u) => (u._id ?? u.id) !== (deleteUser._id ?? deleteUser.id)));
        setSnack({ open: true, msg: "User deleted successfully", severity: "success" });
      } else {
        throw new Error(res?.data?.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      setSnack({ open: true, msg: "Failed to delete user", severity: "error" });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteUser(null);
    }
  };

  return (
    <>
      <TopNav />
      <Box sx={{ display: "flex", height: "calc(100vh - 0px)", bgcolor: "#ffffff" }}>
        {/* Sidebar */}
        <Box
          component="aside"
          sx={{
            width: { xs: 0, md: 260 },
            flexShrink: 0,
            alignSelf: "flex-start",
            position: "sticky",
            top: "64px",
            height: "calc(100vh - 64px)",
            overflow: "visible",
            p: 0,
          }}
        >
          <Sidebar sx={{ height: "100%" }} />
        </Box>

        {/* Main */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            px: { xs: 2, sm: 3, md: 6 },
            py: { xs: 4, md: 6 },
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Users
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                display: "inline-block",
                px: 1.5,
                py: 0.5,
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "#0B4DA6", // dark blue text
                backgroundColor: "rgba(11, 77, 166, 0.1)", // light transparent blue background
                borderRadius: "12px", // rounded badge look
              }}
            >
              {users.length} members
            </Typography>

          </Box>

          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#fafafa" }}>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {users.map((user, idx) => (
                    <TableRow key={user._id ?? user.id} hover>
                      <TableCell>{idx + 1}</TableCell>

                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                          {user.avatar ? (
                            <Box
                              component="img"
                              src={computeAvatarUrl(user.avatar)}
                              alt="avatar"
                              sx={{ width: 40, height: 40, borderRadius: 1, objectFit: "cover" }}
                            />
                          ) : (
                            <Avatar sx={{ width: 40, height: 40 }}>
                              {(user.firstName || user.username || user.name || "?").charAt(0).toUpperCase()}
                            </Avatar>
                          )}

                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>{user.firstName ? `${user.firstName} ${user.lastName ?? ""}` : user.username ?? "(no name)"}</Typography>
                            <Typography color="text.secondary" sx={{ fontSize: "0.9rem" }}>
                              @{(user.username || (user.email?.split?.("@")?.[0]) || "").toString()}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 500 }}>{user.email ?? "-"}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography sx={{ fontWeight: 500 }}>{user.companyname ?? "-"}</Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.role || 'user'}
                          size="small"
                          sx={{
                            textTransform: "capitalize",
                            fontWeight: 600,
                            bgcolor: user.role === 'admin' || user.role === 'superadmin' ? 'rgba(11, 77, 166, 0.1)' : 'rgba(0,0,0,0.06)',
                            color: user.role === 'admin' || user.role === 'superadmin' ? '#0B4DA6' : 'inherit'
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.active ? "active" : "inactive"}
                          size="small"
                          sx={{
                            textTransform: "lowercase",
                            borderRadius: "9999px",
                            fontWeight: 600,
                            px: 1,
                            bgcolor: user.active ? "rgba(34, 197, 94, 0.15)" : "rgba(0,0,0,0.06)",
                            color: user.active ? "rgb(22, 163, 74)" : "rgb(107, 114, 128)",
                          }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => openMenu(e, user)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* actions menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (!menuUser) return closeMenu();
            toggleActive(menuUser);
          }}
        >
          {menuUser?.active ? (
            <>
              <ToggleOffIcon fontSize="small" sx={{ mr: 1 }} /> Make inactive
            </>
          ) : (
            <>
              <ToggleOnIcon fontSize="small" sx={{ mr: 1 }} /> Make active
            </>
          )}
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (!menuUser) return closeMenu();
            handleView(menuUser);
          }}
        >
          <OpenInNewIcon fontSize="small" sx={{ mr: 1 }} /> View details
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (!menuUser) return closeMenu();
            handleManageAccess(menuUser);
          }}
        >
          <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} /> Manage user access
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (!menuUser) return closeMenu();
            setDeleteUser(menuUser);
            setDeleteDialogOpen(true);
            closeMenu();
          }}
          sx={{ color: "error.main" }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete user
        </MenuItem>
      </Menu>

      {/* details dialog */}
      {/* details dialog */}
      <Dialog
        open={detailOpen}
        onClose={closeDetails}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2, // rounded modal
            overflow: "hidden",
          },
        }}
      >
        {/* custom header with grey bg and close icon */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "#f5f6f8", px: 3, py: 1.5 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              User details
            </Typography>

          </Box>
          <IconButton onClick={closeDetails} aria-label="close">
            {/* use MUI Close icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </IconButton>
        </Box>

        <DialogContent dividers sx={{ p: 3 }}>
          {detailUser ? (
            <Box sx={{ display: "grid", gap: 3 }}>
              {/* top: avatar + summary */}
              <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
                {detailUser.avatar ? (
                  <Box component="img" src={computeAvatarUrl(detailUser.avatar)} alt="avatar" sx={{ width: 96, height: 96, borderRadius: 2, objectFit: "cover" }} />
                ) : (
                  <Avatar sx={{ width: 96, height: 96 }}>{(detailUser.firstName || detailUser.username || "?").charAt(0).toUpperCase()}</Avatar>
                )}

                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {detailUser.firstName ? `${detailUser.firstName} ${detailUser.lastName ?? ""}` : detailUser.username ?? "(no name)"}
                  </Typography>
                  <Chip
                    label={detailUser.active ? "active" : "inactive"}
                    size="small"
                    sx={{
                      mt: 1,
                      textTransform: "lowercase",
                      borderRadius: "9999px",
                      fontWeight: 700,
                      bgcolor: detailUser.active ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.06)",
                      color: detailUser.active ? "rgb(22,163,74)" : "rgb(220,38,38)",
                      px: 1.25,
                    }}
                  />
                  <Typography color="text.secondary" sx={{ mt: 1 }}>{detailUser.jobTitle ?? "-"}</Typography>
                </Box>
              </Box>

              {/* contact / activity boxed area styled similar to your example */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fff", boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Contact information</Typography>

                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{detailUser.email ?? "-"}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{detailUser.mobile ?? "-"}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Company</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{detailUser.companyname ?? "-"}</Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fff", boxShadow: "0 6px 18px rgba(2,6,23,0.04)" }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Activity information</Typography>

                  <Box sx={{ display: "grid", gap: 1.25 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">Joined</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString() : "-"}</Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary">Role</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{detailUser.role ?? "-"}</Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* full detail table (spaced cells) */}

            </Box>
          ) : (
            <Box sx={{ display: "grid", placeItems: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Access Management Dialog */}
      <Dialog
        open={accessDialogOpen}
        onClose={() => setAccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <Box sx={{ bgcolor: "#f5f6f8", px: 3, py: 2, borderBottom: "1px solid #e0e0e0" }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Manage User Access
          </Typography>
        </Box>

        <DialogContent sx={{ p: 4 }}>
          <Typography sx={{ mb: 3 }}>
            Select the role for <strong>{accessUser?.firstName || accessUser?.username}</strong>.
          </Typography>

          <Box sx={{ display: 'grid', gap: 2 }}>
            {/* Admin Option */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                borderColor: selectedRole === 'admin' ? '#0B4DA6' : 'divider',
                bgcolor: selectedRole === 'admin' ? 'rgba(11,77,166,0.04)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#0B4DA6' }
              }}
              onClick={() => setSelectedRole('admin')}
            >
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                borderColor: selectedRole === 'admin' ? '#0B4DA6' : '#9ca3af',
                display: 'grid', placeItems: 'center'
              }}>
                {selectedRole === 'admin' && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0B4DA6' }} />}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>Admin</Typography>
                <Typography variant="caption" color="text.secondary">
                  Full access to manage users, reports, and settings.
                </Typography>
              </Box>
            </Paper>

            {/* User Option */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                borderColor: selectedRole === 'user' ? '#0B4DA6' : 'divider',
                bgcolor: selectedRole === 'user' ? 'rgba(11,77,166,0.04)' : 'transparent',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#0B4DA6' }
              }}
              onClick={() => setSelectedRole('user')}
            >
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                borderColor: selectedRole === 'user' ? '#0B4DA6' : '#9ca3af',
                display: 'grid', placeItems: 'center'
              }}>
                {selectedRole === 'user' && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#0B4DA6' }} />}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 700 }}>User</Typography>
                <Typography variant="caption" color="text.secondary">
                  Limited access based on assigned permissions.
                </Typography>
              </Box>
            </Paper>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            <Button onClick={() => setAccessDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleSaveAccess} variant="contained" color="primary">
              Save Changes
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteUser?.firstName} {deleteUser?.lastName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>


      {/* snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ open: false, msg: "" })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }} // ✅ top-right corner
        sx={{
          mt: 8, // pushes it slightly below the navbar
          mr: 2, // a little right margin
        }}
      >
        <Alert
          onClose={() => setSnack({ open: false, msg: "" })}
          severity={snack.severity || "info"}
          elevation={6}
          variant="filled"
          sx={{
            width: "100%",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(23, 176, 97, 0.15)", // ✅ transparent blue tone
            color: "#026f3eff", // text color matching your brand blue  // ✅ rounded corners
            fontWeight: 500,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)", // soft shadow for elegance
          }}

        >
          {snack.msg}
        </Alert>
      </Snackbar>

    </>
  );
}
