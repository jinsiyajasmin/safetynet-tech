// src/components/FAQSection.jsx
import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { motion } from "framer-motion";


const FAQS = [
  {
    id: "panel1",
    q: "What We Will Do?",
    a: "We will investigate all incidences to eliminate the potential for injury, suffering and loss.",
  },
  {
    id: "panel2",
    q: "What Is Next?",
    a: "Once we have all the 'info', we will contact the people responsible for correcting the issues(s) raised.",
  },
  {
    id: "panel3",
    q: "We Recognise The Importance Of Health And Safety!",
    a: "We support managers, supervisors and the workforce in allowing time to do the task in a healthy and safe manner, without compromise.",
  },
  {
    id: "panel4",
    q: "When you report Health & Safety concern, we will act on it immediately!",
    a: "Employees who wish to report on an issue manually, they can do so by emailing their Line Manager or by contacting your Safety Nett SHEQ Advisor m.chiweda@safetynett.co.uk",
  },
  {
    id: "panel5",
    q: "We're There With You in our No Blame Culture!",
    a: "If you stop the task for a valid health and safety observation [unsafe condition or unsafe act] we will back you all the way!",
  },
];

// parent animation: slide down a little and fade in; children will stagger
const containerVariants = {
  hidden: { opacity: 0, y: -30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.12,
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

// per-item animation: small slide down + fade
const itemVariants = {
  hidden: { opacity: 0, y: -18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function FAQSection() {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (_, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box
      component="section"
      sx={{
        backgroundColor: "#2a6f97",
        px: { xs: 2, md: 6 },
        py: { xs: 6, md: 10 },
      }}
    >
      {/* animated parent */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <Paper
          elevation={3}
          sx={{
            borderRadius: { xs: 3, md: 6 },
            p: { xs: 3, md: 6 },
            bgcolor: "background.paper",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left: Title */}
            <Grid item xs={12} md={7}>
              <Box sx={{ px: { xs: 0, md: 4 } }}>
                <Typography
                  variant="h3"
                  component="h2"
                  sx={{
                    fontWeight: 400,
                    lineHeight: 1.05,
                    fontSize: { xs: "2rem", md: "3.25rem" },
                  }}
                >
                  You ask - we answer.
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 2,
                    maxWidth: 560,
                    fontSize: { xs: "0.95rem", md: "1.05rem" },
                  }}
                >
                  All you want to know about Safetynett.
                </Typography>
              </Box>
            </Grid>

            {/* Right: Accordion list */}
            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  px: { xs: 0, md: 4 },
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Box sx={{ width: "100%", maxWidth: 480 }}>
                  {FAQS.map((faq, idx) => (
                    // wrap each accordion in a motion.div to animate individually
                    <motion.div
                      key={faq.id}
                      variants={itemVariants}
                      style={{ marginBottom: idx !== FAQS.length - 1 ? 0 : 0 }}
                    >
                      <Accordion
                        expanded={expanded === faq.id}
                        onChange={handleChange(faq.id)}
                        disableGutters
                        sx={{
                          boxShadow: "none",
                          borderRadius: 0,
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            px: 0,
                            "& .MuiAccordionSummary-content": { margin: 0 },
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 400,
                              fontSize: { xs: "0.95rem", md: "1.05rem" },
                            }}
                          >
                            {faq.q}
                          </Typography>
                        </AccordionSummary>

                        <AccordionDetails sx={{ px: 0, pt: 1 }}>
                          <Typography color="text.secondary">{faq.a}</Typography>
                        </AccordionDetails>
                      </Accordion>

                      {idx !== FAQS.length - 1 && (
                        <Divider sx={{ my: 0, borderColor: "divider" }} />
                      )}
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Box>
  );
}
