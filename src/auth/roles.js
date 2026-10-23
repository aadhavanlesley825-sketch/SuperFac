/* ------------------------------------------------------------------ */
/*  PulsePlant RBAC — role + resource definitions.                     */
/*  Single source of truth for "who can see what" across the platform. */
/*  New roadmap screens just add a RESOURCES key and list it in the    */
/*  relevant ROLE_PERMISSIONS arrays below — no other file changes.    */
/* ------------------------------------------------------------------ */

export const ROLES = {
  ADMIN: "admin",
  PLANT_MANAGER: "plant_manager",
  SERVICE_ENGINEER: "service_engineer",
  TECHNICIAN: "technician",
};

export const ROLE_LIST = Object.values(ROLES);

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.PLANT_MANAGER]: "Plant Manager",
  [ROLES.SERVICE_ENGINEER]: "Service Engineer",
  [ROLES.TECHNICIAN]: "Technician",
};

/* Maps to the phased roadmap called out in ComingNext.jsx: Auth/RBAC →
   Digital Twin → Machine Details → AI Prediction Center → Work Orders →
   Technician Workspace → Verification → Inventory → Analytics. */
export const RESOURCES = {
  OVERVIEW: "overview",
  DIGITAL_TWIN: "digital_twin",
  MACHINE_DETAIL: "machine_detail",
  AI_PREDICTION: "ai_prediction",
  WORK_ORDERS: "work_orders",
  TECHNICIAN_WORKSPACE: "technician_workspace",
  VERIFICATION: "verification",
  INVENTORY: "inventory",
  ANALYTICS: "analytics",
  USER_MANAGEMENT: "user_management",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(RESOURCES), // full access, including user management

  [ROLES.PLANT_MANAGER]: [
    RESOURCES.OVERVIEW,
    RESOURCES.DIGITAL_TWIN,
    RESOURCES.MACHINE_DETAIL,
    RESOURCES.AI_PREDICTION,
    RESOURCES.WORK_ORDERS,
    RESOURCES.VERIFICATION,
    RESOURCES.INVENTORY,
    RESOURCES.ANALYTICS,
  ],

  [ROLES.SERVICE_ENGINEER]: [
    RESOURCES.OVERVIEW,
    RESOURCES.DIGITAL_TWIN,
    RESOURCES.MACHINE_DETAIL,
    RESOURCES.AI_PREDICTION,
    RESOURCES.WORK_ORDERS,
    RESOURCES.TECHNICIAN_WORKSPACE,
    RESOURCES.VERIFICATION,
  ],

  [ROLES.TECHNICIAN]: [
    RESOURCES.OVERVIEW,
    RESOURCES.MACHINE_DETAIL,
    RESOURCES.WORK_ORDERS,
    RESOURCES.TECHNICIAN_WORKSPACE,
  ],
};

export function hasPermission(role, resource) {
  return Boolean(ROLE_PERMISSIONS[role]?.includes(resource));
}
