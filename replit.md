# SimpleChat

A lightweight WordPress chat widget that lets business owners receive and reply to messages from website visitors directly from their phone.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port from workflow)
- `pnpm --filter @workspace/dashboard run dev` — run the dashboard frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions (conversations, messages, widgets)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/dashboard/src/` — React frontend
- `/api/widget.js` — the embeddable WordPress widget script

## Architecture decisions

- Widget is a self-contained vanilla JS snippet served from `/api/widget.js` — no build step needed for WordPress users
- Widget polls every 4 seconds for new agent replies (simple, no WebSocket dependency)
- API key authentication for the public widget endpoints — each WordPress site gets a unique key
- `lib/api-zod/src/index.ts` only exports from `./generated/api` (not `./generated/types`) to avoid duplicate exports — remember to keep this after codegen reruns

## Product

- **Inbox** — see all conversations from WordPress visitors, unread badge per conversation
- **Conversation view** — full chat thread, agent can reply and toggle open/closed
- **Widgets** — manage WordPress widget configurations, copy embed code snippet
- **Stats** — overview of total/open/closed/unread conversations

## User preferences

- Simple, focused UX — no unnecessary complexity
- Mobile-first (primary use case: reading messages on phone)

## Gotchas

- After running `pnpm --filter @workspace/api-spec run codegen`, the file `lib/api-zod/src/index.ts` gets regenerated with both exports. Manually fix it to only export `./generated/api` to avoid TypeScript duplicate export errors.
- Paths listed in `artifacts/api-server` routes must match the OpenAPI spec exactly.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
