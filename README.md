# DocuMind – Multi-Document Intelligence Workbench

Full-stack banking-domain document intelligence app: upload multiple synthetic documents (PDF, CSV, TXT), provide an analysis prompt, and receive structured insights with **document provenance**. Extracted facts are stored separately from Mock AI interpretations (conflicts, matches, missing information).

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Lucide, React Router |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via Prisma (relational) |
| Parsing | `pdf-parse`, `csv-parse`, UTF-8 text |
| AI | Free **deterministic Mock AI** (no paid API keys) |
| Validation | Zod + multer file filters |
| Tests | Vitest + Supertest |

## Architecture

```
client (Vite React)  --REST/JSON-->  server (Express)
                                      ├── multer secure uploads (UUID filenames)
                                      ├── parsers (pdf / csv / txt)
                                      ├── fact extractor (typed fields + snippets)
                                      ├── Mock AI analysis engine
                                      └── Prisma → SQLite
```

**Pipeline (document boundaries preserved):**
1. Upload → validate type/size → store under `server/uploads/` with UUID name + checksum provenance  
2. Parse each file independently → `extractedText`  
3. Extract typed facts (`name`, `address`, `revenue`, `date`, `registration_number`) with source snippets  
4. Analysis runs on per-document facts (never a single merged blob)  
5. Findings reference `sourceDocumentIds` / `sourceDocumentNames`; facts remain a separate provenance layer  

## Monorepo layout

```
├── client/                 # React dashboard
├── server/                 # Express API + Prisma
│   ├── prisma/schema.prisma
│   ├── .env.example
│   └── src/
├── samples/                # Synthetic ACME banking documents (no real customer data)
├── .env.example
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Configure environment

```bash
cp server/.env.example server/.env
```

`server/.env` contains only local non-secret defaults (SQLite path, port, CORS origin). **Do not commit `.env` or any API keys.** This project does not require paid LLM credentials.

### Install & database

```bash
npm install
npm run db:generate
npm run db:push
```

### Run

```bash
# Terminal 1 – API
npm run dev:server

# Terminal 2 – UI
npm run dev:client
```

- UI: http://localhost:5173 (or the port Vite prints)
- API: http://localhost:3001 (`GET /api/health`)

When the API is up, the header shows **Live API**. If it is down, the client falls back to demo data.

### Sample documents

Use files in `samples/` (synthetic ACME Corporation data only):

- `acme_corp_registration.pdf` / `.txt`
- `acme_kyc_notes.pdf` / `.txt`
- `acme_financials_fy2024.csv`

These intentionally disagree on address/revenue so cross-document conflicts are demonstrable.

### Tests

```bash
npm test
# or
npm run test -w server
```

### Build

```bash
npm run build:client
npm run build:server
```

## Completed functionality

- Multi-document drag-and-drop upload (PDF, CSV, TXT)
- File validation (extension/MIME, empty file, 10 MB limit) with clear errors
- Content extraction + typed fact extraction with snippets
- User-defined analysis prompts
- Individual and cross-document analysis modes
- Conflict / match / missing-info / insight findings with source documents
- Facts table (extracted) separate from findings (interpretations)
- Copy results to clipboard
- Dashboard stats + analysis history
- Secure upload storage (UUID names, whitelist, size limits)
- REST API + Prisma relational schema

## Assumptions

- Assessment scope uses a **Mock AI** (deterministic heuristics), not a paid LLM
- SQLite is sufficient for local/demo; Postgres would be used in production
- OCR for scanned image-only PDFs is out of scope; text PDFs are supported via `pdf-parse`
- Single-user local demo (no auth)

## Known limitations

- Mock AI pattern coverage is rule-based; unusual phrasings may be missed
- No OCR for image-only scans
- No authentication / multi-tenancy
- Client demo fallback still exists if the API is offline
- Large PDFs are truncated in UI preview (full text stored server-side)

## Security considerations

- `.env` / secrets are gitignored; only `.env.example` is committed
- Uploads restricted to PDF/CSV/TXT with size limits; stored outside the repo with UUID names
- Checksums recorded in `DocumentProvenance`
- Zod validates analysis payloads
- CORS limited to local Vite origins
- No real customer/PII samples; synthetic ACME data only
- **Never commit** API keys, production DB URLs with passwords, or uploaded customer files

## How this would be productionised

- Swap SQLite for managed PostgreSQL; run Prisma migrations in CI
- Object storage (S3) for uploads + virus scanning
- AuthN/AuthZ (SSO), tenant isolation, audit logs
- Optional real LLM behind a provider adapter (keep fact extraction separate from LLM interpretation)
- Queue workers for heavy parsing; rate limits and max page counts
- Observability (OpenTelemetry), backups, encryption at rest
- Remove client mock fallback or gate it behind `import.meta.env.DEV`

## Database schema

See [`server/prisma/schema.prisma`](server/prisma/schema.prisma):

- `Document`, `DocumentProvenance`, `ExtractedFact`
- `Analysis`, `AnalysisDocument`, `AnalysisFinding`

Apply with `npm run db:push` (or `npm run db:migrate -w server` for migration files).

## AI development tools disclosure

- **Cursor** (Composer agent) was used to accelerate scaffolding, UI, API wiring, and tests.
- **Personal / deliberate decisions:** monorepo layout; Stripe/Linear-inspired fintech UI; Prisma + SQLite; separating `ExtractedFact` from `AnalysisFinding`; deterministic Mock AI instead of paid APIs; UUID upload storage; Zod validation; Vitest/Supertest coverage of conflict detection and upload rejection.

## Deploy free on Render (frontend + backend together)

Recommended: **one free Web Service** that serves the API and the built React app from the same origin (`/api` + static UI). No paid LLM keys required.

### Steps

1. Push this repo to GitHub (do **not** commit `server/.env`, `*.db`, or `uploads/`).
2. Sign up at [https://render.com](https://render.com) with GitHub.
3. **New → Blueprint** → select this repo → apply [`render.yaml`](render.yaml)  
   **or** **New → Web Service** → connect the repo and set:
   - **Runtime:** Node
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
   - **Plan:** Free
4. Environment variables (Blueprint sets these — **do not** add `NODE_ENV=production` in the Render dashboard; it skips `devDependencies` and breaks the Vite/TypeScript build):
   - `DATABASE_URL=file:./prod.db`
   - `UPLOAD_DIR=uploads`
   - `MAX_FILE_SIZE_BYTES=10485760`
5. Build command must be: `npm install --include=dev && npm run build`
6. Deploy. Open `https://<your-service>.onrender.com` — UI and API are on the same URL.
7. Confirm `https://<your-service>.onrender.com/api/health` returns `{"status":"ok",...}`.

If the build fails with `Could not find a declaration file for module 'react'`, remove `NODE_ENV` from Render **Environment** and clear the build cache, then redeploy.

### Notes / limitations on free Render

- Free instances **spin down** after idle time; first request can take ~30–60s.
- Free disk is **ephemeral** — SQLite DB and uploads reset when the instance is recycled. Fine for a demo; use managed Postgres + object storage for real production.
- Same-origin deploy means the browser uses relative `/api` (no `VITE_API_URL` needed).
- If you split into Static Site + API later, set `CLIENT_ORIGIN` to the static URL and build the client with `VITE_API_URL=https://your-api.onrender.com`.

### Local production check

```bash
npm run build
npm start
# open http://localhost:3001
```

## License

Private – technical assessment project.
