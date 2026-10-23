function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkText(text, size = 18) {
  return text.match(new RegExp(`.{1,${size}}`, "g")) || [text];
}

function summarizeCounter(name, count) {
  return `${count} ${name}${count === 1 ? "" : "s"}`;
}

function buildContextSummary(context) {
  const machines = context.machines?.length ?? 0;
  const alerts = context.alerts?.length ?? 0;
  const workOrders = context.openWorkOrders ?? 0;
  const critical = context.alerts?.filter((a) => a.severity === "critical" && !a.acknowledged).length ?? 0;
  const warnings = context.alerts?.filter((a) => a.severity === "warning" && !a.acknowledged).length ?? 0;
  const page = context.currentPage || "application";

  return `Context: current page is ${page} for the Nike Chennai Manufacturing Facility. There are ${machines} monitored machines, ${alerts} alerts (${critical} critical, ${warnings} warning), and ${workOrders} open work orders.`;
}

function generateAgentResponse({ input, context }) {
  const q = input.trim().toLowerCase();
  const summary = buildContextSummary(context);
  const criticalAlerts = context.alerts?.filter((a) => a.severity === "critical" && !a.acknowledged) || [];
  const warningAlerts = context.alerts?.filter((a) => a.severity === "warning" && !a.acknowledged) || [];
  const machines = context.machines || [];
  const openWorkOrders = context.openWorkOrders || 0;
  const selectedComponent = context.selectedComponent;

  if (q.includes("open the digital twin") || q.includes("go to digital twin") || q.includes("navigate to digital twin")) {
    return "Opening the Digital Twin view and preparing agent suggestions for the current machine layout.";
  }

  if (q.includes("open the alerts") || q.includes("go to alerts") || q.includes("navigate to alerts")) {
    return "Navigating to Alerts so you can inspect active issues and triage them immediately.";
  }

  if (q.includes("open work orders") || q.includes("maintenance page") || q.includes("go to maintenance")) {
    return "Navigating to the maintenance queue so you can prioritize work orders and assign tasks.";
  }

  if (q.includes("urgent") || q.includes("critical")) {
    if (criticalAlerts.length > 0) {
      return `I found ${criticalAlerts.length} unresolved critical alert${criticalAlerts.length === 1 ? "" : "s"}. The most recent is ${criticalAlerts[0].machine}: ${criticalAlerts[0].message}. I recommend reviewing those alerts first and opening the alert detail for immediate action.`;
    }
    if (warningAlerts.length > 0) {
      return `There are no active critical alerts, but ${warningAlerts.length} warning alert${warningAlerts.length === 1 ? "" : "s"} pending review. You should check those before they escalate.`;
    }
    return "No high-severity alerts are active right now. Continue monitoring the fleet and check the twin for any warning signals.";
  }

  if (q.includes("summarize") && q.includes("alerts")) {
    return `Summary: ${summary} I recommend focusing on the ${criticalAlerts.length > 0 ? summarizeCounter("critical alert", criticalAlerts.length) : summarizeCounter("open work order", openWorkOrders)} first.`;
  }

  if (q.includes("compare") && q.includes("machine")) {
    const target = selectedComponent ? selectedComponent.name : machines[0]?.name;
    const avgHealth = machines.length ? Math.round(machines.reduce((sum, machine) => sum + machine.healthScore, 0) / machines.length) : 0;
    return `Comparing ${target} to the Chennai plant average: plant health is ${avgHealth}%. ${selectedComponent ? `${target} is currently ${selectedComponent.severity} with its own status and may require attention if it falls below the plant average.` : "Select a machine for a more specific comparison."}`;
  }

  if (q.includes("why") && q.includes("unhealthy")) {
    if (selectedComponent) {
      return `The selected component ${selectedComponent.name} is marked ${selectedComponent.severity}. Check its sensor readings and current diagnostics in the twin. If it is a pump or bearing, the likely causes are thermal drift, vibration rise, or pressure deviation. I recommend opening its diagnostics panel next.`;
    }
    return "I need a selected machine or component to explain why it is unhealthy. Select it in the current page and ask again.";
  }

  if (q.includes("recommend") || q.includes("maintenance")) {
    return `Based on current page context, I recommend prioritizing ${criticalAlerts.length > 0 ? "critical alerts and associated work orders" : warningAlerts.length > 0 ? "warning alerts" : "routine inspection of the digital twin components"}. You can also schedule a maintenance window for the top affected assets and assign the work order to a technician.`;
  }

  if (q.includes("health") || q.includes("fleet average")) {
    const avgHealth = machines.length ? Math.round(machines.reduce((sum, machine) => sum + machine.healthScore, 0) / machines.length) : 0;
    return `Chennai plant health is currently ${avgHealth}% across ${machines.length} assets. ${criticalAlerts.length} are critical and ${warningAlerts.length} are warnings. Focus on the worst-performing machines next.`;
  }

  if (q.includes("page") || q.includes("current")) {
    return `You are currently on the ${context.currentPage || "application"} page. ${summary}`;
  }

  return `I reviewed the current context. ${summary} Ask me to summarize alerts, compare machines, explain a chart, recommend maintenance, or open a page.`;
}

export async function sendCommand({ history, input, context, onUpdate }) {
  const response = generateAgentResponse({ input, context });
  const chunks = chunkText(response, 22);
  let current = "";
  for (const chunk of chunks) {
    current += chunk;
    if (typeof onUpdate === "function") {
      onUpdate(current);
    }
    await delay(35);
  }
  return response;
}
