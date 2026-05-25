export type IntegrationCategory =
  | "AI" | "Social" | "Google" | "Communication" | "Analytics" | "Storage" | "Payments";

export type IntegrationStatus = "Not Connected" | "Planned" | "Ready" | "Future";

export interface Integration {
  id:          string;
  category:    IntegrationCategory;
  name:        string;
  description: string;
  status:      IntegrationStatus;
  docsHref?:   string;
}
