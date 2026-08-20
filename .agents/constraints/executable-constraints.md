# Executable Constraints

- `pnpm lint`: TypeScript and React lint rules.
- `pnpm test`: API and web behavior tests.
- `pnpm build`: compilation and production bundle integrity.
- `scripts/Validate-ProjectHarness.ps1`: harness layout and reference integrity.
- `scripts/Verify-Architecture.ps1`: migration mode, transaction boundary, deferred dependencies, and email-log guard.
- CI runs the harness validator; product CI commands are added when the workspace exists.
- `synchronize: false`, migration presence, forbidden middleware, transaction use, and email-log shape are source-checked by `Verify-Architecture.ps1`.
