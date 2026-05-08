# Implementation Checklist - Gap Fixes

Use this checklist to implement and verify all gap fixes.

## Pre-Implementation

- [ ] Pull latest changes
- [ ] Run `npm install` to get latest dependencies
- [ ] Run `npm run check` to verify TypeScript compilation
- [ ] Review all changes in `GAP_FIXES_SUMMARY.md`

---

## 1. Sidebar Navigation Fix

- [ ] Verify Integration item appears in sidebar
- [ ] Test clicking Integration navigation
- [ ] Confirm page loads at `/integration`

**Verification Command**:
```bash
npm run dev
# Navigate to http://localhost:5000
# Check sidebar for "Integration" item
```

---

## 2. Alert Notifications Setup

### Prerequisites
- [ ] Slack webhook URL ready (if using Slack alerts)
- [ ] SMTP credentials ready (if using email alerts)
- [ ] Custom webhook URL ready (if using webhooks)

### Configuration

**For Slack Notifications**:
```bash
# Create Slack webhook
# 1. Go to Slack Workspace → Apps → Incoming Webhooks
# 2. Add New Webhook to Channel
# 3. Copy webhook URL
# 4. Add to alert configuration via UI
```

**For Email Notifications** (Optional):
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=notifications@quantora.app
```

### Testing Alerts
- [ ] Create alert via UI
- [ ] Configure at least one notification channel
- [ ] Manually trigger alert condition
- [ ] Verify notification received
- [ ] Check server logs for notification delivery

**Manual Alert Trigger**:
```bash
# Via API or UI, create/update event to exceed alert threshold
# Alert should evaluate and send notification within 1 minute
```

---

## 3. Database Migrations

**Required for email verification**:

```bash
# 1. Create migration file
npm run db:push

# 2. Or manually add columns (if using raw SQL)
ALTER TABLE users ADD COLUMN email_verified TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN email_verification_token VARCHAR(255) NULL;
```

- [ ] Run migrations successfully
- [ ] Verify new columns exist in database
- [ ] Test with existing user records (should have NULL values)

---

## 4. Password Reset Testing

### Forgot Password Flow
1. [ ] Sign in page displays "Forgot Password" link
2. [ ] Click forgot password
3. [ ] Enter email address
4. [ ] Receive reset email (check console in dev mode)
5. [ ] Click reset link in email
6. [ ] Set new password
7. [ ] Login with new password succeeds
8. [ ] Old password no longer works

### Password Reset Endpoints
```bash
# Request password reset
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Check server logs for reset link
# Use token from link in reset-password endpoint
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"<token-from-email>",
    "newPassword":"NewSecurePass123"
  }'
```

- [ ] Forgot password endpoint works
- [ ] Reset token generated and logged
- [ ] Reset password with valid token succeeds
- [ ] Reset password with invalid token fails
- [ ] Reset password with expired token fails (wait 1+ hour in test)

---

## 5. Email Verification Testing

### User Registration with Verification

1. [ ] Register new user
2. [ ] Check server logs for verification link (demo mode)
3. [ ] Verify email with token
4. [ ] Confirm email marked as verified in database

### Email Verification Endpoints
```bash
# Verify email
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"token":"<verification-token>"}'
```

- [ ] Registration works (user created)
- [ ] Verification token generated
- [ ] Verify-email endpoint works
- [ ] Email marked verified in database
- [ ] Invalid token rejected
- [ ] Expired token rejected (wait 24+ hours in test)

---

## 6. SESSION_SECRET Production Validation

### Production Environment Test

```bash
# Test 1: With SESSION_SECRET set
export NODE_ENV=production
export SESSION_SECRET=test-secret-key-here
npm run dev
# Should start successfully

