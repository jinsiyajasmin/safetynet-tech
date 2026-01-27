import React from "react";
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Checkbox,
    Radio,
    RadioGroup,
    FormControlLabel,
    Button,
} from "@mui/material";

export default function FormRenderer({
    form,
    values,
    onChange,
    onSubmit,
    readOnly = false,
    isSubmitting = false,
    logoUrl,
}) {
    if (!form) return null;

    const handleChange = (fieldId, value) => {
        if (readOnly) return;
        onChange(fieldId, value);
    };

    const handleCheckboxToggle = (fieldId, option) => {
        if (readOnly) return;
        const current = Array.isArray(values[fieldId]) ? values[fieldId] : [];
        const newValue = current.includes(option)
            ? current.filter((v) => v !== option)
            : [...current, option];
        onChange(fieldId, newValue);
    };

    // Style overrides for read-only to ensure black text
    const readOnlyInputProps = {
        readOnly: true,
        sx: {
            "& .MuiInputBase-input": {
                color: "text.primary",
                WebkitTextFillColor: "rgba(0, 0, 0, 0.87) !important",
                cursor: "default"
            },
            "& .MuiOutlinedInput-notchedOutline": { border: "none" }, // Optional: remove border for cleaner "view" look? Or keep border but lighter? Let's keep default but ensure text is black.
            // Actually user asked for black text "not in the grey clr".
            // Default disabled is grey. ReadOnly is usually standard color but editable.
            // We want it to look like static text.
        }
    };

    // For Select/Radio/Checkbox, "readOnly" attribute doesn't prevent interaction fully in MUI (select still opens).
    // We strictly control them via value/onChange blocking, but for visual "black text" we need tricks.

    return (
        <Box sx={{ position: "relative" }}>
            {logoUrl && (
                <Box
                    component="img"
                    src={logoUrl}
                    alt="Company Logo"
                    sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        height: 60,
                        width: "auto",
                        maxHeight: "100px",
                        objectFit: "contain",
                    }}
                />
            )}
            <Typography
                variant="h4"
                sx={{
                    fontWeight: 700,
                    mb: 3,
                    color: form.titleColor || "inherit",
                    textAlign: form.titleAlignment || "left",
                    pr: logoUrl ? 10 : 0, // Add padding if logo exists to prevent overlap
                }}
            >
                {form.title}
            </Typography>

            {form.fields.map((f) => (
                <Box key={f.id} sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, mb: 1 }}>
                        {f.label} {f.required && !readOnly && "*"}
                    </Typography>

                    {f.type === "text" && (
                        <TextField
                            fullWidth
                            value={values[f.id] || ""}
                            onChange={(e) => handleChange(f.id, e.target.value)}
                            InputProps={readOnly ? readOnlyInputProps : {}}
                            placeholder={readOnly ? "-" : ""}
                        />
                    )}

                    {f.type === "textarea" && (
                        <TextField
                            fullWidth
                            multiline
                            minRows={3}
                            value={values[f.id] || ""}
                            onChange={(e) => handleChange(f.id, e.target.value)}
                            InputProps={readOnly ? readOnlyInputProps : {}}
                            placeholder={readOnly ? "-" : ""}
                        />
                    )}

                    {f.type === "select" && (
                        <TextField
                            select
                            fullWidth
                            value={values[f.id] || ""}
                            onChange={(e) => handleChange(f.id, e.target.value)}
                            InputProps={readOnly ? readOnlyInputProps : {}}
                        // If readOnly, we use MenuItem as readOnly display helper if needed, but TextField select handles it.
                        // However, clicking it opens menu. We want to prevent opening? 
                        // Easier: If readOnly, render just a Text Field with the selected LABEL.
                        // But we only have values. We need to find the label.
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
                                    control={
                                        <Radio
                                            sx={{
                                                "&.Mui-disabled": { color: values[f.id] === o.value ? "primary.main" : "action.disabled" }
                                            }}
                                        />
                                    }
                                    label={o.label}
                                    disabled={readOnly}
                                    sx={{
                                        "& .MuiFormControlLabel-label.Mui-disabled": { color: "text.primary" } // Force label black
                                    }}
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
                                            onChange={() => handleCheckboxToggle(f.id, o.value)}
                                            disabled={readOnly}
                                            sx={{
                                                "&.Mui-disabled": { color: (values[f.id] || []).includes(o.value) ? "primary.main" : "action.disabled" }
                                            }}
                                        />
                                    }
                                    label={o.label}
                                    sx={{
                                        "& .MuiFormControlLabel-label.Mui-disabled": { color: "text.primary" } // Force label black
                                    }}
                                />
                            ))}
                        </Box>
                    )}

                    {(f.type === "date" || f.type === "time" || f.type === "datetime" || f.type === "monthyear") && (
                        <TextField
                            type={f.type === "datetime" ? "datetime-local" : f.type === "monthyear" ? "month" : f.type}
                            fullWidth
                            value={values[f.id] || ""}
                            onChange={(e) => handleChange(f.id, e.target.value)}
                            InputProps={readOnly ? readOnlyInputProps : {}}
                            InputLabelProps={{ shrink: true }}
                        />
                    )}

                    {(f.type === "file" || f.type === "image_upload") && (
                        <Box>
                            {readOnly ? (
                                <Typography variant="body1" color="text.primary">
                                    {values[f.id] || "No file"}
                                </Typography>
                            ) : (
                                <TextField
                                    type="file"
                                    fullWidth
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            handleChange(f.id, file.name);
                                        }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        accept: f.type === "image_upload" ? "image/*" : "*/*"
                                    }}
                                />
                            )}
                        </Box>
                    )}
                </Box>
            ))}

            {!readOnly && onSubmit && (
                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, textTransform: "none" }}
                    onClick={onSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            )}
        </Box>
    );
}
