# Visibility Audit Engine

## Purpose

The Visibility Audit Engine is a local, rule-based review layer for restaurant visibility issues. It supports the current Veroxa operating model:

1. Audit simple demo inputs.
2. Prepare calm next steps.
3. Seed a small number of prepared actions.
4. Route everything through the Approval Queue.
5. Wait for Faraz approval and, when needed, restaurant confirmation.

It does not publish, post, edit listings, edit websites, call external services, or perform public side effects.

## Reviewed surfaces

- Domain contracts: `src/domain/visibilityAudit/types.ts`
- Demo inputs: `src/data/audit/demoVisibilityAuditInputs.ts`
- Rule engine: `src/domain/visibilityAudit/engine.ts`
- Prepared-action mapper: `src/domain/visibilityAudit/preparedActionMapper.ts`
- Team helper: `src/lib/visibilityAudit.ts`
- Client-safe helper: `src/domain/visibilityAudit/clientSafe.ts`
- Team page: `src/pages/team-visibility-audit.tsx`
- Dashboard preview: `src/pages/team-dashboard.tsx`
- Approval Queue integration: `src/data/demo/demoPreparedActions.ts`

## Safety rules

- Findings never set `riskLevel` or `approvalRequirement` directly.
- Prepared-action risk and approval requirement remain derived by the central Prepared Actions rules engine.
- Findings that touch hours, holiday hours, menu, pricing, catering, dietary claims, health claims, or business details are mapped to actions that require confirmation before approval.
- The mapper caps visibility-prepared actions at two per restaurant to avoid flooding the Approval Queue.
- Duplicate prepared actions are filtered by client, channel, type, and title.
- Team wording uses calm labels such as "Visibility issue," "Prepared action," "Ready for review," "Needs confirmation," and "Suggested next step."
- Client-safe helpers summarize visibility work without exposing rule names, evidence labels, or internal audit details.

## Current scope

The current implementation is intentionally small and deterministic. It uses demo inputs and local state only. It is suitable for Team review and Approval Queue hardening, not real external execution.

## Not in scope yet

- Live data collection
- External publishing
- Website or CMS writes
- Social publishing
- Storage uploads
- Production authentication changes
- Payment or pricing changes
- Owner/Operator dashboards
