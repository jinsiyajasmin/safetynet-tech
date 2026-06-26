/** Field layout aligned with Health & Safety concern form sections */
export const ACTION_TRACKER_FIELD_SECTIONS = [
  {
    heading: "Project details",
    fields: [
      { id: "report_date", label: "Report date", type: "date" },
      { id: "customer_reference", label: "Customer reference", type: "text" },
      { id: "project_name", label: "Project name", type: "text" },
      { id: "customer_name", label: "Customer name", type: "text" },
    ],
  },
  {
    heading: "Management & contacts",
    fields: [
      { id: "fujitec_manager", label: "Manager", type: "text" },
      { id: "fujitec_supervisor", label: "Supervisor", type: "text" },
      { id: "responsible_person", label: "Responsible engineer(s)", type: "text" },
      { id: "site_contact", label: "Site contact", type: "text" },
    ],
  },
  {
    heading: "Location details",
    fields: [
      { id: "full_address", label: "Full address", type: "textarea" },
      { id: "exact_location", label: "Exact location of incident", type: "textarea" },
    ],
  },
  {
    heading: "Observations & suggestions",
    fields: [
      { id: "observation_details", label: "Observation details", type: "textarea" },
      { id: "corrective_action", label: "Corrective action proposed", type: "textarea" },
    ],
  },
  {
    heading: "Nonconformance",
    fields: [
      { id: "noncon_action", label: "Correction action", type: "textarea" },
      { id: "noncon_responsible", label: "Responsible person", type: "text", readOnlyInEdit: true },
      { id: "noncon_responsible_email", label: "Responsible person email", type: "text", readOnlyInEdit: true },
      { id: "noncon_date", label: "Date completed", type: "date" },
    ],
  },
];

export function actionToFormValues(action) {
  if (!action) return {};
  const d = action.details || {};
  return {
    ...d,
    report_date: d.report_date || "",
    customer_reference: d.customer_reference || "",
    project_name: d.project_name || "",
    customer_name: d.customer_name || "",
    fujitec_manager: d.fujitec_manager || "",
    fujitec_supervisor: d.fujitec_supervisor || "",
    responsible_person: d.responsible_person || "",
    site_contact: d.site_contact || "",
    full_address: d.full_address || "",
    exact_location: d.exact_location || "",
    observation_details: d.observation_details || "",
    corrective_action: d.corrective_action || "",
    noncon_action: action.correctionAction || d.noncon_action || "",
    noncon_responsible: action.responsibleName || d.noncon_responsible || "",
    noncon_responsible_email: action.responsibleEmail || d.noncon_responsible_email || "",
    noncon_date: action.dateCompleted || d.noncon_date || "",
    incidents: Array.isArray(d.incidents) ? d.incidents : [],
    incidents_other: d.incidents_other || "",
  };
}

export function formValuesToUpdatePayload(values, responseNotes) {
  const {
    noncon_action,
    noncon_date,
    noncon_responsible,
    noncon_responsible_email,
    ...rest
  } = values;

  return {
    correctionAction: noncon_action || "",
    dateCompleted: noncon_date || "",
    responseNotes,
    details: {
      ...rest,
      noncon_action: noncon_action || "",
      noncon_date: noncon_date || "",
      noncon_responsible: noncon_responsible || "",
      noncon_responsible_email: noncon_responsible_email || "",
      incidents: Array.isArray(rest.incidents) ? rest.incidents : [],
    },
  };
}
