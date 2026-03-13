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
import Layout from "../components/Layout";

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

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Process answers to handle files
      const processedAnswers = {};
      for (const [key, value] of Object.entries(values)) {
        if (value instanceof File) {
          // specific handling for file uploads - convert to base64
          processedAnswers[key] = await toBase64(value);
        } else if (!key.endsWith("_preview")) {
          // exclude preview urls
          processedAnswers[key] = value;
        }
      }

      await api.post(`/forms/${id}/responses`, {
        formId: id,
        answers: processedAnswers,
      });

      // ✅ Show success modal instead of alert
      setSuccessOpen(true);

    } catch (err) {
      console.error("Submit failed", err);
      const msg = err.response?.data?.message || "Failed to submit form";
      alert(msg);
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
    <Layout>
      <Box sx={{ flex: 1, px: { xs: 2, md: 5 }, py: 4, overflowY: "auto" }}>


        <Paper sx={{ p: 3, maxWidth: 900 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: form.titleColor, textAlign: form.titleAlignment || "left" }}>
            {form.title}
          </Typography>
          {form.fields.map((f) => (
            <Box key={f.id} sx={{ mb: 3 }}>
              {f.type !== "section_header" && (
                <Typography sx={{ fontWeight: 600, mb: 1 }}>
                  {f.label} {f.required && "*"}
                </Typography>
              )}

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

              {/* Section Header Renderer */}
              {f.type === "section_header" && (
                <Box sx={{ width: '100%', textAlign: f.alignment || 'left', mt: 2, mb: 1 }}>
                  {f.subheading && (
                    <Typography variant="h6" sx={{ fontWeight: 600, color: f.color || '#000' }}>
                      {f.subheading}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Image Upload Renderer */}
              {f.type === "image_upload" && (
                <Box>
                  {values[f.id + "_preview"] ? (
                    <Box sx={{ mb: 2, position: 'relative', display: 'inline-block' }}>
                      <Box component="img" src={values[f.id + "_preview"]} alt="uploaded" sx={{ maxWidth: '100%', maxHeight: 300, borderRadius: 2, border: '1px solid #ddd' }} />
                      <Button size="small" color="error" onClick={() => {
                        // clear
                        setValues(prev => {
                          const next = { ...prev };
                          delete next[f.id];
                          delete next[f.id + "_preview"];
                          return next;
                        });
                      }} sx={{ display: 'block', mt: 1 }}>Remove</Button>
                    </Box>
                  ) : (
                    <Button variant="outlined" component="label" fullWidth sx={{ height: 100, borderStyle: 'dashed' }}>
                      Upload Image
                      <input hidden accept="image/*" type="file" onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          // Store file object in value, and preview URL in _preview
                          setValues(prev => ({ ...prev, [f.id]: file, [f.id + "_preview"]: url }));
                        }
                      }} />
                    </Button>
                  )}
                </Box>
              )}

              {/* Signature Renderer */}
              {f.type === "signature" && (
                <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 2, height: 120, bgcolor: "#f8fafc", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Typography color="text.secondary">Tap to sign (Implementation pending)</Typography>
                </Box>
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
    </Layout>
  );
}
