import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Grid,
    CircularProgress,
    Snackbar,
    Alert
} from "@mui/material";
import Sidebar from "../components/Sidebar";
import TopNav from "../components/TopNav";
import api from "../services/api";
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [snack, setSnack] = useState({
        open: false,
        message: "",
        severity: "info",
    });

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            try {
                const res = await api.get("/auth/me");
                if (res.data && res.data.user) {
                    setUser(res.data.user);
                } else {
                    throw new Error("No user data");
                }
            } catch (err) {
                console.warn("API fetch failed, checking localStorage", err);
                const stored = localStorage.getItem("user");
                if (stored) {
                    setUser(JSON.parse(stored));
                }
            }
        } catch (err) {
            console.error("Failed to load profile", err);
            setSnack({ open: true, message: "Failed to load profile", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <>
            <TopNav />
            <Box sx={{ display: "flex", height: "calc(100vh - 0px)", bgcolor: "#f4f6f8" }}>
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

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        p: 0,
                    }}
                >
                    {/* Header Section */}
                    <Box sx={{
                        bgcolor: "#2E6171",
                        color: "white",
                        p: { xs: 3, md: 5 },
                        display: "flex",
                        alignItems: "center",
                        gap: 3
                    }}>
                        <Avatar
                            sx={{
                                width: 120,
                                height: 120,
                                border: "4px solid rgba(255,255,255,0.2)",
                                fontSize: "3rem",
                                bgcolor: "rgba(255,255,255,0.1)"
                            }}
                        >
                            {user?.firstName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || "?"}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" fontWeight="bold">
                                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}
                            </Typography>
                            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                                {user?.role || "User"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ p: { xs: 2, md: 4 } }}>
                        <Grid container spacing={3}>
                            {/* About Card */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }} elevation={0}>
                                    <Typography variant="h6" fontWeight="bold" mb={3}>
                                        About
                                    </Typography>

                                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                        <EmailOutlinedIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Email
                                            </Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {user?.email}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                                        <BadgeOutlinedIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Job title
                                            </Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {user?.jobTitle || "-"}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ display: "flex", gap: 2 }}>
                                        <WorkOutlineOutlinedIcon sx={{ color: "text.secondary" }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                Company name
                                            </Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {user?.companyname || "-"}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>


                            {/* Roles Card */}
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, borderRadius: 2 }} elevation={0}>
                                    <Typography variant="h6" fontWeight="bold" mb={3}>
                                        Roles
                                    </Typography>

                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <VerifiedUserOutlinedIcon color="success" />
                                        <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                                            {user?.role}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>
            </Box>

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack({ ...snack, open: false })}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert
                    onClose={() => setSnack({ ...snack, open: false })}
                    severity={snack.severity}
                    sx={{ width: "100%" }}
                >
                    {snack.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ProfilePage;
