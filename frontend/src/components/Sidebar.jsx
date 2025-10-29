// src/components/Sidebar.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Collapse,
} from "@mui/material";

// icons (outlined / modern variants)
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import RestorePageOutlinedIcon from "@mui/icons-material/RestorePageOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import PeopleOutlineOutlinedIcon from "@mui/icons-material/PeopleOutlineOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import AppRegistrationOutlinedIcon from "@mui/icons-material/AppRegistrationOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { Link as RouterLink, useLocation } from "react-router-dom";
import TopNav from "./TopNav";

/* === config === */
// dark blue for text & icon when active
const ACTIVE_COLOR = "#0B4DA6"; // dark blue
// light blue background for active / selected row
const ACTIVE_BG = "#E8F1FF"; // very light blue

const DASHBOARD_GROUP = {
  id: "dashboard",
  heading: "Dashboard",
  icon: <TrendingUpOutlinedIcon />,
  items: [
    { id: "concern-report", label: "Concern report dashboard", to: "/concern-reports" },
    { id: "audit-report", label: "Audit report dashboard", to: "/audit-reports" },
  ],
};

const MENU_GROUPS = [
  { id: "clients", heading: "Clients", icon: <PeopleAltOutlinedIcon />, to: "/clients" },
  {
    id: "user-access",
    heading: "User access",
    icon: <PersonAddAltOutlinedIcon />,
    items: [
      { id: "enable-user", label: "Enable user access", to: "/enable-user" },
      { id: "reset-auth", label: "Reset user authentication", to: "/reset-auth" },
    ],
  },
  { id: "emergency", heading: "Emergency announcement", icon: <CampaignOutlinedIcon />, to: "/emergency" },
  { id: "users", heading: "Users", icon: <PeopleOutlineOutlinedIcon />, to: "/users" },
  {
    id: "report-concern",
    heading: "Report concern",
    icon: <ReportProblemOutlinedIcon />,
    items: [
      { id: "health-safety", label: "Health and Safety concern", to: "/report-health-safety" },
      { id: "sustainability", label: "Sustainability concern", to: "/report-environmental" },
      { id: "quality", label: "Quality concern", to: "/report-quality" },
      { id: "positive", label: "Positive observation", to: "/report-positive" },
      {
        id: "concern-and-positive",
        label: "Concern and positive feedback report",
        to: "/concern-positive-report",
      },
    ],
  },
  {
    id: "health-inspection",
    heading: "Health and Safety inspection",
    icon: <CheckCircleOutlineIcon />,
    items: [
      {
        id: "weekly-supervisor",
        label: "Weekly supervisor health & safety inspection",
        to: "/weekly-supervisor",
      },
      {
        id: "weekly-reports",
        label: "Weekly supervisor reports",
        to: "/weekly-reports",
      },
    ],
  },
  {
    id: "sheq",
    heading: "SHEQ Inspection service",
    icon: <AppRegistrationOutlinedIcon />,
    items: [
      { id: "sheq-report", label: "SHEQ Inspection service report", to: "/sheq-report" },
      { id: "sheq-install", label: "SHEQ Inspection installation", to: "/sheq-install" },
      { id: "sheq-install-report", label: "SHEQ Inspection installation report", to: "/sheq-install-report" },
    ],
  },
  {
    id: "life-sector",
    heading: "Life sector dashboard",
    icon: <TrendingUpOutlinedIcon />,
    items: [
      { id: "client-level", label: "Client level analysis", to: "/lift-sector-client" },
      { id: "site-level", label: "Site level analysis", to: "/lift-sector-site" },
    ],
  },
  { id: "friday-forms", heading: "Friday pack forms", icon: <ArticleOutlinedIcon />, to: "/frida-forms" },
];

