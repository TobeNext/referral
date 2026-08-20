# Authentication

## Business Logic

Accounts use normalized email and bcrypt-hashed passwords. Login returns a short-lived JWT. Newly invited users receive a random temporary password once and have `mustResetPassword=true`; their restricted JWT may only access current-user identity and password reset until reset succeeds. Reset increments `authVersion`, invalidating earlier tokens.

## Security Boundary

- Unknown email and wrong password both return `INVALID_CREDENTIALS`.
- Protected resources derive identity from the verified JWT `sub` and compare `authVersion` plus reset state with the database.
- Passwords, hashes, full JWTs, and full invitee emails never enter logs.
- Refresh tokens, recovery, roles, rate limiting, and external IdPs are deferred.

## Code And Tests

- Code: `apps/api/src/auth/`, `apps/web/src/auth/`, `apps/web/src/pages/LoginPage.tsx`, `apps/web/src/pages/ResetPasswordPage.tsx`.
- Tests: `apps/api/src/auth/auth.service.spec.ts`, `apps/web/src/pages/auth-flow.test.tsx`.

## Related Instructions

- Repo code instruction: `.agents/instructions/code.md`
- Unit test instruction: `.agents/instructions/unitTest.md`
- Business map: `.agents/instructions/business-map.md`
