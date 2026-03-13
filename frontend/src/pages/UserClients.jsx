// src/pages/Clients.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

import Layout from "../components/Layout";
import api from "../services/api";

export default function ClientsPage() {





    const [companyName, setCompanyName] = useState("");
    const [clientData, setClientData] = useState(null);

    // Helper to compute logo URL (reused logic)
    const computeLogoUrl = (logo) => {
        if (!logo) return null;
        if (/^https?:\/\//i.test(logo)) return logo;
        const host = import.meta.env.VITE_BACKEND_URL || "https://api-site-mateai.co.uk";
        return `${host.replace(/\/$/, "")}${logo.startsWith("/") ? "" : "/"}${logo}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const user = JSON.parse(localStorage.getItem("user") || "{}");
                // Priorities: companyname -> employer -> generic fallback
                const name = user.companyname || user.employer || "Safetynett";
                setCompanyName(name);

                if (name && name.toLowerCase() !== "safetynett") {
                    try {
                        const res = await api.get(`/clients?name=${name}`);
                        // Backend returns { success: true, clients: [...] }
                        // We want the first matching client
                        const clients = res.data?.clients || [];
                        const data = clients.length > 0 ? clients[0] : null;

                        setClientData(data);
                    } catch (err) {
                        console.error("Failed to fetch client logo", err);
                    }
                }

            } catch (e) {
                console.error("Error parsing user from local storage", e);
                setCompanyName("Safetynett");
            }
        };
        fetchData();
    }, []);

    return (
        <Layout>
            <Box
                sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    px: 3,
                    gap: 3,
                    overflow: "hidden"
                }}
            >
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
                >
                    {/* Logo Display */}
                    {clientData?.logo && (
                        <Box
                            component="img"
                            src={computeLogoUrl(clientData.logo)}
                            alt={`${companyName} logo`}
                            sx={{
                                width: { xs: 120, sm: 150, md: 180 },
                                height: "auto",
                                objectFit: "contain",
                                mb: 2
                            }}
                        />
                    )}

                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            color: "#013a63",
                            textAlign: "center",
                            textTransform: "capitalize"
                        }}
                    >
                        Welcome to {companyName}
                    </Typography>
                </motion.div>
            </Box>
        </Layout>
    );
}
