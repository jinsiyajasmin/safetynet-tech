// src/pages/EnableUserAccess.jsx
import React, { useState } from "react";
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    MenuItem,
    Button,
    Snackbar,
    Alert,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import api from "../services/api"; // your axios instance

const PERMISSION_LEVELS = [
    { id: 0, title: "Level 0 - Basic Access", desc: "Login/logout only. Requires admin approval for access to features.", color: "#F3F4F6" },
    { id: 1, title: "Level 1 - Dashboard & Messaging", desc: "The user will be able to view dashboard, send messages but will not be able to view reports, or conduct audit inspections.", color: "rgba(59,130,246,0.06)" },
    { id: 2, title: "Level 2 - Reports Viewer", desc: "View and download reports. Cannot edit or conduct audits.", color: "rgba(99,102,241,0.06)" },
    { id: 3, title: "Level 3 - Editor", desc: "Full editing capabilities including audit inspections. Cannot delete entire reports.", color: "rgba(250,204,21,0.06)" },
    { id: 4, title: "Level 4 - Senior Management", desc: "Full access including user management, activity logs, and complete report control.", color: "rgba(34,197,94,0.06)" },
];

export default function EnableUserAccessPage() {
    const [form, setForm] = useState({
        email: "",
        permission: 1,
    });

    const [errors, setErrors] = useState({});
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (key) => (ev) => {
        const value = ev?.target ? ev.target.value : ev;
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const validate = () => {
        const e = {};
        if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
        if (!Number.isInteger(Number(form.permission))) e.permission = "Select permission level";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev) => {
        ev?.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                email: form.email.trim().toLowerCase(),
                permissionLevel: Number(form.permission),
            };

            // adapt to your endpoint
            const res = await api.post("/users/invite", payload);
            if (res?.data?.success) {
                setSnack({ open: true, msg: res.data.message || "User invited/created", severity: "success" });
                setForm({
                    email: "",
                    permission: 1,
                });
            } else {
                throw new Error(res?.data?.message || "Failed");
            }
        } catch (err) {
            console.error("Invite/create user error:", err);
            const msg = err?.response?.data?.message || err.message || "Failed to create user";
            setSnack({ open: true, msg, severity: "error" });
        } finally {
            setSubmitting(false);
        }
    };

    const selectedLevel = PERMISSION_LEVELS.find((p) => p.id === Number(form.permission)) ?? PERMISSION_LEVELS[0];

    return (
        <>
            <TopNav />
            <Box sx={{ display: "flex", height: "calc(100vh - 0px)", bgcolor: "#ffffff" }}>
                <Box
                    component="aside"
                    sx={{
                        width: { xs: 0, md: 260 },
                        flexShrink: 0,
                        alignSelf: "flex-start",
                        position: "sticky",
                        top: "64px",
                        height: "calc(100vh - 64px)",
                        overflow: "auto",
                        p: 0,
                    }}
                >
                    <Sidebar sx={{ height: "100%" }} />
                </Box>

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        px: { xs: 2, sm: 3, md: 6 },
                        py: { xs: 4, md: 6 },
                    }}
                >
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                        Enable user access
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        {/* Create or invite a user and  */}
                        assign permission levels.
                    </Typography>

                    <Grid >
                        {/* Left: form */}
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 5,
                                    border: "1px solid #E5E7EB",
                                    borderRadius: 4,
                                    mb: 4,
                                }}
                            >

                                <form onSubmit={handleSubmit}>
                                    <Typography sx={{ fontWeight: 700, mb: 1 }}>User email</Typography>
                                    <TextField
                                        value={form.email}
                                        onChange={handleChange("email")}
                                        placeholder="user@example.com"
                                        fullWidth
                                        size="small"
                                        error={!!errors.email}
                                        helperText={errors.email}
                                        sx={{ mb: 2 }}
                                    />

                                    {/* ===== Permission level as a TextField (select) to look like an input ===== */}
                                    <Typography sx={{ fontWeight: 700, mb: 1 }}>Permission level</Typography>

                                    <TextField
                                        select
                                        fullWidth
                                        size="small"
                                        value={form.permission}
                                        onChange={handleChange("permission")}
                                        sx={{
                                            mb: 2,
                                            borderRadius: 2,
                                            // highlight with blue outline when focused
                                            "& .MuiOutlinedInput-root": {
                                                borderRadius: 2,
                                            },
                                            "& .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "rgba(11,77,166,0.25)",
                                            },
                                            "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
                                                borderColor: "#0B4DA6",
                                                boxShadow: "0 0 0 4px rgba(11,77,166,0.06)",
                                            },
                                        }}
                                    >
                                        {PERMISSION_LEVELS.map((p) => (
                                            <MenuItem key={p.id} value={p.id}>
                                                {p.title}
                                            </MenuItem>
                                        ))}
                                    </TextField>

                                    {/* ===== Dynamic description "card" styled like your screenshot ===== */}
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 2,
                                            p: 2,
                                            borderRadius: 2,
                                            border: "1.5px solid rgba(11,77,166,0.12)",
                                            backgroundColor: "rgba(11,77,166,0.04)",
                                            mb: 2,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                bgcolor: "rgba(11,77,166,0.08)",
                                                display: "grid",
                                                placeItems: "center",
                                                color: "#0B4DA6",
                                            }}
                                        >
                                            <InfoOutlinedIcon fontSize="small" />
                                        </Box>

                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: "#0B4DA6", mb: 0.5 }}>
                                                {selectedLevel.title}
                                            </Typography>
                                            <Typography color="text.secondary" sx={{ maxWidth: { xs: "100%", sm: 640 } }}>
                                                {selectedLevel.desc}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                                        <Button variant="contained" type="submit" disabled={submitting}>
                                            {submitting ? "Saving..." : " Create"}
                                        </Button>
                                        <Button variant="outlined" disabled={submitting} onClick={() => { /* cancel handler */ }}>
                                            Cancel
                                        </Button>
                                    </Box>
                                </form>
                            </Paper>
                        </Grid>

                        {/* Right: Permission levels overview */}
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                                Permission levels overview
                            </Typography>

                            <Box sx={{ display: "grid", gap: 2 }}>
                                {PERMISSION_LEVELS.map((p) => (
                                    <Paper key={p.id} sx={{ p: 2.25, display: "flex", gap: 2, alignItems: "center", borderRadius: 2, bgcolor: p.color }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "background.paper", display: "grid", placeItems: "center", fontWeight: 700 }}>
                                            {p.id}
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 700 }}>{p.title}</Typography>
                                            <Typography color="text.secondary" sx={{ fontSize: "0.95rem" }}>{p.desc}</Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>

            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack((s) => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{ mt: 10, mr: 2 }}
            >
                <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ borderRadius: 2, backgroundColor: "rgba(2,6,23,0.06)" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </>
    );
}
