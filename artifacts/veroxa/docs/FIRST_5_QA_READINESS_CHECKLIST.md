# First-5 Client Launch QA Checklist

## Public

- [ ] Pricing page only shows Essential, Growth, and Premium as current public plans.
- [ ] Prices are Essential $497/month, Growth $697/month, and Premium $997/month.
- [ ] No old package names appear as active public plans.
- [ ] No false guarantees, viral-growth promises, or exact revenue promises appear.
- [ ] Growth is not labeled “Most Popular.”
- [ ] No copy promises more than max 1 post/day.

## Client Portal

- [ ] Current package is visible.
- [ ] Veroxa responsibilities and restaurant responsibilities are clear.
- [ ] Media dependency is clear and calm.
- [ ] No internal role leakage appears.
- [ ] No demo back links appear on real `/client/*` review routes.
- [ ] No customer-service promise appears.
- [ ] Premium messaging says ad spend is separate.

## Team/Internal Admin

- [ ] First-5-client readiness is visible only as a clearly labeled launch-readiness benchmark.
- [ ] Media risk is visible.
- [ ] Content queue state is visible.
- [ ] Report readiness is visible.
- [ ] Premium assessment candidates are visible.
- [ ] No active Operator/Owner labels appear in active Team/Internal Admin navigation.
- [ ] First-5 benchmark says “Not active client data” and “Used to validate first 5 client scenarios.”
- [ ] `healthy_supply` appears as “Healthy supply” or “Media healthy,” not “Low media risk.”
- [ ] Team/Internal Admin feels like Faraz’s solo founder command center for first 1–10 clients.

## Routes

- [ ] `/demo/client/dashboard` works as the public preview.
- [ ] `/client/dashboard` works as the real client review route.
- [ ] `/team/dashboard` works as the real internal review route.
- [ ] Login destinations are real review routes.
- [ ] No active navigation points to deprecated demo routes.

## Technical

- [ ] `pnpm run typecheck` passes.
- [ ] `pnpm run build` passes.
- [ ] `pnpm --filter @workspace/scripts run check-demo-routes` passes.
- [ ] `pnpm --filter @workspace/scripts run check-pricing-drift` passes.
- [ ] `pnpm --filter @workspace/scripts run check-portal-separation` passes.
- [ ] `pnpm --filter @workspace/scripts run check-business-guardrails` passes.
- [ ] GitHub CI workflow exists.

## Real portal data boundary V2

- [ ] Real `/client/*` routes render the portal shell, not a full-page replacement.
- [ ] Real `/client/*` routes show “Client Portal in review” and “Live account data is being prepared” when live data is unavailable.
- [ ] Real `/client/*` routes do not show demo restaurant names or hardcoded demo client rows as active account data.
- [ ] Real `/team/*` routes render the Team/Internal Admin shell, not a full-page replacement.
- [ ] Real `/team/*` routes do not render Demo Grill House, Demo Taco Bar, Demo Cafe, or Demo Bistro as active clients.
- [ ] First-5 fixtures, when visible to Team/Internal Admin, are labeled launch-readiness benchmark / not active client data.
- [ ] `/demo/client/dashboard` still renders the public sample preview.
- [ ] Guardrails fail if a real client/team route is registered without `RealPortalDataBoundary`.
- [ ] Guardrails fail if `RealPortalDataBoundary` stops rendering children.
