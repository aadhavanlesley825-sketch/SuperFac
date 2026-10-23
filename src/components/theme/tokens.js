/* ------------------------------------------------------------------ */
/*  Shared design tokens for PulsePlant.                               */
/*  TONE is keyed by raw color name (used by generic UI chrome).       */
/*  STATE maps machine-health semantics onto those same colors so      */
/*  every widget reads correctly for the predictive-maintenance        */
/*  domain: healthy / monitoring / warning / critical.                 */
/* ------------------------------------------------------------------ */

export const TONE = {
  amber: { text: "#9a5d00", soft: "rgba(217,119,6,0.12)", ring: "rgba(217,119,6,0.22)" },
  cyan: { text: "#a45d1d", soft: "rgba(217,119,6,0.10)", ring: "rgba(217,119,6,0.22)" },
  rose: { text: "#b91c1c", soft: "rgba(220,38,38,0.10)", ring: "rgba(220,38,38,0.22)" },
  mint: { text: "#0f766e", soft: "rgba(13,148,136,0.10)", ring: "rgba(13,148,136,0.22)" },
};

// Semantic aliasing for machine-health states, mapped onto the same palette.
export const STATE = {
  healthy: TONE.mint,
  monitoring: TONE.cyan,
  warning: TONE.amber,
  critical: TONE.rose,
};

export const STATE_LABEL = {
  healthy: "Healthy",
  monitoring: "Monitoring",
  warning: "Warning",
  critical: "Critical",
};
