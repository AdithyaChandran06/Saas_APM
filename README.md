# Quantora - AI-Powered Product Intelligence Platform

> A complete SaaS APM (Application Performance Monitoring) solution with real-time analytics, customer feedback aggregation, and AI-powered recommendations for product teams.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

## 🎯 Overview

Quantora is an enterprise-ready SaaS platform that helps product teams make data-driven decisions by combining:

- **Real-time Analytics** - Track user interactions, retention, and conversion funnels
- **Customer Feedback** - Aggregate feedback from multiple channels with sentiment analysis
- **AI Reasoning** - OpenAI-powered recommendations that reason about business impact
- **Performance Monitoring** - Error tracking, latency analysis, and performance metrics
- **Alert Management** - Proactive alerts for anomalies and critical metrics
- **Multi-tenant Architecture** - Secure workspace management for team collaboration

## 📋 Features

### Core Platform
- ✅ **Authentication** - Session-based auth with secure HTTP-only cookies
- ✅ **Multi-tenant Workspaces** - Workspace isolation with member management
- ✅ **Real-time Dashboard** - Live metrics for product health and user behavior
- ✅ **Analytics Suite** - Retention curves, conversion funnels, cohort analysis, segmentation
- ✅ **Event Tracking** - High-volume event ingestion with real-time processing
- ✅ **Feedback Management** - Customer feedback collection and sentiment analysis
- ✅ **AI Insights** - Daily recommendation generation with quota management
- ✅ **Alert System** - Configurable alerts with multiple notification channels
- ✅ **Error Tracking** - Comprehensive error analytics and trend analysis
- ✅ **Settings** - Workspace configuration, data retention, privacy controls
- ✅ **API Keys** - API key generation for SDK integration

### Advanced Features
- 🤖 **AI-Powered Recommendations** - OpenAI integration for actionable insights
- 📊 **Performance Analytics** - Request latency, error rates, route-level stats
- 🔄 **Data Persistence** - PostgreSQL with Drizzle ORM + migrations
- 📱 **Responsive UI** - Mobile-friendly design with Tailwind CSS
- 🔐 **Enterprise Security** - HTTPS, CORS, CSP, XSS protection
- 📡 **WebSocket Ready** - Architecture supports real-time updates

### Graceful Degradation
- ✅ Works **without PostgreSQL** - Falls back to in-memory storage
- ✅ Works **without OpenAI** - Recommendations disabled gracefully
- ✅ Development-friendly - No required external services

## 🏗️ Project Structure

```
Saas_APM/
├── Web-App-Builder/              # Main application
│   ├── client/                   # React frontend
│   │   ├── src/
│   │   │   ├── components/       # UI components (layout, brand, ui)
│   │   │   ├── pages/            # Page components (Dashboard, Analytics, etc.)
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   └── lib/              # Utilities and SDK
│   │   └── index.html
│   ├── server/                   # Express backend
│   │   ├── routes.ts             # Main API routes
│   │   ├── auth.ts               # Authentication routes
│   │   ├── db.ts                 # Database setup & connection
│   │   ├── telemetry.ts          # Request tracking & analytics
│   │   ├── services/             # Business logic
│   │   │   ├── ai-recommendations.ts
│   │   │   ├── alert-evaluator.ts
│   │   │   ├── correlation.ts
│   │   │   ├── scoring.ts
│   │   │   └── sentiment-analysis.ts
│   │   └── replit_integrations/  # Replit-specific features
│   ├── migrations/               # Drizzle DB migrations
│   ├── packages/apm-sdk/         # NPM-published SDK
│   ├── shared/                   # Shared types & schemas
│   │   ├── schema.ts             # Core schema
│   │   ├── schema-extended.ts    # Extended schema (workspaces, etc.)
│   │   └── models/               # Data models
│   └── scripts/                  # Build and utility scripts
├── render.yaml                   # Render.com deployment config
├── docker-compose.yml            # Local development setup
└── README.md                      # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **PostgreSQL** 13+ (optional - app works without it)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/quantora.git
   cd quantora/Web-App-Builder
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5000
   ```

### Docker Development (with PostgreSQL)

```bash
# Start PostgreSQL and run migrations
docker-compose up -d

# Run dev server in another terminal
npm run dev
```

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Build & Production
npm run build            # Build for production
npm start                # Start production server
npm run check            # TypeScript type checking
npm run verify           # Full verification (check + build + sdk)

# Database
npm run db:push          # Push schema to database

# SDK
npm run sdk:build        # Build the NPM SDK
npm run sdk:publish      # Publish SDK to npm

# Testing
npm run test             # Run tests and verification
```

## 🔧 Configuration

### Environment Variables

Required variables (see `.env.example`):

```env
# Server
PORT=5000
NODE_ENV=development

# Database (optional - app works without)
DATABASE_URL=postgresql://user:pass@localhost:5432/quantora

# Authentication
REPL_ID=your-replit-id  # Optional for Replit deployment

