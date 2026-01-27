import React, { useEffect, useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Typography,
    CircularProgress,
    TextField,
    Box,
} from "@mui/material";
import api from "../services/api";

export default function FormSelectionDialog({ open, onClose, onSelect }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open) {
            loadForms();
        }
    }, [open]);

    const loadForms = async () => {
        setLoading(true);
        try {
            const res = await api.get("/forms");
            if (res.data?.success) {
                setForms(res.data.data);
            }
        } catch (err) {
            console.error("Failed to load forms", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredForms = forms.filter((f) =>
        f.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ fontWeight: 600 }}>Choose a Form</DialogTitle>
            <DialogContent dividers>
                <TextField
                    fullWidth
                    placeholder="Search forms..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ mb: 2 }}
                    size="small"
                />

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : filteredForms.length > 0 ? (
                    <List>
                        {filteredForms.map((form) => (
                            <ListItemButton key={form._id} onClick={() => onSelect(form)}>
                                <ListItemText
                                    primary={form.title}
                                    secondary={`${form.fields?.length || 0} fields`}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                ) : (
                    <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                        No forms found.
                    </Typography>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
}
