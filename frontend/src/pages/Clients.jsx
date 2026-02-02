import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Avatar,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  OpenInNew as OpenInNewIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/TopNav";
import api from "../services/api";

// helper to build absolute URL for logos saved as /uploads/filename
const computeLogoUrl = (logo) => {
  if (!logo) return null;
  if (/^https?:\/\//i.test(logo)) return logo;
  const host = "https://safetynet-tech-7qme.vercel.app";
  return `${host.replace(/\/$/, "")}${logo.startsWith("/") ? "" : "/"}${logo}`;
};

export default function ClientsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const CARD_WIDTH = 300;
  const CARD_HEIGHT = 220;

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // menu / selection
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // snackbar
  const [successMsg, setSuccessMsg] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // create / edit modal
  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // true => edit, false => create
  const [form, setForm] = useState({ name: "", file: null, preview: "", existingLogo: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const previewRef = useRef("");

  // navigate to users of a client
  const onOpen = (client) => {
    const id = client?._id ?? client?.id;
    if (id) navigate(`/clients/${id}/users`);
  };

  // fetch clients
  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const res = await api.get("/clients");
      if (res?.data?.clients) setClients(res.data.clients);
      else if (Array.isArray(res?.data)) setClients(res.data);
      else setClients([]);
    } catch (err) {
      console.error("Failed to load clients", err);
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    fetchClients();
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current);
      }
    };
  }, []);

  // ---- modal open for create ----
  const openCreateModal = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }
    setIsEditMode(false);
    setForm({ name: "", file: null, preview: "", existingLogo: null });
    setErrors({});
    setOpenModal(true);
  };

  // ---- modal open for edit ----
  const openEditModal = (client) => {
    if (!client) return;
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }
    setIsEditMode(true);
    setForm({
      name: client.name || "",
      file: null,
      preview: "",
      existingLogo: client.logo || null, // path like /uploads/...
    });
    setErrors({});
    setOpenModal(true);
  };

  const closeModal = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }
    setOpenModal(false);
    setForm({ name: "", file: null, preview: "", existingLogo: null });
    setErrors({});
  };

  const handleChange = (key) => (e) => {
    if (key === "file") {
      const file = e.target.files && e.target.files[0];
      if (!file) {
        if (previewRef.current) {
          URL.revokeObjectURL(previewRef.current);
          previewRef.current = "";
        }
        setForm((s) => ({ ...s, file: null, preview: "" }));
        return;
      }
      const preview = URL.createObjectURL(file);
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current = preview;
      setForm((s) => ({ ...s, file, preview }));
      setErrors((prev) => ({ ...prev, file: undefined }));
    } else {
      setForm((s) => ({ ...s, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = () => {
    const e = {};
    if (!form.name || !form.name.trim()) e.name = "Client name is required";
    if (form.file) {
      const allowed = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/svg+xml",
        "image/webp",
      ];
      if (!allowed.includes(form.file.type)) e.file = "Only PNG/JPG/GIF/SVG/WebP images allowed";
      if (form.file.size > 2 * 1024 * 1024) e.file = "File size must be < 2 MB";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // create handler
  // inside Clients.jsx
  // --- create handler (robust) ---
  const handleCreate = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", form.name.trim());
      if (form.file) data.append("logo", form.file);

      const res = await api.post("/clients", data);
      // accept either res.data.client or res.data as the created object
      const created = res?.data?.client ?? res?.data;

      if (created) {
        // Normalize the created client to have _id and/or id
        const normalized = {
          _id: created.id ?? created._id ?? created._id,
          id: created.id ?? (created._id ? created._id.toString() : undefined),
          name: created.name,
          logo: created.logo ?? created.logoUrl ?? created.logo_url ?? null,
          ...created,
        };

        // add new client to top of list
        setClients((prev) => [normalized, ...prev]);

        setSuccessMsg("Client created successfully!");
        setOpenSnackbar(true);
      } else {
        // fallback: refetch
        await fetchClients();
      }

      closeModal();
      // replace catch in handleCreate
    } catch (err) {
      console.error("Create client failed", err);
      console.error("Requested URL:", err.config?.url);
      console.error("Full request config:", err.config);
      console.error("Status:", err.response?.status);
      console.error("Response data:", err.response?.data);
      const data = err?.response?.data;
      if (data?.message) setErrors((p) => ({ ...p, form: data.message }));
    }
    finally {
      setSubmitting(false);
    }
  };


  // update handler
  const handleUpdate = async (id) => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", form.name.trim());
      if (form.file) data.append("logo", form.file);

      const res = await api.put(`/clients/${id}`, data);
      const updated = res?.data?.client;
      if (updated) {
        setClients((prev) =>
          prev.map((c) => (c.id === id || c._id === id ? updated : c))
        );
        setSuccessMsg("Client updated successfully!");
        setOpenSnackbar(true);
      } else {
        await fetchClients();
      }
      closeModal();
    } catch (err) {
      console.error("Update client failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- DELETE handlers ----
  const handleMenuOpen = (e, client) => {
    setMenuAnchor(e.currentTarget);
    setSelectedClient(client);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
  };
  const confirmDelete = () => {
    setMenuAnchor(null);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedClient) {
      setDeleteDialogOpen(false);
      return;
    }
    const id = selectedClient.id || selectedClient._id;
    try {
      const res = await api.delete(`/clients/${id}`);
      if (res?.data?.success) {
        setClients((prev) => prev.filter((c) => c.id !== id && c._id !== id));
        setSuccessMsg("Client deleted successfully!");
        setOpenSnackbar(true);
      } else {
        // optional: show backend message if any
        console.warn("Delete returned:", res?.data);
      }
    } catch (err) {
      console.error("Delete client failed:", err);
    } finally {
      setDeleteDialogOpen(false);
      setSelectedClient(null);
    }
  };

  const firstChar = (s) => (s && s.length ? s[0].toUpperCase() : "?");

  // Determine if user is Safetynett or SuperAdmin
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setCurrentUser(u);
      } catch (e) {
        console.error("Parse user error", e);
      }
    }
  }, []);

  const isSafetynettOrAdmin = currentUser?.role === "superadmin" ||
    (currentUser?.companyname || currentUser?.company || "").trim().toLowerCase() === "safetynett";

  return (
    <>
      <TopNav />
      <Box sx={{ display: "flex", height: "calc(100vh - 0px)", bgcolor: "#ffffff" }}>
        {/* Sidebar (sticky) */}
        <Box
          component="aside"
          sx={{
            width: { xs: 0, md: 260 },
            flexShrink: 0,
            alignSelf: "flex-start",         // allow sticky to work correctly
            position: "sticky",
            top: "64px",                      // adjust if your TopNav height is different
            height: "calc(100vh - 64px)",     // keep sidebar full height minus nav
            overflow: "visible",              // DO NOT make the aside itself the scroll container
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
            overflow: "auto",                 // main area scrolls
            px: { xs: 2, sm: 3, md: 6 },
            py: { xs: 4, md: 6 },
            height: "calc(100vh - 64px)",     // match top offset so scroll region is correct
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Clients</Typography>

            {isSafetynettOrAdmin && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal} sx={{ textTransform: "none", borderRadius: 2, bgcolor: "#013a63", "&:hover": { bgcolor: "#075692" } }}>
                Create new client
              </Button>
            )}
          </Box>

          {loadingClients ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 12 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {clients.map((client) => (
                <Grid key={client.id ?? client._id ?? client.name} item xs={12} sm={6} md={4} lg={3}>
                  <Card variant="outlined" sx={{ width: CARD_WIDTH, height: CARD_HEIGHT, display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: 2, boxShadow: "0 6px 18px rgba(2,6,23,0.04)", transition: "transform .15s ease, box-shadow .15s ease", "&:hover": { transform: "translateY(-6px)", boxShadow: "0 14px 28px rgba(2,6,23,0.10)" }, position: "relative" }}>

                    {isSafetynettOrAdmin && (
                      <IconButton sx={{ position: "absolute", top: 4, right: 4, color: "gray" }} onClick={(e) => handleMenuOpen(e, client)}>
                        <MoreVertIcon />
                      </IconButton>
                    )}

                    <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", flexGrow: 1, textAlign: "center", gap: 1.5 }}>
                      <Box sx={{ width: 72, height: 72, borderRadius: 1.5, display: "grid", placeItems: "center", background: "rgba(2,6,23,0.03)", overflow: "hidden" }}>
                        {client?.logo ? (
                          <Box component="img" src={computeLogoUrl(client.logo)} alt="logo" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                        ) : (
                          <Avatar sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.light, color: "white", fontWeight: 700 }}>{firstChar(client?.name)}</Avatar>
                        )}
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, textAlign: "center" }} noWrap>{client?.name}</Typography>
                    </CardContent>

                    <CardActions sx={{ justifyContent: "flex-start", pb: 2 }}>
                      {/* Safetynett users can open ANY client. Others can open only non-Safetynett clients (logic preserved, but Safetynett override added) */}
                      {(isSafetynettOrAdmin || String(client.name).toLowerCase() !== "safetynett") && (
                        <Button variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => onOpen(client)} sx={{ textTransform: "none", borderRadius: 1.5, px: 3, py: 0.5, fontSize: "1rem" }}>
                          Open
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>

      {/* Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
        <MenuItem onClick={() => { handleMenuClose(); openEditModal(selectedClient); }}>Edit</MenuItem>
        <MenuItem onClick={confirmDelete} sx={{ color: "red" }}>Delete</MenuItem>
      </Menu>

      {/* Delete confirm */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Client</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete <b>{selectedClient?.name || "this client"}</b>? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ textTransform: "none" }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Create / Edit modal */}
      <Dialog open={openModal} onClose={closeModal} maxWidth="xs" fullWidth>
        <DialogTitle>{isEditMode ? "Edit client" : "Create new client"}</DialogTitle>
        <DialogContent>
          <TextField label="Client name" fullWidth margin="dense" value={form.name} onChange={(e) => handleChange("name")(e)} error={!!errors.name} helperText={errors.name} />

          <Box sx={{ mt: 1, display: "flex", gap: 2, alignItems: "center" }}>
            <Box>
              <input id="client-logo-file" type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleChange("file")(e)} />
              <label htmlFor="client-logo-file">
                <Button variant="outlined" component="span" size="small">Choose logo</Button>
              </label>
            </Box>

            {/* show new preview if selected, otherwise show existingLogo if editing */}
            {form.preview ? (
              <Box component="img" src={form.preview} alt="preview" sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1 }} />
            ) : form.existingLogo ? (
              <Box component="img" src={computeLogoUrl(form.existingLogo)} alt="existing logo" sx={{ width: 72, height: 72, objectFit: "cover", borderRadius: 1 }} />
            ) : (
              <Typography color="text.secondary">No image selected</Typography>
            )}
          </Box>

          {errors.file && (<Typography color="error" sx={{ mt: 1 }}>{errors.file}</Typography>)}
          {errors.form && (<Typography color="error" sx={{ mt: 1 }}>{errors.form}</Typography>)}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={() => { isEditMode ? handleUpdate(selectedClient?.id || selectedClient?._id) : handleCreate(); }} disabled={submitting} sx={{ textTransform: "none", bgcolor: "#013a63", "&:hover": { bgcolor: "#075692" } }}>
            {submitting ? <CircularProgress size={20} /> : isEditMode ? "Save changes" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: "100%" }}>{successMsg}</Alert>
      </Snackbar>
    </>
  );
}
