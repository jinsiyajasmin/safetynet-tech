// src/components/RoleGuard.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStoredRole, resolveEffectiveRole } from "../utils/resolveEffectiveRole";

/**
 * Wraps a route and allows only users whose role is in `allowedRoles`.
 * Default: effective role (Safetynett company_admin → superadmin, same as most app flows).
 * `matchStoredRoleOnly`: compare stored JWT/DB role only — use for routes that must
 * exclude elevated Safetynett company_admin (e.g. /clients superadmin-only).
 */
export default function RoleGuard({ allowedRoles = [], children, matchStoredRoleOnly = false }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roleForCheck = matchStoredRoleOnly
    ? getStoredRole(currentUser)
    : resolveEffectiveRole(currentUser);
  const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((r) =>
    String(r).toLowerCase()
  );

  const permitted = allowed.length === 0 || allowed.includes(roleForCheck);

  if (permitted) {
    return children;
  }

  return <Navigate to="/unauthorized" state={{ from: location }} replace />;
}
