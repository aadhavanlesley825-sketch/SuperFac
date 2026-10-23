import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MACHINES, bandFor, CHENNAI_PLANT_NAME, filterChennaiMachines } from "../mock/machines.js";
import { ALERTS } from "../mock/alerts.js";

/* ------------------------------------------------------------------ */
/*  fleetStore                                                         */
/*                                                                      */
/*  Original shape (machines, alerts, focusedMachineId, acknowledge     */
/*  Alert, getMachine) is untouched. Everything below is additive:      */
/*                                                                      */
/*   - startFleetSim()/stopFleetSim(): mirrors digitalTwinStore's       */
/*     startSimulation()/stopSimulation() pattern exactly — a fleet-    */
/*     wide analogue of tickSensors(), draining one random machine's    */
/*     healthScore every tick instead of drifting every sensor on one   */
/*     component.                                                       */
/*   - criticalQueue: ids into `alerts`, consumed by CriticalAlertModal  */
/*     the same way digitalTwinStore.cameraFocusRequest is consumed by  */
/*     the scene — set here, read/cleared by the component.             */
/*                                                                      */
/*  Swap-in point for a real backend: replace tickFleet()'s local        */
/*  mutation with a websocket/poll handler that calls the same setters.  */
/* ------------------------------------------------------------------ */

const CHENNAI_MACHINES = filterChennaiMachines(MACHINES);

export const useFleetStore = create(
  persist(
    (set, get) => ({
      machines: CHENNAI_MACHINES,
      alerts: ALERTS.filter((alert) => alert.plant === CHENNAI_PLANT_NAME),
      focusedMachineId: null,
      criticalQueue: [],
      simTimer: null,

      setFocusedMachine: (id) => set({ focusedMachineId: id }),

      acknowledgeAlert: (id) =>
        set((s) => ({
          alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
        })),

      getMachine: (id) => get().machines.find((m) => m.id === id),

      addAssignmentAlert({
        workOrderId,
        machineName,
        priority,
        dueDate,
        source,
        sourceLabel,
        createdAt,
        machineId,
        assignedTo,
        responsibleTechnician,
        originatingAlert,
      }) {
        const normalizedSource = source === "PulseAI" ? "PulseAI" : "Staff";
        const normalizedAssigned = responsibleTechnician || assignedTo || "Unassigned";
        const eventKey = `${normalizedSource}|${workOrderId}|${normalizedAssigned}|${priority}|${dueDate || "none"}|${originatingAlert || "manual"}`;

        const alreadyExists = get().alerts.some(
          (alert) => alert.workOrderId === workOrderId && alert.assignmentEventKey === eventKey
        );

        if (alreadyExists) return null;

        const alert = {
          id: `A-${Date.now()}-wo-${workOrderId}`,
          machineId,
          machine: machineName,
          plant: CHENNAI_PLANT_NAME,
          severity: normalizedSource === "PulseAI" ? "critical" : "warning",
          failureMode: originatingAlert || "Work order assignment",
          title:
            normalizedSource === "PulseAI"
              ? "PulseAI Assigned a Work Order"
              : "Work Order Assigned",
          message:
            normalizedSource === "PulseAI"
              ? `PulseAI created work order ${workOrderId} for ${machineName} due to ${originatingAlert || "a predictive maintenance alert"}.`
              : `Work order ${workOrderId} for ${machineName} has been assigned to ${normalizedAssigned}.`,
          workOrderId,
          source: normalizedSource,
          sourceLabel: sourceLabel || (normalizedSource === "PulseAI" ? "PulseAI Auto-Assigned" : "Staff Assigned"),
          assignmentEventKey: eventKey,
          priority,
          dueDate,
          responsibleTechnician: normalizedAssigned,
          originatingAlert: originatingAlert || "Manual work order request",
          actionLabel: "View Work Order",
          actionUrl: `/work-orders?open=${encodeURIComponent(workOrderId)}`,
          raisedAt: new Date(createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          acknowledged: false,
        };

        set((s) => ({
          alerts: [alert, ...s.alerts],
        }));

        return alert;
      },

      startFleetSim() {
        if (get().simTimer) return;
        const timer = setInterval(() => get().tickFleet(), 6000);
        set({ simTimer: timer });
      },
      stopFleetSim() {
        const timer = get().simTimer;
        if (timer) clearInterval(timer);
        set({ simTimer: null });
      },

      tickFleet() {
        set((s) => {
          const idx = Math.floor(Math.random() * s.machines.length);
          const m = s.machines[idx];
          if (m.status === "critical") return {};

          const roll = Math.random();
          const drop = roll < 0.85 ? 1 + Math.random() * 2 : 4 + Math.random() * 10;
          const nextScore = Math.max(15, Math.round(m.healthScore - drop));
          const nextStatus = bandFor(nextScore);
          const nextRul =
            nextStatus === "critical" ? Math.max(2, Math.round(m.rulDays * 0.4))
            : nextStatus === "warning" ? Math.max(5, Math.round(m.rulDays * 0.7))
            : m.rulDays;

          const updated = { ...m, healthScore: nextScore, status: nextStatus, rulDays: nextRul };
          const machines = s.machines.map((x, i) => (i === idx ? updated : x));

          const escalated = nextStatus !== m.status && (nextStatus === "warning" || nextStatus === "critical");
          if (!escalated) return { machines };

          const alert = {
            id: `A-${Date.now()}`,
            machineId: updated.id,
            machine: updated.name,
            plant: updated.plant,
            severity: nextStatus,
            failureMode: updated.failureMode,
            rulDays: updated.rulDays,
            message: nextStatus === "critical"
              ? `Critical: ${updated.failureMode.toLowerCase()} predicted within ${updated.rulDays} days`
              : `Warning: elevated vibration trend on ${updated.name}`,
            raisedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            acknowledged: false,
          };

          return {
            machines,
            alerts: [alert, ...s.alerts],
            criticalQueue: nextStatus === "critical" ? [...s.criticalQueue, alert.id] : s.criticalQueue,
          };
        });
      },

      dismissCritical(alertId) {
        set((s) => ({ criticalQueue: s.criticalQueue.filter((id) => id !== alertId) }));
      },
    }),
    {
      name: "superfac-fleet-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        alerts: state.alerts,
        criticalQueue: state.criticalQueue,
        machines: state.machines,
        focusedMachineId: state.focusedMachineId,
      }),
      version: 1,
    }
  )
);
