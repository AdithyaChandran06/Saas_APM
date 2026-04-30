# PM-AI SaaS APM Platform - Launch Checklist

**Last Updated:** April 30, 2026  
**Status:** ✅ LAUNCH-READY (MVP v1.0)

---

## Pre-Launch Verification (Verify These Before Going Live)

### ✅ Code & Compilation
- [ ] Run `npm run check` - All TypeScript checks pass
- [ ] Run `npm run build` - Production build completes without errors
- [ ] Review git diff for any uncommitted changes
- [ ] All imports resolve correctly (no dangling refs)
- [ ] No console.error or console.warn in critical paths

### ✅ Database & Migrations
- [ ] Postgres database is provisioned and accessible
- [ ] Run migrations: `npm run db:push`
- [ ] Verify migrations created all tables:
  - workspaces
  - workspace_members
  - workspace_settings
  - alerts
  - api_keys
  - audit_log
  - error_events
  - performance_metrics
  - (base tables: events, feedback, recommendations)
- [ ] Create initial admin workspace and user
- [ ] Test database connection fallback works (without DATABASE_URL)

### ✅ Environment & Secrets
- [ ] Set `OPENAI_API_KEY` for AI recommendations
- [ ] Set `DATABASE_URL` for production database
- [ ] Set `PORT` to production port (usually 5000)
- [ ] Set `NODE_ENV=production`
- [ ] All `.env` variables are documented in `.env.example`
- [ ] No hardcoded API keys or secrets in code

### ✅ Core Features (Tested End-to-End)
- [ ] **Event Ingestion**
  - [ ] SDK generates and sends events
  - [ ] Events appear in `/events` page within 5 seconds
  - [ ] Batch ingestion endpoint works (/api/events/batch)
  - [ ] Filtering works (search, type filters)
  - [ ] Pagination works for large event sets

- [ ] **Feedback Management**
  - [ ] User can submit feedback via form
  - [ ] Sentiment is auto-detected and accurate
  - [ ] Feedback appears in `/feedback` page
  - [ ] Can filter by sentiment and search
  - [ ] Source tracking works (web, in_app, etc.)

- [ ] **AI Recommendations**
  - [ ] "Generate Insights" button triggers analysis
  - [ ] Recommendations appear with scores
  - [ ] Can update recommendation status (new → reviewed → implemented → dismissed)
  - [ ] Daily quota limit (10/day) is enforced
  - [ ] Fallback recommendations appear if API is down
  - [ ] Audit log records all actions

- [ ] **Analytics Dashboard**
  - [ ] Retention curve displays correctly
  - [ ] Growth metrics calculate and display
  - [ ] Conversion funnels show data
  - [ ] Cohort analysis renders
  - [ ] User segments populate
  - [ ] All charts are responsive and interactive

- [ ] **Alerts & Monitoring**
  - [ ] Can create alerts with conditions
  - [ ] Alerts evaluate on a 1-minute schedule
  - [ ] Alert status updates show triggered/acknowledged state
  - [ ] Can delete and update alerts
  - [ ] Top 5 error paths display in error tracking page

- [ ] **Error Tracking**
  - [ ] Error metrics calculate correctly
  - [ ] Error trend chart shows hourly data
  - [ ] Recent errors list updates in real-time
  - [ ] Top error paths sorted by frequency
  - [ ] Status codes and durations display

- [ ] **Settings & Configuration**
  - [ ] Can save profile information
  - [ ] Data collection settings persist
  - [ ] Sample rate setting affects event ingestion
  - [ ] Retention days setting is respected
  - [ ] Privacy mode toggle works

- [ ] **API Key Management**
  - [ ] Can generate new API keys
  - [ ] Generated keys have pk_ and sk_ prefixes
  - [ ] Can delete keys (soft delete)
  - [ ] Keys persist across server restarts
  - [ ] Key display shows masked secret

- [ ] **Multi-Tenancy & RBAC**
  - [ ] Default workspace auto-created on first login
  - [ ] Users can view only their workspace data
  - [ ] Workspace context enforced on all queries
  - [ ] Member role defaults to "member"
  - [ ] Owner role has full permissions
  - [ ] Audit logs track all permission-gated actions

### ✅ Performance & Optimization
- [ ] Page load time < 2 seconds (first paint)
- [ ] API response time < 500ms (p95)
- [ ] Dashboard queries complete in < 1 second
- [ ] Events endpoint handles 100+ events/second
- [ ] Memory usage stable over 1 hour (no leaks)
- [ ] Bundle size < 200KB gzipped (client)
- [ ] Recommend caching headers set (static assets)

### ✅ Security Baseline
- [ ] API endpoints validate workspace membership
- [ ] No sensitive data in API responses (secrets masked)
- [ ] Error messages don't leak system info
- [ ] CORS headers configured correctly
- [ ] Rate limiting on /api/recommendations/generate
- [ ] No SQL injection vulnerabilities (using Drizzle ORM)
- [ ] HTTPS enforced in production (via reverse proxy)
- [ ] Session cookies have HttpOnly and Secure flags

