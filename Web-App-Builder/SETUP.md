# PM-AI Setup

## 1) Configure environment

1. Copy `.env.example` to `.env`.
2. Fill required values:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `OPENAI_API_KEY` (or `AI_INTEGRATIONS_OPENAI_API_KEY`)

## 2) Install and provision

```bash
npm install
npm run db:push
```

## 3) Start app

```bash
npm run dev
```

Open `http://localhost:5000`.
