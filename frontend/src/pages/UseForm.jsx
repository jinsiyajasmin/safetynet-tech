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

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";
import { downloadPdfFromRef } from "../utils/pdfGenerator";
import { downloadWordFromForm } from "../utils/wordGenerator";
import { useRef } from "react";

// helper to build absolute URL for logos
const computeLogoUrl = (logo) => {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo;
    const host = import.meta.env.VITE_BACKEND_URL || "https://api.site-mateai.co.uk";
    return `${host.replace(/\/$/, "")}${logo.startsWith("/") ? "" : "/"}${logo}`;
};

export default function UseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const siteId = searchParams.get("siteId");
  const category = searchParams.get("category");
  const action = searchParams.get("action");
  const containerRef = useRef(null);
  
  const [downloading, setDownloading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);


  useEffect(() => {
    try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            const user = JSON.parse(userStr);
            let rawLogo = null;
            if (user.clientId && typeof user.clientId === 'object' && user.clientId.logo) {
                rawLogo = user.clientId.logo;
            } else if (user.companyLogo) {
                rawLogo = user.companyLogo;
            } else if (user.logo) {
                rawLogo = user.logo;
            }
            if (rawLogo) {
                setLogoUrl(computeLogoUrl(rawLogo));
            }
        }
    } catch (e) {
        console.error("Error parsing user from localstorage", e);
    }

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

  useEffect(() => {
    if (!loading && action === "download" && form) {
        setDownloading(true);
        setTimeout(() => {
            downloadPdfFromRef(containerRef, `CustomForm_${form.title.replace(/\s+/g, '_')}`, () => {
                setDownloading(false);
                window.close();
            });
        }, 800);
    } else if (!loading && action === "download_word" && form) {
        setDownloading(true);
        downloadWordFromForm(form, values, `CustomForm_${form.title.replace(/\s+/g, '_')}`, () => {
            setDownloading(false);
            window.close();
        });
    }
  }, [loading, action, form, values]);

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

      if (siteId) processedAnswers.siteId = siteId;

      const payload = {
        formId: id,
        answers: processedAnswers,
      };
      if (category) payload.category = category;

      await api.post(`/forms/${id}/responses`, payload);

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


        <Paper ref={containerRef} sx={{ p: 3, maxWidth: 900, position: 'relative', display: 'flex', flexDirection: 'column', minHeight: 'auto', boxSizing: 'border-box' }}>
          {action === "download" && (
            <Typography sx={{ position: 'absolute', top: 24, right: 24, fontWeight: 500, color: 'text.secondary', fontSize: '0.9rem' }}>
                Date: {new Date().toLocaleDateString('en-GB')}
            </Typography>
          )}

          <Box sx={{ flex: 1 }}>
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
              {f.type === "signature" && (() => {
                const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
                const justifyContent = alignMap[f.alignment] || 'flex-start';
                return (
                    <Box sx={{ display: 'flex', justifyContent }}>
                        <Box sx={{ width: '300px', maxWidth: '100%' }}>
                            {(values[f.id] || values[f.id + "_preview"]) ? (
                                <Box sx={{ mb: 1, position: 'relative', display: 'inline-block' }}>
                                    <Box
                                        component="img"
                                        src={
                                            values[f.id + "_preview"] ||
                                            (typeof values[f.id] === 'string' ? values[f.id] : null) ||
                                            ""
                                        }
                                        alt="signature"
                                        sx={{ maxWidth: '100%', maxHeight: 150, borderRadius: 2, border: '1px solid #ddd' }}
                                    />
                                    {action !== "download" && action !== "download_word" && (
                                        <Button size="small" color="error" onClick={() => {
                                            setValues(prev => {
                                                const next = { ...prev };
                                                delete next[f.id];
                                                delete next[f.id + "_preview"];
                                                return next;
                                            });
                                        }} sx={{ display: 'block', mt: 1 }}>Remove</Button>
                                    )}
                                </Box>
                            ) : (
                                action !== "download" && action !== "download_word" ? (
                                    <Button variant="outlined" component="label" fullWidth sx={{ height: 120, borderStyle: 'dashed', borderRadius: 2 }}>
                                        Upload Signature
                                        <input hidden accept="image/*" type="file" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const url = URL.createObjectURL(file);
                                                setValues(prev => ({ ...prev, [f.id]: file, [f.id + "_preview"]: url }));
                                            }
                                        }} />
                                    </Button>
                                ) : (
                                    <Box sx={{ border: "1px solid #cbd5e1", borderRadius: 2, height: 120, width: "100%", bgcolor: "#fff", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="text.secondary">Signature (Pending)</Typography>
                                    </Box>
                                )
                            )}
                        </Box>
                    </Box>
                );
              })()}
            </Box>
          ))}

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2, textTransform: "none", display: action === "download" ? "none" : "block" }}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Submitting..." : "Save"}
          </Button>
          </Box>

          {/* Footer for download mode */}
          {action === "download" && (
            <Box sx={{ mt: 4, pt: 2, borderTop: "2px solid black", display: "flex", justifyContent: "flex-end" }}>
                <Box
                    component="img"
                    src={logoUrl || "/logo.png"}
                    alt="Company Logo"
                    sx={{
                        height: 40,
                        width: "auto"
                    }}
                />
            </Box>
          )}
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
              navigate(siteId ? "/sitepack-management" : "/forms");
            }}
          >
            {siteId ? "Back to Site Pack" : "Go to Forms"}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}
