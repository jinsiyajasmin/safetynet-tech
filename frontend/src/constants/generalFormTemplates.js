/** Shared general-form template catalog (library + site pack + monitoring). */
export const GENERAL_FORM_TEMPLATES = [
  {
    id: "tool-box-talk",
    title: "Tool Box Talk Register",
    description: "Record all tool box talk topics and attendees",
    path: "/general-forms/tool-box-talk",
  },
  {
    id: "rams-briefing",
    title: "RAMS Briefing Form",
    description: "Risk Assessment & Method Statement Briefing",
    path: "/general-forms/rams-briefing",
  },
  {
    id: "site-induction",
    title: "Site Induction Register",
    description: "Sign-off register for site inductions",
    path: "/general-forms/site-induction",
  },
  {
    id: "management-site-inspection",
    title: "Management Site Inspection Report",
    description: "Comprehensive site H&S walkthrough",
    path: "/general-forms/management-site-inspection",
  },
  {
    id: "daily-safe-start-briefing",
    title: "Daily Safe Start Briefing Sheet",
    description: "Start Right Daily Safety Briefing",
    path: "/general-forms/daily-safe-start-briefing",
  },
  {
    id: "audit-action-form",
    title: "Audit Action Form",
    description: "Review and report observations & assigned actions",
    path: "/general-forms/audit-action-form",
  },
  {
    id: "site-induction-form",
    title: "Site Induction Form",
    description: "Personal and comprehensive 3-page site induction record",
    path: "/general-forms/site-induction-form",
  },
  {
    id: "loler-inspection-form",
    title: "LOLER Inspection Form",
    description: "Official Equipment inspection and certification",
    path: "/general-forms/loler-inspection-form",
  },
  {
    id: "puwer-inspection-form",
    title: "PUWER Inspection Form",
    description: "Plant equipment formal maintenance certification",
    path: "/general-forms/puwer-inspection-form",
  },
  {
    id: "alimak-weekly-check",
    title: "Alimak Weekly Check",
    description: "Weekly hoist safety inspection checklist",
    path: "/general-forms/alimak-weekly-check",
  },
];

export const GENERAL_FORM_TEMPLATE_BY_TITLE = Object.fromEntries(
  GENERAL_FORM_TEMPLATES.map((t) => [t.title, t])
);