# Test 2: Without SESSION_SECRET
unset SESSION_SECRET
export NODE_ENV=production
npm run dev
# Should exit immediately with error message
```

- [ ] Dev mode works without SESSION_SECRET
- [ ] Production with SESSION_SECRET starts successfully
- [ ] Production without SESSION_SECRET fails with helpful error
- [ ] Error message includes secret generation command

### Deployment Validation

```bash
# Verify in deployment platform
# Render: Check Environment tab has SESSION_SECRET
# Vercel: Check Environment Variables section
# Docker: Check env file or docker-compose.yml
```

- [ ] SESSION_SECRET set in production environment
- [ ] Application starts without secrets warning
- [ ] Sessions persist correctly

---

## 7. Test Suite Verification

### Install Test Dependencies
```bash
npm install
```

- [ ] Vitest installed successfully
- [ ] Type checking passes: `npm run check`

### Run All Tests
```bash
npm run test:run
```

- [ ] All 46 tests pass
- [ ] No test failures
- [ ] Coverage report generated (if running `npm run test:coverage`)

### Test Coverage by Service

**Alert Evaluator Tests** (10 tests):
```bash
npm run test:run -- alert-evaluator.test
```
- [ ] All threshold detection tests pass
- [ ] All metric type tests pass

**Email Service Tests** (16 tests):
```bash
npm run test:run -- email-service.test
```
- [ ] Token generation tests pass
- [ ] Verification tests pass
- [ ] Expiration tests pass

**Notification Service Tests** (9 tests):
```bash
npm run test:run -- notification-service.test
```
- [ ] Slack notification tests pass
- [ ] Webhook tests pass

**Sentiment Analysis Tests** (11 tests):
```bash
npm run test:run -- sentiment-analysis.test
```
- [ ] All sentiment detection tests pass

### Full Verification
```bash
npm run verify
```

- [ ] TypeScript check passes
- [ ] All tests pass
- [ ] SDK builds successfully
- [ ] Production build completes

---

## Integration Testing

### End-to-End Flow

1. **Registration & Email Verification**
   - [ ] New user registers
   - [ ] Email verification token generated
   - [ ] Email verified successfully
   - [ ] User can access account

2. **Alert & Notification**
   - [ ] Create alert with Slack webhook
   - [ ] Trigger alert condition
   - [ ] Notification received in Slack

3. **Password Reset**
   - [ ] Forgot password request submitted
   - [ ] Reset token generated
   - [ ] Password reset with token
   - [ ] Login with new password

---

## Documentation Review

- [ ] Read `GAP_FIXES_SUMMARY.md` - Overview of all fixes
- [ ] Read `TESTING.md` - Testing guide
- [ ] Review inline code comments in modified files
- [ ] Check API endpoint documentation

---

## Deployment Preparation

### Code Review
```bash
# Check modified files
git status

# Expected files modified/created:
# M  client/src/components/layout/Sidebar.tsx
# M  server/auth.ts
# M  server/index.ts
# M  server/services/alert-evaluator.ts
# M  shared/models/auth.ts
# M  package.json
# A  server/services/email-service.ts
# A  server/services/notification-service.ts
# A  server/services/alert-evaluator.test.ts
# A  server/services/email-service.test.ts
# A  server/services/notification-service.test.ts
# A  server/services/sentiment-analysis.test.ts
# A  vitest.config.ts
# A  GAP_FIXES_SUMMARY.md
# A  TESTING.md
```

### Pre-Deployment Checks
- [ ] All tests pass: `npm run verify`
- [ ] No console errors on dev server
- [ ] All features manually tested
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] README updated if needed

---

## Deployment Steps

### Development to Staging
1. [ ] Commit changes: `git commit -m "fix: Implement all critical gaps"`
2. [ ] Push to staging branch: `git push origin staging`
3. [ ] Run tests in CI/CD
4. [ ] Manual testing in staging environment

### Staging to Production
1. [ ] Create Pull Request from staging to main
2. [ ] Review all changes
3. [ ] Approve PR
4. [ ] Merge to main
5. [ ] Run full test suite: `npm run verify`
6. [ ] Deploy to production

### Post-Deployment
1. [ ] Verify all features working in production
2. [ ] Monitor logs for errors
3. [ ] Test password reset flow
4. [ ] Test alert notifications
5. [ ] Verify new user registration with email verification
6. [ ] Check Sidebar integration appears correctly

---

## Troubleshooting

### Compilation Errors
```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run check
```

### Database Issues
```bash
# Verify migrations applied
npm run db:push

# Check for pending migrations
# Fix by running db:push again
```

### Email Not Sending
```bash
# Check SMTP configuration
echo "SMTP_HOST=$SMTP_HOST"
echo "SMTP_USER=$SMTP_USER"
echo "SMTP_PORT=$SMTP_PORT"

# In demo mode, check server logs for email output
# Look for: [EMAIL NOTIFICATION - DEMO MODE]
```

### Tests Failing
```bash
# Run single test file with verbose output
npm run test:run -- email-service.test --reporter=verbose

# Check test file for assertions
cat server/services/email-service.test.ts
```

---

## Final Checklist

- [ ] All 6 gaps implemented
- [ ] All tests passing
- [ ] TypeScript compilation clean
- [ ] Production build succeeds
- [ ] All features manually tested
- [ ] Documentation complete
- [ ] Ready for production deployment

---

## Support & Questions

- Review `GAP_FIXES_SUMMARY.md` for detailed implementation info
- Check `TESTING.md` for test configuration
- See inline code comments for implementation details
- Check server logs for email/notification delivery

**Status**: ✅ Ready for deployment
