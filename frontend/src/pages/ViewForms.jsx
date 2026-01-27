import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Button,
  IconButton,
  Paper,   // ✅ ADD THIS
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ViewListIcon from "@mui/icons-material/ViewList";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";


import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/TopNav";
import api from "../services/api";

export default function ViewForms() {
  const navigate = useNavigate();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);


  const deleteForm = async (id) => {
    try {
      await api.delete(`/forms/${id}`);

      setForms((prev) => prev.filter((f) => f._id !== id));

      // ✅ show success modal
      setDeleteSuccessOpen(true);
    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete form");
    }
  };



  const filteredForms = forms.filter((form) =>
    (form.title || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );


  const fetchForms = async () => {
    try {
      const res = await api.get("/forms");
      if (res?.data?.success) {
        setForms(res.data.data || []);
      } else {
        setForms([]);
      }
    } catch (err) {
      console.error("Failed to load forms", err);
      setForms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  return (
    <>
      <TopNav />

      <Box sx={{ display: "flex", bgcolor: "#ffffff" }}>
        {/* Sidebar */}
        <Box
          component="aside"
          sx={{
            width: { xs: 0, md: 260 },
            position: "sticky",
            top: "64px",
            height: "calc(100vh - 64px)",
          }}
        >
          <Sidebar />
        </Box>

        {/* Main */}
        <Box
          component="main"
          sx={{
            flex: 1,
            px: { xs: 2, md: 5 },
            py: 4,
            height: "calc(100vh - 64px)",
            overflowY: "auto",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Forms
            </Typography>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {/* Search */}
              <TextField
                size="small"
                placeholder="Search forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 220 }}
              />

              {/* Create */}
              <Button
                variant="contained"
                onClick={() => navigate("/form-build")}
                sx={{ textTransform: "none", borderRadius: 2, ml: 1 }}
              >
                Create New Form
              </Button>
            </Box>
          </Box>


          {/* Loading */}
          {loading && (
            <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Empty state */}
          {!loading && forms.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No forms created yet
              </Typography>
              <Typography color="text.secondary">
                Click “Create New Form” to build your first form.
              </Typography>
            </Box>
          )}

          {/* Forms list */}
          {!loading && filteredForms.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredForms.map((form) => (
                <Paper
                  key={form._id}
                  variant="outlined"
                  sx={{
                    px: 3,
                    py: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderRadius: 2,
                  }}
                >
                  {/* LEFT */}
                  <Box>
                    <Typography fontWeight={600}>
                      {form.title || "Untitled Form"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Fields: {form.fields?.length || 0}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Created on{" "}
                      {form.createdAt
                        ? new Date(form.createdAt).toLocaleDateString()
                        : "—"}
                    </Typography>
                  </Box>

                  {/* RIGHT */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/forms/${form._id}`)}
                    >
                      View
                    </Button>

                    <IconButton
                      color="error"
                      onClick={() => setDeleteId(form._id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}

        </Box>
        <Dialog
          open={!!deleteId}
          onClose={() => setDeleteId(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Delete Form?
          </DialogTitle>

          <DialogContent>
            <Typography>
              Are you sure you want to delete this form?
              This action cannot be undone.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDeleteId(null)}>
              Cancel
            </Button>

            <Button
              color="error"
              variant="contained"
              onClick={() => {
                deleteForm(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>


        <Dialog
          open={deleteSuccessOpen}
          onClose={() => setDeleteSuccessOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 700 }}>
            Deleted Successfully ✅
          </DialogTitle>

          <DialogContent>
            <Typography>
              The form has been deleted successfully.
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button
              variant="contained"
              onClick={() => setDeleteSuccessOpen(false)}
              sx={{ textTransform: "none" }}
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

      </Box>

    </>
  );
}