# AI Features (optional)
OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Session
SESSION_SECRET=your-secret-key

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5000
```

### Database Setup

1. **Create database**
   ```bash
   createdb quantora
   ```

2. **Run migrations**
   ```bash
   npm run db:push
   ```

3. **Seed demo data (optional)**
   ```bash
   npm run seed
   ```

## 🏃 API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Dashboard & Stats
- `GET /api/stats` - Overall dashboard stats
- `GET /api/performance` - Performance metrics by route

### Analytics
- `GET /api/analytics/retention` - Retention curve data
- `GET /api/analytics/growth` - Growth metrics
- `GET /api/analytics/funnels` - Conversion funnel stages
- `GET /api/analytics/cohorts` - Cohort analysis
- `GET /api/analytics/segments` - User segments

### Events & Feedback
- `GET /api/events` - List events
- `POST /api/events` - Ingest event
- `GET /api/feedback` - List feedback
- `POST /api/feedback` - Submit feedback

### Alerts
- `GET /api/alerts` - List alerts
- `POST /api/alerts` - Create alert
- `PUT /api/alerts/:id` - Update alert
- `DELETE /api/alerts/:id` - Delete alert

### AI Insights
- `GET /api/recommendations` - List recommendations
- `POST /api/recommendations/generate` - Generate new recommendations

### Settings
- `GET /api/settings` - Get workspace settings
- `PUT /api/settings` - Update settings
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### API Keys
- `GET /api/api-keys` - List API keys
- `POST /api/api-keys` - Generate key

## 🗄️ Database Schema

### Core Tables

**users** - User accounts
- id, email, password, firstName, lastName, profileImageUrl

**workspaces** - Team workspaces
- id, name, ownerId, createdAt

**workspace_members** - Workspace membership
- id, userId, workspaceId, role

**events** - User interaction events
- id, userId, workspaceId, eventName, eventData, timestamp

**feedback** - Customer feedback
- id, userId, workspaceId, text, rating, sentiment

**error_events** - Error tracking
- id, errorName, errorMessage, stackTrace, userAgent

**performance_metrics** - Performance data
- id, routePath, duration, statusCode, timestamp

**alerts** - Alert configurations
- id, name, condition, threshold, channels

**recommendations** - AI recommendations
- id, title, description, score, impact, workspaceId

**api_keys** - API authentication
- id, key, name, workspaceId, createdAt

See `server/shared/schema.ts` and `server/shared/schema-extended.ts` for full schema details.

## 🧪 Testing

```bash
# Run type checking
npm run check

# Build SDK
npm run sdk:build

# Full verification
npm run verify
```

## 📱 Frontend Technologies

- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Query** - Data fetching & caching
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## 🔌 Backend Technologies

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Type-safe database access
- **PostgreSQL** - Primary database
- **OpenAI API** - AI recommendations
- **bcrypt** - Password hashing
- **express-session** - Session management

## 🔐 Security

- ✅ HTTPS ready (production deployment)
- ✅ CORS protection
- ✅ CSRF tokens on forms
- ✅ XSS protection via React
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ Password hashing (bcrypt)
- ✅ HTTP-only session cookies
- ✅ Rate limiting on sensitive endpoints
- ✅ Workspace isolation & member validation

## 📈 Performance

- **Real-time Analytics** - Sub-second event processing
- **Efficient Caching** - React Query with smart invalidation
- **Database Optimization** - Indexes on frequently queried columns
- **Graceful Degradation** - In-memory fallback when DB unavailable

## 🚢 Deployment

### Render.com (Recommended)

The project includes `render.yaml` for deployment on Render:

```bash
# Push to GitHub and connect to Render
# Render will auto-deploy on push
```

### Docker

```bash
# Build image
docker build -t quantora .

# Run container
docker run -p 5000:5000 \
  -e DATABASE_URL=postgresql://... \
  -e OPENAI_API_KEY=sk-... \
  quantora
```

### Vercel (Frontend Only)

Frontend can be deployed to Vercel separately if needed.

## 📊 Monitoring & Debugging

### Available Dashboards

1. **Dashboard** (`/`) - Real-time stats and recommendations
2. **Analytics** (`/analytics`) - Retention, growth, funnels, cohorts
3. **Events** (`/events`) - Event stream browser
4. **Feedback** (`/feedback`) - Feedback review
5. **Alerts** (`/alerts`) - Alert management
6. **Errors** (`/errors`) - Error tracking dashboard
7. **Settings** (`/settings`) - Configuration
8. **Performance** (via API) - Route-level metrics

### Logs

- Development: Console output
- Production: Check application logs in deployment platform

## 🐛 Troubleshooting

### Database Connection Failed
- PostgreSQL not running? Start with `docker-compose up -d`
- App continues to work in-memory mode

### API Not Responding
- Check server logs: `npm run dev`
- Verify `.env.local` configuration
- Check CORS settings for frontend domain

### AI Recommendations Not Working
- Set `OPENAI_API_KEY` in `.env.local`
- Check OpenAI account has credits

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run verify` to check
5. Submit a pull request

## 📞 Support

For issues and questions:

- 📖 Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
- 🏗️ See [ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)
- 📋 Review [COMPLETE_SYSTEM_GUIDE.md](./COMPLETE_SYSTEM_GUIDE.md)

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by OpenAI for AI insights
- Styled with Tailwind CSS
- Data management with Drizzle ORM

---

**Made with ❤️ for product teams that care about data.**