### ✅ Observability & Logging
- [ ] API requests logged with method, path, status, duration
- [ ] Error events persisted to database
- [ ] Performance metrics recorded
- [ ] Audit logs created for all state changes
- [ ] Telemetry visible in `/errors` page
- [ ] Can query recent errors and performance data

### ✅ Documentation & Runbooks
- [ ] README.md updated with launch info
- [ ] IMPLEMENTATION_GUIDE.md covers all features
- [ ] QUICKSTART.md has clear getting-started steps
- [ ] API endpoints documented with examples
- [ ] Troubleshooting guide includes common issues
- [ ] Deployment instructions provided
- [ ] Environment variables documented

### ✅ Browser & Client Compatibility
- [ ] Tested on Chrome 90+
- [ ] Tested on Firefox 88+
- [ ] Tested on Safari 14+
- [ ] Responsive on mobile (375px width)
- [ ] Responsive on tablet (768px width)
- [ ] Responsive on desktop (1920px width)
- [ ] Dark mode works correctly
- [ ] All interactive elements accessible via keyboard

---

## Launch Day Workflow

### Pre-Launch (2 hours before)
1. [ ] Final backup of production database
2. [ ] Run full test suite: `npm run check`
3. [ ] Build production bundle: `npm run build`
4. [ ] Verify all environment variables set correctly
5. [ ] Test seed-demo-data: `npm run seed` (on staging)
6. [ ] Verify error tracking page shows sample errors
7. [ ] Create launch announcement message

### Launch (Go Live)
1. [ ] Deploy to production
   ```bash
   npm run build
   npm start  # NODE_ENV=production
   ```
2. [ ] Verify server is listening on correct port
3. [ ] Test landing page loads
4. [ ] Test login flow
5. [ ] Verify database connectivity
6. [ ] Run sample event ingestion test
7. [ ] Check `/api/stats` returns expected data

### Post-Launch (First Hour)
1. [ ] Monitor server logs for errors
2. [ ] Check error tracking page for any system errors
3. [ ] Verify alert evaluation loop is running
4. [ ] Monitor CPU and memory usage
5. [ ] Test from multiple browsers
6. [ ] Document any issues in incident tracker
7. [ ] Send announcement to early access users

---

## Known Limitations & Future Work

### Current MVP Limitations
- ⚠️ Single-workspace per user (can be extended to multi-workspace)
- ⚠️ Email/Slack integrations are placeholder (not fully implemented)
- ⚠️ No export to CSV/JSON (documented but not implemented)
- ⚠️ No webhooks/integrations beyond basic support
- ⚠️ Sentiment analysis keyword-based (not ML-powered)
- ⚠️ No feature flags or A/B testing framework
- ⚠️ No scheduled reports generation
- ⚠️ No data anonymization for GDPR

### Roadmap (Post-MVP)
1. **Phase 2: Enterprise Features**
   - [ ] Multi-workspace support per user
   - [ ] Team collaboration and invitations
   - [ ] Role-based access control (RBAC) refinement
   - [ ] Workspace audit logs UI

2. **Phase 3: Integrations**
   - [ ] Slack integration for alerts
   - [ ] Email notifications implementation
   - [ ] Webhook delivery system
   - [ ] Custom event type definitions

3. **Phase 4: Advanced Analytics**
   - [ ] ML-powered anomaly detection
   - [ ] Predictive analytics
   - [ ] Custom report builder
   - [ ] Data export (CSV, JSON, Parquet)

4. **Phase 5: Scale & Performance**
   - [ ] Event data partitioning by date
   - [ ] Elasticsearch for full-text search
   - [ ] Redis caching layer
   - [ ] Event stream processing (Kafka)

---

## Rollback Plan

If critical issues arise after launch:

1. **Issue:** Server crashes on startup
   - **Fix:** Check DATABASE_URL and OPENAI_API_KEY
   - **Rollback:** Revert to previous working commit

2. **Issue:** Database migrations fail
   - **Fix:** Run `npm run db:push` manually with correct DATABASE_URL
   - **Rollback:** Restore database backup, revert to previous schema

3. **Issue:** High CPU/memory usage
   - **Fix:** Check alert evaluation loop isn't stuck
   - **Rollback:** Disable alert evaluation temporarily, restart server

4. **Issue:** API endpoints returning errors
   - **Fix:** Check `/api/errors` page for telemetry
   - **Rollback:** Disable multi-tenancy checks, verify workspace context

---

## Sign-Off

- [ ] Technical Lead approval
- [ ] Product Manager approval  
- [ ] Security review passed
- [ ] Performance testing passed
- [ ] Launch announcement ready

**Launch Date:** ________________  
**Deployed By:** ________________  
**Launch Status:** ☐ Green ☐ Yellow ☐ Red
