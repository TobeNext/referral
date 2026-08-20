# Repo Code Instruction

## Purpose
This file records coding knowledge for this repo.

## Language And Framework
- Language: TypeScript.
- Frontend: React 19 with Vite.
- Backend: NestJS with TypeORM and better-sqlite3.
- Package manager: pnpm workspace.
- Test runner: Vitest for web; Jest for API.

## Coding Standards
- Keep controllers limited to HTTP concerns and explicit response DTOs.
- Put atomic referral behavior in `ReferralService.acceptInvitation()`.
- Use only a transaction-scoped `EntityManager` inside the acceptance transaction.
- Keep API JSON in camelCase and timestamps as UTC ISO 8601 strings.

## Naming Standards
- Nest modules, controllers, and services use conventional `*.module.ts`, `*.controller.ts`, and `*.service.ts` names.
- React components use PascalCase; hooks and functions use camelCase.

## Repo-Specific Rules
- TypeORM must use `synchronize: false`; schema changes require migrations.
- The web app never reads SQLite or computes authoritative credits.
- Do not add authentication, Redis, queues, or production infrastructure in this Demo.
- Never log complete invitee emails.

## Known Architecture
- Web entry: `apps/web/src/main.tsx`.
- API entry: `apps/api/src/main.ts`.
- Runtime: Nginx web container proxies `/api` to the API container.
- Contract: `contracts/openapi.yaml`.
