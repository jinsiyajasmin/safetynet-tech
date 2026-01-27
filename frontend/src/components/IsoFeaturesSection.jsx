import React from "react";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import DescriptionIcon from "@mui/icons-material/Description";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { motion } from "framer-motion";


const isoFeatures = [
    {
        icon: (
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: "#e0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
                }}
            >
                <SecurityIcon sx={{ fontSize: 20, color: "#61a5c2" }} />
            </Box>
        ),
        title: "Compliance Management",
        description:
            "Comprehensive ISO compliance tracking and management system for all your organizational needs.",
    },
    {
        icon: (
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: "#e0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
                }}
            >
                <AnalyticsIcon sx={{ fontSize: 20, color: "#61a5c2" }} />
            </Box>
        ),
        title: "Advanced Analytics",
        description:
            "Real-time reporting and analytics to monitor compliance status and performance metrics.",
    },
    {
        icon: (
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: "#e0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
                }}
            >
                <DescriptionIcon sx={{ fontSize: 20, color: "#61a5c2" }} />
            </Box>
        ),
        title: "Document Control",
        description:
            "Centralized document management with version control and automated approval workflows.",
    },
    {
        icon: (
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: "#e0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
                }}
            >
                <FactCheckIcon sx={{ fontSize: 20, color: "#61a5c2" }} />
            </Box>
        ),
        title: "Audit Management",
        description:
            "Streamlined audit processes with automated scheduling and comprehensive reporting.",
    },
    {
        icon: (
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: "#e0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
                }}
            >
                <TrendingUpIcon sx={{ fontSize: 20, color: "#61a5c2" }} />
            </Box>
        ),
        title: "Performance Tracking",
        description:
            "Monitor KPIs and track improvements across all compliance areas with detailed dashboards.",
    },
    {
        icon: (
            <Box
                sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 2,
                    backgroundColor: "#e0f2f8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.15)",
                }}
            >
                <AccessTimeIcon sx={{ fontSize: 20, color: "#61a5c2" }} />
            </Box>
        ),
        title: "Real-time Updates",
        description:
            "Instant notifications and updates on compliance status changes and deadlines.",
    },
];

export default function IsoFeaturesSection() {
    const titleVariants = {
        hidden: { opacity: 0, y: -50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.9, ease: "easeOut" } },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.3, duration: 0.6, ease: "easeOut" },
        }),
    };

    return (
        <Box sx={{ py: 10, backgroundColor: "#F6F6F4", pb: 12 }}>
            <Container>
                {/* Section Title */}
                <motion.div initial="hidden" animate="visible" variants={titleVariants}>
                    <Typography
                        variant="h4"
                        align="center"
                        sx={{ fontWeight: 500, mb: 6 }}
                    >
                        Everything you need,{" "}
                        <Box
                            component="span"
                            sx={{
                                color: "#a2a3a4ff",
                                transition: "color 0.3s ease",
                                "&:hover": { color: "#F8AC2D" },
                            }}
                        >
                            for<br /> seamless ISO management
                        </Box>
                    </Typography>
                </motion.div>

                {/* Cards Grid */}
                <Grid container spacing={0} justifyContent="center">
                    {isoFeatures.map((feature, index) => {
                        let radius = "0";
                        if (index === 0) radius = "15px 0 0 0";
                        else if (index === 2) radius = "0 15px 0 0";
                        else if (index === 3) radius = "0 0 0 15px";
                        else if (index === 5) radius = "0 0 15px 0";

                        return (
                            <Grid item key={index}>
                                <motion.div
                                    custom={index}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    variants={cardVariants}
                                >
                                    <Paper
                                        elevation={2}
                                        sx={{
                                            width: 300,
                                            height: "100%",
                                            p: 3,
                                            borderRadius: radius,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-start",
                                            transition:
                                                "transform 0.3s ease, box-shadow 0.3s ease",
                                            "&:hover": {
                                                transform: "translateY(-5px)",
                                                boxShadow: 6,
                                            },
                                        }}
                                    >
                                        <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                                        <Typography
                                            variant="h6"
                                            sx={{ fontWeight: 500, mb: 0.5 }}
                                        >
                                            {feature.title}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            sx={{ color: "gray", flexGrow: 1 }}
                                        >
                                            {feature.description}
                                        </Typography>
                                    </Paper>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </Grid>
            </Container>
        </Box>
    );
}
//Ready to Transform Your Compliance Management?
//Join hundreds of organizations that trust Safety Nett Tech Solutions for their ISO compliance needs.

