# SaaS APM Platform

A production-ready SaaS Application Performance Monitoring platform built with modern web technologies.

## Features

- **Real-time Event Tracking**: Client-side SDK for capturing user interactions and errors
- **Analytics Dashboard**: Comprehensive metrics, funnels, cohorts, and retention analysis
- **AI-Powered Recommendations**: Automated performance optimization suggestions using OpenAI
- **User Feedback System**: Sentiment analysis and feedback processing
- **Alerting System**: Configurable alerts with acknowledgment workflow
- **Multi-tenant Architecture**: Workspace-based isolation with RBAC
- **Authentication**: Secure user registration and login

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Shadcn UI + Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI integration
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- PostgreSQL (or use Docker)

### Development Setup

1. Clone the repository
2. Copy environment file:
   `ash
   cp .env.production.example .env
   `
3. Update .env with your configuration
4. Start services:
   `ash
   docker-compose up -d postgres
   npm install
   npm run dev
   `
5. Open http://localhost:5000

### Production Deployment

1. Build and start with Docker Compose:
   `ash
   docker-compose up --build
   `

2. Or deploy to cloud platforms:
   - Railway, Render, or Heroku
   - Use the provided Dockerfile

## Environment Variables

See .env.production.example for required environment variables.

## API Documentation

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user
- GET /api/auth/user - Get current user

### Workspaces
- POST /api/workspaces - Create workspace
- GET /api/workspaces - List user's workspaces
- GET /api/workspaces/:slug - Get workspace details

### Events & Analytics
- POST /api/events - Track events
- GET /api/events - Query events
- GET /api/analytics/* - Various analytics endpoints

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Run migrations:

`ash
npm run db:push
`

## Client SDK

Include the APM SDK in your applications:

`javascript
import { APM } from './lib/apm-sdk';

APM.init({
  apiKey: 'your-api-key',
  endpoint: 'https://your-app.com/api'
});

APM.track('page_view', { url: window.location.href });
APM.track('error', { message: error.message });
`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: 
pm test
5. Submit a pull request

## License

MIT License
