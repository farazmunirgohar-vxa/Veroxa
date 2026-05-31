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

- [ ] First-5-client readiness is visible.
- [ ] Media risk is visible.
- [ ] Content queue state is visible.
- [ ] Report readiness is visible.
- [ ] Premium assessment candidates are visible.
- [ ] No active Operator/Owner labels appear in active Team/Internal Admin navigation.

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

## Real portal data boundary

- [ ] Real `/client/*` routes show in-review/still-building language when live client data is unavailable.
- [ ] Real `/team/*` routes do not render demo restaurant names as active clients.
- [ ] `/demo/client/dashboard` still renders the public sample preview.
- [ ] Guardrails fail if a real client/team route is registered without `RealPortalDataBoundary`.
