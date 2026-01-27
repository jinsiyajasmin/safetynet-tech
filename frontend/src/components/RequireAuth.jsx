// src/components/RequireAuth.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }} // so you can redirect back after login
      />
    );
  }

  return children;
}

