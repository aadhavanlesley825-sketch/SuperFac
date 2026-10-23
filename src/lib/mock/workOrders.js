import { MACHINES } from "./machines.js";

const priorityFor = (status) => (status === "critical" ? "Urgent" : status === "warning" ? "High" : "Routine");
const staffNames = ["R. Suresh", "A. Fernandes", "P. Iyer", "K. Menon"];

export const WORK_ORDERS = MACHINES.map((m, i) => {
  const generatedByPulseAI = m.status === "critical" || m.status === "warning";
  const assignee = generatedByPulseAI ? "PulseAI" : staffNames[i % staffNames.length];
  const responsibleTechnician = generatedByPulseAI ? staffNames[(i + 1) % staffNames.length] : assignee;

  return {
    id: `WO-${2280 + i * 3}`,
    machineId: m.id,
    machine: m.name,
    plant: m.plant,
    task: m.status === "healthy"
      ? "Scheduled preventive maintenance"
      : `Predictive intervention — ${m.failureMode.toLowerCase()}`,
    priority: priorityFor(m.status),
    status: i % 5 === 0 ? "In progress" : i % 5 === 1 ? "Completed" : "Scheduled",
    dueIn: m.status === "critical" ? `${m.rulDays}d` : m.status === "warning" ? `${m.rulDays}d` : "Next PM cycle",
    source: generatedByPulseAI ? "PulseAI" : "Staff",
    sourceLabel: generatedByPulseAI ? "PulseAI Auto-Assigned" : "Staff Assigned",
    assignee,
    responsibleTechnician,
    originatingAlert: generatedByPulseAI ? `${m.failureMode} alert` : "Manual work order request",
  };
}).filter((wo) => wo.priority !== "Routine" || Math.random() > 0.4);
