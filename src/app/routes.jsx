import React, { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "./AppShell.jsx";

import ProtectedRoute from "../auth/ProtectedRoute.jsx";

const LoginPage = lazy(() => import("../pages/Login.jsx"));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPassword.jsx"));
const UnauthorizedPage = lazy(() => import("../pages/Unauthorized.jsx"));

const OverviewPage = lazy(() => import("../pages/overview/OverviewPage.jsx"));
const FleetExplorerPage = lazy(() => import("../pages/machines/FleetExplorerPage.jsx"));
const MachineDetailPage = lazy(() => import("../pages/machines/MachineDetailPage.jsx"));
const AlertsPage = lazy(() => import("../pages/alerts/AlertsPage.jsx"));
const AlertDetailPage = lazy(() => import("../pages/alerts/AlertDetailPage.jsx"));
const MaintenanceSchedulerPage = lazy(() => import("../pages/maintenance/MaintenanceSchedulerPage.jsx"));
const WorkOrderDetailPage = lazy(() => import("../pages/maintenance/WorkOrderDetailPage.jsx"));
const ReportsPage = lazy(() => import("../pages/reports/ReportsPage.jsx"));
const SettingsPage = lazy(() => import("../pages/settings/SettingsPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

// NEW PAGES
const DigitalTwinPage = lazy(() =>
  import("../pages/digitalTwin/DigitalTwinPage.jsx")
);

const WorkOrdersPage = lazy(() =>
  import("../pages/digitalTwin/WorkOrdersPage.jsx")
);

function withSuspense(el) {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-slate-600 text-sm">
          Loading…
        </div>
      }
    >
      {el}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />),
  },
  {
    path: "/forgot-password",
    element: withSuspense(<ForgotPasswordPage />),
  },
  {
    path: "/unauthorized",
    element: withSuspense(<UnauthorizedPage />),
  },

  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },

      { path: "overview", element: withSuspense(<OverviewPage />) },

      { path: "machines", element: withSuspense(<FleetExplorerPage />) },

      {
        path: "machines/:machineId",
        element: withSuspense(<MachineDetailPage />),
      },

      // ==========================
      // DIGITAL TWIN
      // ==========================
      {
        path: "digital-twin",
        element: withSuspense(<DigitalTwinPage />),
      },

      {
        path: "work-orders",
        element: withSuspense(<WorkOrdersPage />),
      },

      // ==========================

      { path: "alerts", element: withSuspense(<AlertsPage />) },

      {
        path: "alerts/:alertId",
        element: withSuspense(<AlertDetailPage />),
      },

      {
        path: "maintenance",
        element: withSuspense(<MaintenanceSchedulerPage />),
      },

      {
        path: "maintenance/:workOrderId",
        element: withSuspense(<WorkOrderDetailPage />),
      },

      { path: "reports", element: withSuspense(<ReportsPage />) },

      { path: "settings", element: withSuspense(<SettingsPage />) },

      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
]);

export default router;