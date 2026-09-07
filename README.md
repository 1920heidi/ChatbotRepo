# PSC AI Chatbot

RAG-backed chatbot with document ingestion, a WhatsApp handoff path, and an admin portal for knowledge-base management and conversation logs.

## Architecture

```
                 React                          React
                   |                               |
             Node / Express  (chatbot-backend) <-- admin-portal
              /      |       \
       RAG Service   |      RabbitMQ
        (FastAPI)    |          |
            |         Postgres  Celery Worker
      Vector Search   |        (ingestion-worker) -- Postgres
       (Qdrant)       |             |
            |         |       extract -> chunk -> embed
          Llama       |             |
       (Ollama)       |          Qdrant
```

- **chatbot-frontend** — citizen-facing React chat widget. Calls `chatbot-backend`'s `/api/chat`; no auth, no admin code in this bundle.
- **chatbot-backend** — Express API. Owns chat requests (proxied to `rag-service`, logged to Postgres), the WhatsApp handoff, and all `/api/admin/*` routes (auth, document management, conversation logs). Never talks to the LLM or embedding model directly.
- **rag-service** — FastAPI. Embeds the query, searches Qdrant, reranks candidates, calls the LLM, returns an answer + sources. Also owns deleting a document's vectors from Qdrant (`DELETE /api/documents/{id}`), since it's the only service holding the Qdrant client.
- **ingestion-worker** — Celery worker consuming RabbitMQ ingestion jobs. Extracts text, chunks it, embeds it, upserts into Qdrant, and writes the resulting status (`processing` → `indexed`/`failed`) back to Postgres — it's the only service that knows the true outcome of a job.
- **postgres** — document status/metadata, conversation logs, and admin accounts. Schema in `db/init/001_schema.sql`, applied automatically on first container start.
- **admin-portal** — separate React app (own build, own port) for PSC staff: upload/list/delete/reindex knowledge-base documents, and browse logged conversations. Requires an admin login; kept as a distinct app precisely so none of this ships in the public chat widget's bundle.
- **shared-config/ai-config.yaml** — single source of truth for the embedding model, chunking, retrieval, and LLM settings. Both Python services read it; nothing hardcodes a model name.

## Embedding versioning

`embedding.version` in `shared-config/ai-config.yaml` is baked into the Qdrant collection name (`psc_knowledge_v1`, `psc_knowledge_v2`, ...). Changing the embedding model requires bumping `version` and re-ingesting into the new collection — `rag-service` refuses to start against a collection that doesn't exist for the configured version, so old and new embeddings never mix silently.

Re-uploading or reindexing the same document deletes its previous Qdrant vectors before writing the new ones, so it never accumulates duplicates.

## Running locally

```bash
docker compose up --build
```

This starts Qdrant, RabbitMQ, Postgres, Ollama (`llm-server`), `rag-service`, `ingestion-worker`, `chatbot-backend`, and `admin-portal`.

Pull the LLM once the `llm-server` container is up:

```bash
docker compose exec llm-server ollama pull llama3.1:8b
```

Run the citizen widget separately (not containerized, for fast dev iteration):

```bash
cd chatbot-frontend && npm run dev
```

### First-time setup: seed an admin account

There's no self-signup. Create the first admin explicitly:

```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD=change-me-now \
  docker compose exec -e SEED_ADMIN_EMAIL -e SEED_ADMIN_PASSWORD chatbot-backend node scripts/seedAdmin.js
```

(Or set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `chatbot-backend/.env` before running.) The script is idempotent — safe to re-run. Once logged into the admin portal (`http://localhost:5175`), that account can create further admins via the API.

## API

- `POST /api/chat` `{ message, sessionId }` -> `{ reply, sources }` — `sessionId` is a client-generated UUID (see below); the turn is logged to Postgres if present.
- `POST /api/admin/auth/login` `{ email, password }` -> `{ token, admin }`
- `POST /api/admin/auth/admins` (authenticated) `{ email, password }` -> creates another admin account
- `GET /api/admin/documents`, `POST /api/admin/documents` (multipart, field `file`, optional `source`/`approved`), `DELETE /api/admin/documents/:id`, `POST /api/admin/documents/:id/reindex` — all require `Authorization: Bearer <token>`
- `GET /api/admin/conversations`, `GET /api/admin/conversations/:sessionId` — all require `Authorization: Bearer <token>`

The old unauthenticated `POST /api/documents` route has been removed — uploads now go through the authenticated admin route only.

## Conversation logging

The citizen widget generates a session ID (`crypto.randomUUID()`, persisted in `localStorage`) once per browser and sends it with every `/api/chat` call. `chatbot-backend` logs each turn (user message + bot reply + sources) to Postgres, fire-and-forget — a logging failure never blocks or delays the citizen-facing reply.

**Scope boundary:** this only covers the in-widget "Conversation" tab. The WhatsApp handoff (below) is a client-side `wa.me` link — PSC's backend never sees those messages and they can't be logged.

## WhatsApp handoff

The chat widget has a "Chat with us" option that opens a `wa.me` click-to-chat link — no backend involved, works as soon as a number is set. Configure `VITE_WHATSAPP_NUMBER` in `chatbot-frontend/.env` (digits only, country code first, e.g. `254712345678`); it's currently unset as a placeholder.

This covers the citizen-initiated handoff only. A full WhatsApp Business API integration (for agents replying from a shared inbox, automated routing, or message history continuity) still needs a provider decision (Meta Cloud API vs Twilio) before it can be built.

## Accepted debt (v1)

- No rate-limiting on `/api/admin/auth/login` — acceptable for a small internal admin team, not exposed as a public signup surface.
- Schema changes are a manual runbook (add a numbered `db/init/002_*.sql`, no migration framework) — fine at this table count and team size.
- No real-time updates in admin-portal — a manual refresh plus a ~3s poll while any document is `queued`/`processing` is enough for a low-volume internal tool.
- `JWT_SECRET` in `docker-compose.yml` is a dev-only placeholder — **must** be replaced with a real secret before any non-local deployment.

## Not yet wired

- Conversation history / multi-turn context in `rag-service` — currently single-turn per query. Logging conversations (above) is a Node-side concern only and doesn't change what's sent to `rag-service`.
