import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import { AuthLoadingScreen } from "./AuthShell.jsx";

/* ------------------------------------------------------------------ */
/*  ProtectedRoute — gates a route behind an active session, and       */
/*  optionally behind a role whitelist for RBAC-restricted screens.    */
/*                                                                      */
/*  <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />                      */
/*  <Route path="/admin/users" element={                                                            */
/*    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}><UserManagement /></ProtectedRoute>               */
/*  } />                                                                                              */
/* ------------------------------------------------------------------ */

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <AuthLoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && allowedRoles.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
