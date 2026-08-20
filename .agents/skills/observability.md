# Repository Observability Guide

- Local app: `docker compose up --build -d`.
- Browser smoke: `npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:3000`, then snapshot and ref-based actions.
- Logs: `docker compose logs api`; runtime logs go to container stdout/stderr.
- Screenshot: Playwright CLI `screenshot`; store artifacts under `output/playwright/`.
- Metrics: out of scope for the Demo.
- Traces: out of scope for the Demo.
- Correlation: every response and structured API log carries the same requestId.
- Privacy: verify that full invitee emails do not occur in API logs.
