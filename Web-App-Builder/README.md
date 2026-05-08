# Quantora

Quantora is a production-oriented product intelligence platform for SaaS teams. It collects product events, errors, performance signals, and qualitative feedback, then turns that data into dashboards, alerts, and AI-ranked product recommendations.

## Core Capabilities

- Event, error, feedback, and performance ingestion
- Workspace-scoped analytics and API keys
- Product health dashboards, cohorts, funnels, retention, and alerts
- AI recommendations with scoring, supporting evidence, and audit logging
- PostgreSQL persistence with Drizzle migrations
- React dashboard, Express API, Docker deployment, and a publishable SDK

## Local Development

Start Postgres:

```bash
docker run --name apm-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=apm_ai -p 5432:5432 -d postgres:16
```

Start Quantora:

```bash
npm install
DATABASE_URL=postgresql://postgres:password@localhost:5432/apm_ai SESSION_SECRET=local-dev-secret npm run dev
```

Open http://localhost:5000 and create an account from the sign-up page.

## Production

Create a real environment file from `.env.example`, then run:

```bash
docker compose up --build
```

Required production variables:

- `DATABASE_URL`
- `SESSION_SECRET`
- `POSTGRES_PASSWORD` when using the included Compose file
- `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY` if AI recommendations are enabled

## Verification

```bash
npm run verify
```

This runs TypeScript checks, builds the SDK, and builds the production app.

See `PRODUCTION_READINESS.md` for the deployment checklist.

## API Key Ingestion

Use either `X-API-Key` or a Bearer token:

```bash
curl -X POST https://your-domain.com/api/events/batch \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"events":[{"type":"page_view","url":"https://example.com"}]}'
```

## SDK

```bash
npm install @quantora/sdk
```

```ts
import { createAPMClient } from "@quantora/sdk";

const quantora = createAPMClient({
  apiKey: "YOUR_API_KEY",
  endpoint: "https://your-domain.com",
});

quantora.trackEvent("feature_used", { feature: "export" });
```
