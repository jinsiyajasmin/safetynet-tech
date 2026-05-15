// src/components/RoleGuard.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wraps a route and allows only users whose role is in `allowedRoles`.
 * By default, Safetynett company users bypass checks (elevated app role).
 * Set `matchStoredRoleOnly` to compare against the account role saved on the user
 * (e.g. Users page: only true superadmin / company_admin accounts).
 */
export default function RoleGuard({ allowedRoles = [], children, matchStoredRoleOnly = false }) {
  const { currentUser, hasRole, isSafetyNett } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (matchStoredRoleOnly && allowedRoles.length > 0) {
    const stored = (currentUser.role || "").toString().toLowerCase();
    const allowed = (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).map((r) =>
      String(r).toLowerCase()
    );
    if (allowed.includes(stored)) {
      return children;
    }
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  if (isSafetyNett || allowedRoles.length === 0 || hasRole(allowedRoles)) {
    return children;
  }

  return <Navigate to="/unauthorized" state={{ from: location }} replace />;
}
