# Quick Start Guide - APM Platform

## For Users

### 1. Access the Platform
- Go to `http://localhost:5000`
- Demo mode is enabled by default
- No login required for development

### 2. Dashboard
- View real-time metrics
- Event velocity chart
- Recent activity feed
- Quick link to AI insights

### 3. View Events
Navigate to **Events** page to:
- See all tracked events
- Filter by type, user ID, URL
- Filter by date range
- View event details (payload, timestamp)

### 4. User Feedback
Navigate to **Feedback** page to:
- **Submit Feedback**: Rate your experience and submit comments
- **View Feedback**: See all submitted feedback with sentiment analysis
- Feedback is automatically analyzed for sentiment (positive/negative/neutral)

### 5. AI Recommendations
Navigate to **Recommendations** page to:
- View AI-generated product recommendations
- See impact scores and effort estimates
- Update recommendation status (new/reviewed/implemented/dismissed)
- Filter by category (revenue/retention/UX)

### 6. Settings
Navigate to **Settings** page to:
- Update your profile (name, email)
- Configure workspace settings:
  - Enable/disable data collection
  - Set AI analysis frequency
  - Configure data retention
  - Enable privacy mode
  - Adjust sample rate
- Generate and manage API keys
- View security options

### 7. Alerts (New!)
Navigate to **Alerts** page to:
- Create alerts for important metrics
- Set conditions (error rate, response time, etc.)
- Choose notification channels (email, Slack, webhook)
- Enable/disable alerts
- Acknowledge triggered alerts

### 8. Analytics (New!)
Navigate to **Analytics** page to:
- View retention curve
- Analyze conversion funnels
- Study cohort behavior
- Review user segments
- Track growth metrics

## For Developers

### 1. Install SDK in Your App

```bash
npm install @apm/sdk
# or use the minified version directly
<script src="https://apm.example.com/sdk.min.js"></script>
```

### 2. Initialize SDK

```javascript
import { createAPMClient } from '@apm/sdk';

const apm = createAPMClient({
  apiKey: 'pk_your_api_key_here',
  endpoint: 'http://localhost:5000',
  enableAutoPageTracking: true,      // Track page views
  enableAutoErrorTracking: true,     // Track errors
  enableAutoPerformanceTracking: true, // Track Web Vitals
  userId: 'user_123',                // Optional: set user ID
  debug: true                        // Optional: enable debug logs
});
```

### 3. Track Events

```javascript
// Track custom events
apm.trackEvent('user_signup', {
  email: 'user@example.com',
  plan: 'pro'
});

// Track user interactions
apm.trackInteraction('click', 'subscribe_button');

// Track errors
try {
  // code that might fail
} catch (error) {
  apm.trackError(error);
}

// Track performance
apm.trackPerformance({
  navigationTiming: performance.getEntriesByType('navigation')[0],
  resourceTimings: performance.getEntriesByType('resource'),
});

// Set user context
apm.setUser('user_456', {
  email: 'newuser@example.com',
  plan: 'free'
});
```

### 4. Get API Key from Settings
- Navigate to Settings → API Keys
- Click "Generate Key"
- Copy the public key (pk_...)
- Use in SDK initialization

### 5. Monitor Events
- Go to Dashboard or Events page
- See your tracked events in real-time
- Check sentiment analysis on feedback
- Review AI recommendations

## Common Tasks

### Submit Feedback
1. Click "Feedback" in sidebar
2. Rate your experience (Good/Neutral/Not great)
3. Select feedback type
4. Write your message (min 10 characters)
5. Click "Submit Feedback"

### Create an Alert
1. Click "Alerts" in sidebar
2. Click "New Alert"
3. Fill in alert details:
   - Alert Name
   - Metric Type (Error Rate, Response Time, etc.)
   - Condition and Threshold
   - Notification Channels
4. Click "Create Alert"

### Generate Recommendations
1. Submit some events and feedback
2. Click "Recommendations" in sidebar
3. Click "Generate Insights" button
4. AI will analyze data and create recommendations
5. Recommendations are scored by impact and effort

### Export Data
- Use the Analytics page for data visualization
- Use API endpoints for raw data:
  ```
  GET /api/events/query?limit=1000
  GET /api/feedback/list
  GET /api/recommendations/list
  ```

### Configure Data Retention
1. Click "Settings" in sidebar
2. Scroll to "Workspace Settings"
3. Adjust "Data Retention Days" slider
4. Click "Save Settings"
5. Data older than retention period will be deleted

## Troubleshooting

### SDK not tracking events
```javascript
// Enable debug mode
const apm = createAPMClient({
  apiKey: 'pk_...',
  debug: true // See console logs
});

// Check Network tab in DevTools
// Should see POST requests to /api/events/batch
```

### Events showing as "Pending"
- Wait a few seconds (batch sends every 30 seconds)
- Or manually call: `apm.flush()`
- Check network tab for any 400/500 errors

### Recommendations not generating
1. Make sure you have some events
2. Ensure OpenAI API key is configured
3. Click "Generate Insights" button explicitly
4. Check browser console for errors

### Settings not saving
1. Check browser console (F12) for errors
2. Verify network tab shows successful PUT request
3. Refresh page and try again
4. Check browser cookies are enabled

## Performance Tips

### Reduce Data Volume
- Set sample rate to 0.5 (50%) in Settings
- This reduces storage and costs while maintaining insights

### Optimize Event Tracking
- Don't track every single interaction
- Focus on meaningful events
- Use batch API (default) for efficiency

### Clean Up Old Data
- Set retention to 30 days instead of 90
- Helps with performance and storage

## What's Next?

### Try These Features
1. ✅ Track events with SDK
2. ✅ Submit feedback
3. ✅ View AI recommendations
4. ✅ Set up alerts
5. ✅ Explore analytics
6. ⏳ Set up webhooks (coming soon)
7. ⏳ Create custom segments (coming soon)
8. ⏳ Multi-team support (coming soon)

### Get Help
- Read full docs: [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
- Check API reference in browser at `/api/*`
- Open DevTools Network tab to see all requests
- Enable debug mode in SDK for verbose logs

---

**Congratulations!** You now have a fully functional APM platform. Happy tracking! 🎉
