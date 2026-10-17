// The exact wording of each marketing opt-in checkbox. Shown in the UI and
// stored with the consent record, so you can always see what someone agreed to.
// Change the wording here (not in the components) so the record stays accurate.
export const CONSENT_TEXT = {
  free_report: "Email me tips about my report and occasional Creatively.ai offers. Optional — unsubscribe anytime.",
  signup: "Email me tips, product updates and occasional offers from Creatively.ai. Optional — unsubscribe anytime.",
} as const;

export type ConsentSource = keyof typeof CONSENT_TEXT;
