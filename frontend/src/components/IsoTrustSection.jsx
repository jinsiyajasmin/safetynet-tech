import React, { useState } from "react";
import { Box, Container, Typography, Grid, Paper } from "@mui/material";
import { useInView } from "react-intersection-observer";

const companyLogos = [
    { src: "/logo11.png", alt: "Company 1" },
    { src: "/logo7.png", alt: "Company 2" },
    { src: "/logo9.png", alt: "Company 3" },
    { src: "/logo6.png", alt: "Company 4" },
    { src: "/logo4.png", alt: "Company 5" },
];

export default function CompanyTrustSection() {
    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });

    return (
        <Box sx={{ py: 10, backgroundColor: "#fff" }} ref={ref}>
            <Container>
                {/* Heading with animation */}
                <Grid container spacing={22} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 500,
                                lineHeight: 1.4,
                                cursor: "pointer",
                                "& span": {
                                    color: "#a2a3a4ff",
                                    transition: "color 0.3s ease",
                                },
                                "&:hover span": {
                                    color: "#F8AC2D",
                                },
                                opacity: inView ? 1 : 0,
                                transform: inView ? "translateY(0)" : "translateY(50px)",
                                transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
                                transitionDelay: "0.3s",
                            }}
                        >
                            Focusing on quality, <span>we <br /> maintain customer trust</span>
                        </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Typography
                            variant="body1"
                            sx={{
                                color: "#6c6d6fff",
                                opacity: inView ? 1 : 0,
                                transform: inView ? "translateY(0)" : "translateY(50px)",
                                transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
                                transitionDelay: "0.5s",
                            }}
                        >
                            We proudly collaborate with top-tier companies to deliver quality, <br />
                            innovation, and efficiency. Our partnerships reflect our <br />
                            commitment to excellence and trust.
                        </Typography>
                    </Grid>
                </Grid>

                {/* Logos Row with sequential fade-in */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: 4,
                        mt: 6,
                    }}
                >
                    {companyLogos.map((logo, index) => (
                        <Paper
                            key={index}
                            elevation={2}
                            sx={{
                                width: 150,
                                height: 150,
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                filter: "grayscale(100%)",
                                opacity: inView ? 1 : 0,
                                transform: inView ? "scale(1)" : "scale(0.8)",
                                transition: `opacity 0.6s ease-out ${1 + index * 0.2}s, transform 0.6s ease-out ${1 + index * 0.2}s, filter 0.3s ease`,
                                "&:hover": {
                                    filter: "grayscale(0%)", // only color change on hover
                                },
                            }}
                        >
                            <Box
                                component="img"
                                src={logo.src}
                                alt={logo.alt}
                                sx={{ maxWidth: "80%", maxHeight: "80%" }}
                            />
                        </Paper>


                    ))}
                </Box>
            </Container>
        </Box>
    );
}
