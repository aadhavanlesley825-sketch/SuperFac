import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthShell from "../auth/AuthShell.jsx";

/* ------------------------------------------------------------------ */
/*  Unauthorized — shown when a signed-in user hits a route their role  */
/*  isn't permitted to see (see roles.js / ProtectedRoute allowedRoles).*/
/* ------------------------------------------------------------------ */

export default function Unauthorized() {
  return (
    <AuthShell
      eyebrow="Access restricted"
      title="You don't have access to this page"
      subtitle="Your role doesn't include permission for this section of SuperFac. Contact your plant administrator if you believe this is a mistake."
    >
      <Link to="/" className="auth-btn-primary">
        <ArrowLeft size={15} />
        Back to Overview
      </Link>
    </AuthShell>
  );
}
