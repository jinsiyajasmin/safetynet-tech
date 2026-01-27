import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";

export default function UseForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);


  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await api.get(`/forms/${id}`);
        if (res?.data?.success) {
          setForm(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load form", err);
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  const handleChange = (fieldId, value) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  };



  const handleCheckboxToggle = (fieldId, option) => {
    setValues((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      return {
        ...prev,
        [fieldId]: current.includes(option)
          ? current.filter((v) => v !== option)
          : [...current, option],
      };
    });
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.post(`/forms/${id}/responses`, {
        formId: id,
        answers: values,
      });

      // ✅ Show success modal instead of alert
      setSuccessOpen(true);

    } catch (err) {
      console.error("Submit failed", err);
      alert("Failed to submit form");
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return <Typography sx={{ p: 4 }}>Form not found</Typography>;
  }

  return (
    <>
      <TopNav />

      <Box sx={{ display: "flex", bgcolor: "#fff" }}>
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
            overflowY: "auto",
          }}
        >


          <Paper sx={{ p: 3, maxWidth: 900 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: form.titleColor, textAlign: form.titleAlignment || "left" }}>
              {form.title}
            </Typography>
            {form.fields.map((f) => (
              <Box key={f.id} sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {f.label} {f.required && "*"}
                </Typography>

                {f.type === "text" && (
                  <TextField
                    fullWidth
                    value={values[f.id] || ""}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                  />
                )}

                {f.type === "textarea" && (
                  <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    value={values[f.id] || ""}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                  />
                )}

                {f.type === "select" && (
                  <TextField
                    select
                    fullWidth
                    value={values[f.id] || ""}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                  >
                    {f.options?.map((o) => (
                      <MenuItem key={o.id} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {f.type === "radio" && (
                  <RadioGroup
                    value={values[f.id] || ""}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                  >
                    {f.options?.map((o) => (
                      <FormControlLabel
                        key={o.id}
                        value={o.value}
                        control={<Radio />}
                        label={o.label}
                      />
                    ))}
                  </RadioGroup>
                )}

                {f.type === "checkbox" && (
                  <Box>
                    {f.options?.map((o) => (
                      <FormControlLabel
                        key={o.id}
                        control={
                          <Checkbox
                            checked={(values[f.id] || []).includes(o.value)}
                            onChange={() =>
                              handleCheckboxToggle(f.id, o.value)
                            }
                          />
                        }
                        label={o.label}
                      />
                    ))}
                  </Box>
                )}

                {f.type === "date" && (
                  <TextField
                    type="date"
                    fullWidth
                    value={values[f.id] || ""}
                    onChange={(e) => handleChange(f.id, e.target.value)}
                  />
                )}
              </Box>
            ))}

            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2, textTransform: "none" }}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Submitting..." : "Save"}
            </Button>
          </Paper>
        </Box>

        <Dialog open={successOpen} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Form Submitted 🎉
          </DialogTitle>

          <DialogContent>
            <Typography>
              Your response has been saved successfully.
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="contained"
              sx={{ textTransform: "none" }}
              onClick={() => {
                setSuccessOpen(false);
                navigate("/forms");
              }}
            >
              Go to Forms
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </>
  );
}