export default function Sidebar({ sx = {} }) {
  const location = useLocation();
  // changed initial openGroup to null so no group is expanded/active by default
  const [openGroup, setOpenGroup] = useState(null);

  const toggleGroup = (id) => setOpenGroup((prev) => (prev === id ? null : id));

  // NEW: check active by "startsWith" so /clients and /clients/:id both match clients
  const isActive = (to) => {
    if (!to) return false;
    const path = location.pathname || "";
    return path === to || path.startsWith(to + "/") || path.startsWith(to + "?");
  };

  const headingTypographyProps = (active) => ({
    fontWeight: active ? 600 : 500,
    fontSize: "0.98rem",
    color: active ? ACTIVE_COLOR : "text.secondary",
  });

  return (
    <>
      <Box
        component="nav"
        sx={{
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          bgcolor: "background.paper",
          borderRight: "1px solid",
          borderColor: "divider",
          height: "100vh",
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 4 },
          overflowY: "auto",
          ...sx,
        }}
      >
        {/* Logo */}
       

        {/* OVERVIEW */}
        <Typography variant="overline" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
          OVERVIEW
        </Typography>

        {/* Dashboard group */}
        <Box sx={{ mb: 2 }}>
          <ListItemButton
            onClick={() => toggleGroup(DASHBOARD_GROUP.id)}
            sx={{
              pl: 0,
              py: 0.75,
              "&:hover": { bgcolor: "action.hover" },
              bgcolor: openGroup === DASHBOARD_GROUP.id ? ACTIVE_BG : "transparent",
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: openGroup === DASHBOARD_GROUP.id ? ACTIVE_COLOR : "text.secondary" }}>
              {DASHBOARD_GROUP.icon}
            </ListItemIcon>

            <ListItemText primary={DASHBOARD_GROUP.heading} primaryTypographyProps={headingTypographyProps(openGroup === DASHBOARD_GROUP.id)} />

            <ExpandMoreIcon
              sx={{
                color: "text.secondary",
                transform: openGroup === DASHBOARD_GROUP.id ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.18s ease",
              }}
            />
          </ListItemButton>

          <Collapse in={openGroup === DASHBOARD_GROUP.id} timeout="auto" unmountOnExit>
            <Box sx={{ ml: 4.5, mt: 0.5, position: "relative" }}>
              {/* vertical connector */}
              <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", bgcolor: "#e5e7eb" }} />

              {DASHBOARD_GROUP.items.map((it) => {
                const active = isActive(it.to);
                return (
                  <Box key={it.id} sx={{ position: "relative" }}>
                    {/* horizontal connector */}
                    <Box sx={{ position: "absolute", left: 0, top: "50%", width: "16px", height: "2px", bgcolor: "#e5e7eb" }} />

                    <ListItemButton
                      component={RouterLink}
                      to={it.to}
                      selected={active}
                      sx={{
                        pl: 3,
                        py: 0.6,
                        borderRadius: 1,
                        bgcolor: active ? ACTIVE_BG : "transparent",
                        color: active ? ACTIVE_COLOR : "text.secondary",
                        "& .MuiListItemIcon-root": { color: active ? ACTIVE_COLOR : "text.secondary" },
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <ListItemText
                        primary={it.label}
                        primaryTypographyProps={{
                          fontSize: "0.95rem",
                          fontWeight: active ? 600 : 400,
                          color: active ? ACTIVE_COLOR : "text.secondary",
                        }}
                      />
                    </ListItemButton>
                  </Box>
                );
              })}
            </Box>
          </Collapse>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* MENU */}
        <Typography variant="overline" sx={{ color: "text.secondary", mb: 1, display: "block" }}>
          MENU
        </Typography>

        {MENU_GROUPS.map((group) => {
          const expanded = openGroup === group.id;

          // direct link (no sub-items)
          if (!group.items) {
            const active = isActive(group.to);
            return (
              <ListItemButton
                key={group.id}
                component={RouterLink}
                to={group.to}
                selected={active}
                sx={{
                  pl: 0,
                  py: 0.75,
                  mb: 1.5,
                  borderRadius: 1,
                  bgcolor: active ? ACTIVE_BG : "transparent",
                  color: active ? ACTIVE_COLOR : "text.primary",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: active ? ACTIVE_COLOR : "text.secondary" }}>{group.icon}</ListItemIcon>
                <ListItemText primary={group.heading} primaryTypographyProps={headingTypographyProps(active)} />
              </ListItemButton>
            );
          }

          // groups with sub-items
          return (
            <Box key={group.id} sx={{ mb: 1.5 }}>
              <ListItemButton
                onClick={() => toggleGroup(group.id)}
                sx={{
                  pl: 0,
                  py: 0.75,
                  "&:hover": { bgcolor: "action.hover" },
                  bgcolor: expanded ? ACTIVE_BG : "transparent",
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: expanded ? ACTIVE_COLOR : "text.secondary" }}>{group.icon}</ListItemIcon>
                <ListItemText primary={group.heading} primaryTypographyProps={headingTypographyProps(expanded)} />
                <ExpandMoreIcon sx={{ color: "text.secondary", transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s ease" }} />
              </ListItemButton>

              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ ml: 4.5, mt: 0.5, position: "relative" }}>
                  <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "2px", bgcolor: "#e5e7eb" }} />

                  {group.items.map((it) => {
                    const active = isActive(it.to);
                    return (
                      <Box key={it.id} sx={{ position: "relative" }}>
                        <Box sx={{ position: "absolute", left: 0, top: "50%", width: "16px", height: "2px", bgcolor: "#e5e7eb" }} />

                        <ListItemButton
                          component={RouterLink}
                          to={it.to}
                          selected={active}
                          sx={{
                            pl: 3,
                            py: 0.6,
                            borderRadius: 1,
                            bgcolor: active ? ACTIVE_BG : "transparent",
                            color: active ? ACTIVE_COLOR : "text.secondary",
                            "& .MuiListItemIcon-root": { color: active ? ACTIVE_COLOR : "text.secondary" },
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <ListItemText
                            primary={it.label}
                            primaryTypographyProps={{
                              fontSize: "0.95rem",
                              fontWeight: active ? 600 : 400,
                              color: active ? ACTIVE_COLOR : "text.secondary",
                            }}
                          />
                        </ListItemButton>
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Box>
    </>
  );
}
