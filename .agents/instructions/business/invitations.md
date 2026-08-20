# Invitations

## Business Logic
Each authenticated inviter has one reusable 12-character opaque invitation token. It is a random server-side reference to the invitation row and does not encode inviter data. A valid public lookup exposes only the inviter name. The API returns the full environment-derived `/i/{token}` URL.

## Feature Details
### Feature: create or reuse an invitation
### Description: Repeated or concurrent requests for one inviter return the same persisted invitation.
### Code:
- `apps/api/src/invitations/`

### Unit Test: `apps/api/src/invitations/invitations.service.spec.ts`.

### Feature: copy a complete invitation URL
### Description: The UI copies the returned `publicUrl`, reports success or failure, and leaves selectable text on failure.
### Code:
- `apps/web/src/features/invitations/`

### Unit Test: `apps/web/src/pages/invitation-copy.test.tsx`.

## Unknowns
- No open Stage 1 business unknowns; expiration and rotation are explicitly deferred.

## Related Instructions
- Repo code instruction: `.agents/instructions/code.md`
- Unit test instruction: `.agents/instructions/unitTest.md`
- Business map: `.agents/instructions/business-map.md`
