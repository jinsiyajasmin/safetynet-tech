import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Avatar,
  Typography,
  Drawer,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";
import PaymentIcon from "@mui/icons-material/ReceiptLong";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, Link as RouterLink } from "react-router-dom";

export default function TopNav({ onMenuClick }) {
  const navigate = useNavigate();
  const [openDrawer, setOpenDrawer] = useState(false);

  // get name, email, and profile picture (from localStorage if saved)
  const name = localStorage.getItem("name") || "John Doe";
  const email = localStorage.getItem("email") || "John@gmail.com";
  const profilePic =
    localStorage.getItem("profilePic") || "/profile-placeholder.jpg"; // 🔹 use your default image path

  const toggleDrawer = (open) => () => setOpenDrawer(open);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setOpenDrawer(false);
    navigate("/login");
  };

  const handleNavigate = (to) => {
    setOpenDrawer(false);
    navigate(to);
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        color="default"
        sx={{
          bgcolor: "#ffffff",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 2, sm: 4 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Menu Button (mobile) */}
            <IconButton
              edge="start"
              sx={{ display: { xs: "inline-flex", md: "none" } }}
              onClick={onMenuClick}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Box
              component={RouterLink}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              <Box
                component="img"
                src="/logo.png"
                alt="logo"
                sx={{ height: 36, width: "auto" }}
              />
            </Box>
          </Box>

          {/* Avatar/Profile */}
          <IconButton onClick={toggleDrawer(true)}>
            <Avatar
              src="avatar.png" // ✅ image will appear here
              alt={name}
              sx={{
                width: 48,
                height:48,
                bgcolor: "#0d5d97ff",
                color: "white",
                fontWeight: 600,
              }}
            >
              {!profilePic && name.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Right Drawer (Offcanvas) */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: "92%", sm: 380 },
            maxWidth: 420,
            borderRadius: { xs: 0, sm: 2 },
            overflow: "hidden",
          },
        }}
      >
        {/* Close Button */}
        <Box sx={{ px: 3, py: 2, display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={toggleDrawer(false)}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Profile Avatar */}
        <Box
          sx={{
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {/* Avatar with border ring */}
          <Box
            sx={{
              width: 110,
              height: 110,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6))",
              boxShadow:
                "inset 0 0 0 6px rgba(170, 223, 190, 0.5), 0 6px 18px rgba(0,0,0,0.06)",
            }}
          >
            <Avatar
              src="avatar.png" // ✅ show image in drawer too
              alt={name}
              sx={{
                width: 88,
                height: 88,
                bgcolor: "#0d5d97ff",
                color: "white",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {!profilePic && name.charAt(0).toUpperCase()}
            </Avatar>
          </Box>

          <Typography sx={{ mt: 1, fontWeight: 700, fontSize: "1.05rem" }}>
            {name}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: "0.95rem" }}>
            {email}
          </Typography>
        </Box>

        {/* Dotted Divider */}
        <Box sx={{ px: 3, pt: 2 }}>
          <Divider sx={{ borderStyle: "dashed", borderColor: "divider" }} />
        </Box>

        {/* Menu Items */}
        <Box sx={{ px: 1, mt: 1 }}>
          <List disablePadding>
            <ListItemButton
              onClick={() => handleNavigate("/dashboard")}
              sx={{ py: 1.25, px: 3 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <HomeIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary="Home"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNavigate("/profile")}
              sx={{ py: 1.25, px: 3 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <PersonIcon color="action" />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItemButton>

            
            <ListItemButton
              onClick={() => handleNavigate("/templates")}
              sx={{ py: 1.25, px: 3 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <DescriptionIcon color="action" />
              </ListItemIcon>
              <ListItemText primary="Templates" />
            </ListItemButton>

            <ListItemButton
              onClick={() => handleNavigate("/account-settings")}
              sx={{ py: 1.25, px: 3 }}
            >
              <ListItemIcon sx={{ minWidth: 44 }}>
                <SettingsIcon color="action" />
              </ListItemIcon>
              <ListItemText primary="Account settings" />
            </ListItemButton>
          </List>
        </Box>

        {/* Dotted Divider */}
        <Box sx={{ px: 3, pt: 2 }}>
          <Divider sx={{ borderStyle: "dashed", borderColor: "divider" }} />
        </Box>

        {/* Logout Button */}
        <Box sx={{ px: 3, py: 3, mt: "auto" }}>
          <Button
            fullWidth
            onClick={handleLogout}
            sx={{
              bgcolor: "#FDEBE9",
              color: "#B8332A",
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              py: 1.5,
              fontSize: "1rem",
              "&:hover": { bgcolor: "#FDD9D3" },
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>
    </>
  );
}
