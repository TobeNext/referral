# Verification Harness

## Stage 1
- Contract search: `rg -n "A-001|C-001|EMAIL_ALREADY_REGISTERED|REFERRAL_REWARD_CREDITS" .agents/plans/2026-08-20-implementation-blueprint.md`
- OpenAPI parse: performed by the project verification command once dependencies exist.

## Local checks
- Install: `pnpm install --frozen-lockfile` after the lockfile exists.
- Lint: `pnpm lint`.
- Tests: `pnpm test`.
- Build: `pnpm build`.

## Runtime checks
- Start: `docker compose up --build -d`.
- Health: `GET http://localhost:3000/api/health`.
- Status: `docker compose ps`.
- Logs: `docker compose logs api`.
- UI smoke: `npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:3000`, followed by `snapshot` and ref-based actions.
- Running contract check: `pwsh -File scripts/Verify-RunningDemo.ps1`.

## Intentionally absent
- Metrics and traces are out of scope.
- Screenshots are written by Playwright CLI to `output/playwright/`.
