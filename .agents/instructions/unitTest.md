# Unit Test Instruction

## Purpose
This file records unit-test knowledge for this repo.

## Test Locations
- API unit/integration tests: colocated `apps/api/src/**/*.spec.ts` and `apps/api/test/`.
- Web tests: colocated `apps/web/src/**/*.test.tsx`.

## Naming
- Test files use `.spec.ts` for API and `.test.tsx` for web.
- Test names state observable behavior and precondition.

## Fixture Conventions
- API database tests use a dedicated temporary SQLite database.
- Business fixtures use Alice as inviter and unique Bob/Charlie emails per test.
- Authentication fixtures use Alice for a normal account and Bob for a `mustResetPassword=true` account; never place real secrets in fixtures.

## Mock Conventions
- Jest mocks API failure seams; Vitest mocks browser APIs such as Clipboard.
- Do not mock TypeORM for transaction/integrity behavior; use SQLite integration tests.

## Coverage Knowledge
- Coverage tools: Jest/V8 and Vitest/V8.
- Threshold: no numeric threshold is frozen; all stage acceptance paths require focused tests.

## Existing Helpers
- API SQLite integration setup is established in `invitations.service.spec.ts` and `referrals.service.spec.ts`.
- Web QueryClient/render setup is established in `invitation-copy.test.tsx` and `referral-form.test.tsx`.
- Auth service coverage is in `auth.service.spec.ts`; frontend login/reset coverage is in `auth-flow.test.tsx`.
