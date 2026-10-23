import { useDigitalTwinStore, ROLES } from "../../lib/stores/digitalTwinStore.js";

/* ------------------------------------------------------------------ */
/*  Role-based permissions for the Digital Twin / Work Orders modules. */
/*                                                                      */
/*  INTEGRATION SEAM: this project's real role almost certainly lives   */
/*  on the authenticated user from AuthContext (e.g. `useAuth().user.   */
/*  role`). Rather than guess that context's exact shape, permissions    */
/*  here read from a `role` field on the digital-twin store (settable    */
/*  via the role switcher in the Work Orders page header, for demo/QA    */
/*  purposes). To wire in real auth, replace the body of `useRole()`     */
/*  below with your AuthContext's role — everything else in this file    */
/*  and every screen that calls `usePermissions()` stays unchanged:      */
/*                                                                      */
/*    import { useAuth } from "../auth/AuthContext.jsx";                 */
/*    export function useRole() {                                        */
/*      const { user } = useAuth();                                      */
/*      return user?.role ?? "Technician";                               */
/*    }                                                                  */
/* ------------------------------------------------------------------ */

export { ROLES };

export function useRole() {
  return useDigitalTwinStore((s) => s.role);
}

const ASSIGN_ROLES = new Set(["Admin", "Plant Manager"]);
const PROGRESS_ROLES = new Set(["Admin", "Plant Manager", "Engineer", "Technician"]);

export function usePermissions() {
  const role = useRole();
  return {
    role,
    // Admins and Plant Managers create tickets and hand them to a technician/engineer.
    canAssignWorkOrders: ASSIGN_ROLES.has(role),
    // Engineers and Technicians (plus Admin/PM) move a ticket through its own workflow.
    canUpdateProgress: PROGRESS_ROLES.has(role),
    canGenerateWorkOrder: true,
    canCloseWorkOrder: ASSIGN_ROLES.has(role),
  };
}
