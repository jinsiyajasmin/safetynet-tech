import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getStoredToken,
  isTokenExpired,
  registerSessionExpiredHandler,
  scheduleTokenExpiryLogout,
  clearExpiryTimer,
  handleSessionExpired,
} from "../utils/authSession";

/**
 * Wires JWT expiry → logout + redirect. Mount once inside BrowserRouter.
 */
export default function SessionManager() {
  const navigate = useNavigate();
  const { clearUser, refreshUser, refreshUserFromServer } = useAuth();

  useEffect(() => {
    registerSessionExpiredHandler((reason) => {
      clearUser();
      navigate("/login", {
        replace: true,
        state: { sessionExpired: reason === "expired" || reason === "unauthorized" },
      });
    });

    return () => {
      registerSessionExpiredHandler(null);
      clearExpiryTimer();
    };
  }, [clearUser, navigate]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      clearExpiryTimer();
      return undefined;
    }

    if (isTokenExpired(token)) {
      handleSessionExpired("expired");
      return undefined;
    }

    refreshUser();
    return scheduleTokenExpiryLogout(token);
  }, [refreshUser]);

  useEffect(() => {
    const lastSyncRef = { at: 0 };
    const MIN_SYNC_MS = 60_000;

    const syncProfile = (force = false) => {
      const token = getStoredToken();
      if (!token) return;
      if (isTokenExpired(token)) {
        handleSessionExpired("expired");
        return;
      }

      const now = Date.now();
      if (!force && now - lastSyncRef.at < MIN_SYNC_MS) return;
      lastSyncRef.at = now;

      scheduleTokenExpiryLogout(token);
      refreshUserFromServer();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") syncProfile();
    };

    const onFocus = () => syncProfile();

    syncProfile(true);
    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") syncProfile();
    }, 90_000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshUserFromServer]);

  return null;
}
