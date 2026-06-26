import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Divider,
  Button,
} from "@mui/material";
import { Settings, Menu as MenuIcon, PanelLeft, PanelLeftClose, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/api";

const iconButtonSx = (isDarkMode) => ({
  color: isDarkMode ? "#F9FAFB" : "#111827",
  "&:hover": {
    bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
  },
});

export default function TopNav({
  pageTitle,
  onMobileMenuClick,
  desktopSidebarOpen = true,
  onDesktopSidebarToggle,
}) {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [notifAnchor, setNotifAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadNotificationCount();
      setUnreadCount(res?.count || 0);
    } catch {
      /* ignore polling errors */
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoadingNotifs(true);
    try {
      const res = await fetchNotifications(20);
      setNotifications(res?.data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  const openNotifications = async (event) => {
    setNotifAnchor(event.currentTarget);
    await loadNotifications();
    await loadUnreadCount();
  };

  const closeNotifications = () => {
    setNotifAnchor(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id);
      } catch {
        /* ignore */
      }
    }
    closeNotifications();
    await loadUnreadCount();
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 1.5, md: 2.5 },
        py: { xs: 1, md: 1.5 },
        bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 0,
        boxShadow: "none",
        borderBottom: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="Open navigation menu"
          onClick={onMobileMenuClick}
          sx={{ display: { xs: "flex", md: "none" }, ...iconButtonSx(isDarkMode) }}
        >
          <MenuIcon size={20} />
        </IconButton>
        {onDesktopSidebarToggle ? (
          <IconButton
            edge="start"
            color="inherit"
            aria-label={desktopSidebarOpen ? "Close sidebar" : "Open sidebar"}
            onClick={onDesktopSidebarToggle}
            sx={{ display: { xs: "none", md: "flex" }, ...iconButtonSx(isDarkMode) }}
          >
            {desktopSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </IconButton>
        ) : null}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 } }}>
        <IconButton
          aria-label="Notifications"
          onClick={openNotifications}
          sx={{ ...iconButtonSx(isDarkMode), position: "relative" }}
        >
          <Bell size={20} />
          {unreadCount > 0 ? (
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: "#EF4444",
                border: `2px solid ${isDarkMode ? "#111827" : "#FFFFFF"}`,
              }}
            />
          ) : null}
        </IconButton>
        <IconButton
          aria-label="Settings"
          onClick={() => navigate("/account-settings")}
          sx={iconButtonSx(isDarkMode)}
        >
          <Settings size={20} />
        </IconButton>
      </Box>

      <Menu
        anchorEl={notifAnchor}
        open={Boolean(notifAnchor)}
        onClose={closeNotifications}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 320,
            maxWidth: 380,
            bgcolor: isDarkMode ? "#1F2937" : "#FFFFFF",
            color: isDarkMode ? "#F9FAFB" : "#111827",
            border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Notifications
          </Typography>
          {unreadCount > 0 ? (
            <Button size="small" onClick={handleMarkAllRead} sx={{ textTransform: "none", minWidth: 0 }}>
              Mark all read
            </Button>
          ) : null}
        </Box>
        <Divider />
        {loadingNotifs ? (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
              Loading…
            </Typography>
          </MenuItem>
        ) : notifications.length === 0 ? (
          <MenuItem disabled sx={{ opacity: 1 }}>
            <Typography variant="body2" sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280" }}>
              No new notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                alignItems: "flex-start",
                whiteSpace: "normal",
                py: 1.25,
                bgcolor: notification.read
                  ? "transparent"
                  : isDarkMode
                    ? "rgba(239, 68, 68, 0.08)"
                    : "rgba(239, 68, 68, 0.06)",
              }}
            >
              <Box sx={{ width: "100%" }}>
                <Typography variant="body2" sx={{ fontWeight: notification.read ? 500 : 700 }}>
                  {notification.title}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280", display: "block", mt: 0.25 }}>
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}
