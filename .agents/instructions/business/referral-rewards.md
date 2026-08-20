# Referral Rewards

## Business Logic
Only a newly registered, globally unique email can accept an invitation. User with a hashed random temporary password, referral, credit transaction, and inviter balance update succeed in one transaction. Each accepted referral awards the configured positive integer, default 100. The plaintext temporary password is returned only in the successful registration response and is never persisted or logged.

## Feature Details
### Feature: accept an invitation atomically
### Description: A valid name and new normalized email create all referral records and exactly one reward; any failure rolls all writes back.
### Code:
- `apps/api/src/referrals/`
- `apps/api/src/credits/`

### Unit Test: `apps/api/src/referrals/referrals.service.spec.ts`.

### Feature: show authoritative referral summary
### Description: The inviter dashboard reads persisted balance and up to 100 newest successful referrals from the API.
### Code:
- `apps/api/src/users/`
- `apps/web/src/features/referrals/`

### Unit Test: `apps/web/src/pages/referral-form.test.tsx` and `apps/api/src/referrals/referrals.service.spec.ts`.

## Unknowns
- Existing users cannot be retroactively attached in v1; that behavior is deferred.

## Related Instructions
- Repo code instruction: `.agents/instructions/code.md`
- Unit test instruction: `.agents/instructions/unitTest.md`
- Business map: `.agents/instructions/business-map.md`
