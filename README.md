# DocuMind – Multi-Document Intelligence Workbench

Premium multi-document analysis platform for banking-domain document intelligence. Upload PDF, CSV, and TXT files, run individual or cross-document analysis, detect conflicts and missing information, and review structured results with source provenance.

## Tech stack

- **Client:** React, TypeScript, Vite, Tailwind CSS, Lucide icons
- **Server:** Node.js, Express, TypeScript, Prisma, SQLite
- **Analysis:** Free deterministic Mock AI provider (no paid API keys)
- **Tests:** Vitest + Supertest

## Monorepo layout

```
├── client/          # React dashboard (Vite)
├── server/          # Express API + Prisma (Phase 2+)
├── samples/         # Synthetic banking documents (later)
├── package.json     # npm workspaces root
└── README.md
```

## Prerequisites

- Node.js 18+
- npm 9+

> **Windows note:** The root `package.json` overrides Rollup to `@rollup/wasm-node` so Vite builds work when Application Control blocks native `.node` binaries.

## Setup

```bash
npm install
```

## Development

```bash
# Terminal 1 – API (Express + Prisma + SQLite)
npm run db:generate
npm run db:push
npm run dev:server

# Terminal 2 – frontend
npm run dev:client
```

- Client: http://localhost:5173
- API: http://localhost:3001 (`GET /api/health`)

Sample banking files for upload testing are in `samples/`.

When the API is running, the dashboard badge shows **Live API**. If the API is down, the client falls back to demo data.

## Build

```bash
npm run build:client
```

## Design

Fintech dashboard inspired by Stripe and Linear: navy (`#0A2540`), indigo (`#635BFF`), white, and light grey (`#F6F9FC`).

## License

Private – technical assessment project.
