import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  TextField,
  MenuItem,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";
import { useParams } from "react-router-dom";
import api from "../services/api";
import Layout from "../components/Layout";




export default function ViewSingleForm() {
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState({});



  const handleRadioChange = (fieldId, value) => {
    setValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

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

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Typography sx={{ p: 4 }}>
        Form not found
      </Typography>
    );
  }

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
    },
  };

  return (
    <Layout>
      {/* HEADER */}
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


        <Box sx={{ display: "flex", gap: 1 }}>
          {/* Edit */}


          {/* Use Form */}

        </Box>
      </Box>

      {/* FORM CONTENT */}
      <Paper sx={{ p: 3, maxWidth: 900 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: form.titleColor, textAlign: form.titleAlignment || "left" }}>
          {form.title || "Untitled Form"}
        </Typography>
        {form.fields.map((f) => (
          <Box key={f.id} sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 600, mb: 1 }}>
              {f.label} {f.required && "*"}
            </Typography>

            {f.type === "text" && <TextField fullWidth sx={inputSx} />}
            {f.type === "textarea" && (
              <TextField fullWidth multiline minRows={3} sx={inputSx} />
            )}

            {f.type === "select" && (
              <TextField select fullWidth sx={inputSx}>
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
                onChange={(e) =>
                  handleRadioChange(f.id, e.target.value)
                }
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
                    control={<Checkbox />}
                    label={o.label}
                  />
                ))}
              </Box>
            )}

            {f.type === "date" && <TextField type="date" fullWidth sx={inputSx} />}
            {f.type === "time" && <TextField type="time" fullWidth sx={inputSx} />}
            {f.type === "datetime" && (
              <TextField type="datetime-local" fullWidth sx={inputSx} />
            )}
            {f.type === "monthyear" && (
              <TextField type="month" fullWidth sx={inputSx} />
            )}
            {f.type === "file" && <TextField type="file" fullWidth sx={inputSx} />}
          </Box>
        ))}
      </Paper>
      {/* LOGO at Bottom Right */}
      {form.createdBy?.clientId?.logo && (
        <Box
          component="img"
          src={form.createdBy.clientId.logo}
          alt="Company Logo"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 32,
            height: 80,
            width: "auto",
            objectFit: "contain",
            zIndex: 10,
            opacity: 0.9,
          }}
        />
      )}
    </Layout>
  );
}
