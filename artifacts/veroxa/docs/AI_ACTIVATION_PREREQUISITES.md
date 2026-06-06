# AI Activation Prerequisites

Live AI is not active. Existing protected AI routes remain disabled until an explicit activation PR with RR approval.

Cross-links: [AI Automation Readiness Boundary](./AI_AUTOMATION_READINESS_BOUNDARY.md), [AI Automation Readiness Blueprint](./AI_AUTOMATION_READINESS_BLUEPRINT.md), [AI Server Code Inventory](./AI_SERVER_CODE_INVENTORY.md), and [Pre-Paid Activation Gate](./PRE_PAID_ACTIVATION_GATE.md).

## Required foundations before activation

- Production auth requirement: real user/session/role identity must exist before customer-connected AI output is enabled.
- Database/storage architecture: approved production data model, storage boundaries, migrations, RLS/security review, and no fixture leakage.
- Activity logs: every draft request, source context, reviewer action, approval, rejection, edit, and delivery step must be recorded.
- Draft versioning: generated drafts need immutable versions, source inputs, edit history, and final approved version tracking.
- Approval states: draft, needs business-truth confirmation, needs client confirmation, Veroxa/Faraz review, approved, rejected, held, and archived.
- Reviewer identity: Faraz/team reviewer identity must be recorded before anything becomes client-visible or platform-visible.
- Rollback plan: approved rollback for incorrect draft content, accidental visibility, bad source data, or platform/API failure.
- Prompt QA checklist: prompt scope, forbidden claims, no offer invention, business-truth uncertainty, no customer messaging, and client-safe language.
- Output evaluation checklist: accuracy, tone, scope, no guarantees, no proof math, no invented facts, no sensitive claims, and no platform-change instructions.
- Client visibility validator: blocks internal IDs, OpenAI/AI internals, proof math, raw scoring, backend/connector/API language, and risky claims.
- Cost/rate-limit controls: usage caps, per-route limits, retry controls, alerting, and manual disable switch.
- Data minimization/privacy rules: use only necessary client data, avoid sensitive excess context, and prevent cross-client leakage.
- Failure fallback behavior: safe unavailable state, rule-based/manual fallback, hold for review, and no customer-visible error leakage.

## Non-negotiable AI boundaries

- No automatic publishing.
- No customer messaging.
- No offer invention, discounts, BOGO offers, price cuts, lower prices, or new promotions.
- No platform changes without future connector approval.
- No bypassing Veroxa/Faraz review.
- Existing AI routes remain behind `requireAiRoutesEnabled` and disabled until explicit activation PR.
- Activation requires RR approval.
