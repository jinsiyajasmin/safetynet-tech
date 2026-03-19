import React from "react";
import { Box, Typography, Grid, Card, CardContent, CardActionArea } from "@mui/material";
import { FileText } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";

const TEMPLATES = [
    {
        id: "tool-box-talk",
        title: "Tool Box Talk Register",
        description: "Record all tool box talk topics and attendees",
        path: "/general-forms/tool-box-talk",
    },
    {
        id: "rams-briefing",
        title: "RAMS Briefing Form",
        description: "Risk Assessment & Method Statement Briefing",
        path: "/general-forms/rams-briefing",
    },
    {
        id: "site-induction",
        title: "Site Induction Register",
        description: "Sign-off register for site inductions",
        path: "/general-forms/site-induction",
    },
    {
        id: "management-site-inspection",
        title: "Management Site Inspection Report",
        description: "Comprehensive site H&S walkthrough",
        path: "/general-forms/management-site-inspection",
    },
    {
        id: "daily-safe-start-briefing",
        title: "Daily Safe Start Briefing Sheet",
        description: "Start Right Daily Safety Briefing",
        path: "/general-forms/daily-safe-start-briefing",
    },
    {
        id: "audit-action-form",
        title: "Audit Action Form",
        description: "Review and report observations & assigned actions",
        path: "/general-forms/audit-action-form",
    },
    {
        id: "site-induction-form",
        title: "Site Induction Form",
        description: "Personal and comprehensive 3-page site induction record",
        path: "/general-forms/site-induction-form",
    },
    {
        id: "loler-inspection-form",
        title: "LOLER Inspection Form",
        description: "Official Equipment inspection and certification",
        path: "/general-forms/loler-inspection-form",
    },
    {
        id: "puwer-inspection-form",
        title: "PUWER Inspection Form",
        description: "Plant equipment formal maintenance certification",
        path: "/general-forms/puwer-inspection-form",
    }
];

export default function GeneralFormsList() {
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const search = searchParams.get("search") || "";

    const filteredTemplates = TEMPLATES.filter((form) =>
        (form.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (form.description || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? "#F9FAFB" : "#111827", mb: 1 }}>
                        General Forms
                    </Typography>
                    <Typography sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
                        View and manage your submitted general forms.
                    </Typography>
                </Box>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? "#F9FAFB" : "#111827", mb: 2 }}>
                Available Templates
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mb: 6 }}>
                {filteredTemplates.map((form) => (
                    <Card
                        key={form.id}
                        sx={{
                            bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF",
                            border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
                            borderRadius: 4,
                            height: 160,
                            display: 'flex',
                            flexDirection: 'column',
                            transition: "all 0.2s",
                            "&:hover": { borderColor: "#E89F17", transform: "translateY(-4px)" }
                        }}
                        elevation={0}
                    >
                        <CardActionArea
                            onClick={() => navigate(form.path)}
                            sx={{ height: "100%", p: 2 }}
                        >
                            <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", p: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            bgcolor: "rgba(232, 159, 23, 0.1)",
                                            borderRadius: 2,
                                            color: "#E89F17",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mr: 2
                                        }}
                                    >
                                        <FileText size={18} />
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 500, color: isDarkMode ? "#F9FAFB" : "#111827", lineHeight: 1.2 }}>
                                        {form.title}
                                    </Typography>
                                </Box>
                                <Typography variant="body1" sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280", flexGrow: 1 }}>
                                    {form.description}
                                </Typography>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                ))}
            </Box>
        </Layout>
    );
}
