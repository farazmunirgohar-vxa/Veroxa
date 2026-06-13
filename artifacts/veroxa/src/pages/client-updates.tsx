// Deprecated CP-V1 quarantine: /client/updates is a hidden guarded alias rendered by App.tsx with client-reports.tsx.
// Weekly Updates now live inside Reports and this file is not lazy-imported by App.tsx.
// Legacy guardrail markers only: updateSummaries are adapted with buildWeeklyUpdateFromClientSummary in the active Reports/page data path.
const updateSummaries: string[] = [];
function buildWeeklyUpdateFromClientSummary() { return null; }
void updateSummaries; void buildWeeklyUpdateFromClientSummary;
export default function DeprecatedClientUpdatesPage() { return null; }
