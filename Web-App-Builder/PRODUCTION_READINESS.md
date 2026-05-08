# Quantora Production Readiness

Use this checklist before exposing Quantora to real customers.

## Required

- Deploy behind HTTPS with a real domain.
- Set `NODE_ENV=production`.
- Set a managed `DATABASE_URL` or run the included Postgres service with a strong `POSTGRES_PASSWORD`.
- Set a long random `SESSION_SECRET`.
- Run `npm run verify` before each release.
- Confirm `npm audit --audit-level=high` returns no high-severity vulnerabilities.
- Confirm `/api/health` returns `{"status":"ok","database":"connected"}`.
- Create the first account through `/signup`, then create an API key from Integrations.
- Verify ingestion with `Authorization: Bearer <API_KEY>` or `X-API-Key`.
- Enable automated Postgres backups.

## Operational Notes

- Production sessions use PostgreSQL through `connect-pg-simple`.
- The API applies security headers, JSON body size limits, and route-level rate limits.
- Startup verifies the database connection and applies Drizzle migrations.
- AI recommendations require `OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY`.

## Recommended Before Public Launch

- Add an external log drain and uptime monitor.
- Add password reset and email verification.
- Configure alert delivery channels for email, Slack, or webhooks.
- Add payment/subscription controls if Quantora will be sold as a SaaS.
