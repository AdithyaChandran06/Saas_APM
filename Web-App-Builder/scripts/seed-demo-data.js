#!/usr/bin/env node
/**
 * Comprehensive Demo Data Seeding Script
 * Run with: node scripts/seed-demo-data.js
 * 
 * Creates realistic sample events, feedback, recommendations, and alerts
 * Also creates a demo user account for testing
 */

const http = require("http");

const API_BASE = process.env.API_URL || "http://localhost:5000";

async function makeRequest(method, path, data = null, includeCredentials = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null,
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function seedDemoData() {
  console.log("🌱 PM-AI Comprehensive Demo Data Seeding\n");
  console.log("=" . repeat(50) + "\n");

  try {
    // 1. Create demo user account
    console.log("👤 Creating demo user account...");
    const registerResult = await makeRequest("POST", "/api/auth/register", {
      email: "demo@example.com",
      password: "DemoPassword123",
      firstName: "Demo",
      lastName: "User",
    });
    
    if (registerResult.status === 200 || registerResult.status === 201) {
      console.log("✅ Demo user created/updated successfully");
      console.log("   Email: demo@example.com");
      console.log("   Password: DemoPassword123\n");
    } else if (registerResult.status === 400) {
      console.log("ℹ️  Demo user already exists (that's ok)\n");
    } else {
      console.log("⚠️  Could not create demo user:", registerResult.status, "\n");
    }

    // 2. Create realistic sample events
    console.log("📝 Creating 150+ realistic events...");
    const eventTemplates = [
      // Page views
      { type: "page_view", page: "/dashboard", name: "Dashboard View" },
      { type: "page_view", page: "/events", name: "Events Page View" },
      { type: "page_view", page: "/recommendations", name: "Recommendations View" },
      { type: "page_view", page: "/analytics", name: "Analytics View" },
      { type: "page_view", page: "/settings", name: "Settings View" },
      
      // Feature usage
      { type: "feature_used", feature: "generate_recommendations", name: "Generate Recommendations" },
      { type: "feature_used", feature: "export_events", name: "Export Events" },
      { type: "feature_used", feature: "create_alert", name: "Create Alert" },
      { type: "feature_used", feature: "view_analytics", name: "View Analytics" },
      { type: "feature_used", feature: "share_dashboard", name: "Share Dashboard" },
      
      // Clicks
      { type: "click", element: "btn_generate", name: "Clicked Generate" },
      { type: "click", element: "btn_export", name: "Clicked Export" },
      { type: "click", element: "tab_events", name: "Clicked Events Tab" },
      { type: "click", element: "menu_settings", name: "Clicked Settings Menu" },
    ];

    let eventCount = 0;
    const userIds = Array.from({ length: 15 }, (_, i) => `user_${String(i + 1).padStart(3, "0")}`);
    const sessionIds = Array.from({ length: 20 }, (_, i) => `session_${String(i + 1).padStart(3, "0")}`);

    // Generate events spread across the last 7 days
    for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - dayOffset);
      dayStart.setHours(0, 0, 0, 0);

      // 20 events per day
      for (let i = 0; i < 20; i++) {
        const template = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
        const eventTime = new Date(dayStart.getTime() + Math.random() * 24 * 60 * 60 * 1000);
        
        const payload = {
          userId: userIds[Math.floor(Math.random() * userIds.length)],
          sessionId: sessionIds[Math.floor(Math.random() * sessionIds.length)],
          timestamp: eventTime.toISOString(),
          ...template,
        };

        // Add extra data based on event type
        if (template.type === "page_view") {
          payload.url = `https://app.example.com${template.page}`;
          payload.title = template.name;
          payload.referrer = Math.random() > 0.3 ? "https://google.com" : null;
        } else if (template.type === "feature_used") {
          payload.value = Math.random() > 0.5 ? "success" : "attempt";
          payload.duration = Math.floor(Math.random() * 5000);
        } else if (template.type === "click") {
          payload.coordinates = {
            x: Math.floor(Math.random() * 1920),
            y: Math.floor(Math.random() * 1080),
          };
          payload.innerText = "Button " + Math.floor(Math.random() * 100);
        }

        await makeRequest("POST", "/api/events", payload);
        eventCount++;
      }
    }
    console.log(`✅ Created ${eventCount} realistic events across 8 days\n`);

    // 3. Create diverse feedback
    console.log("💬 Creating diverse feedback entries...");
    const feedbackSamples = [
      // Positive feedback
      { content: "The new dashboard design is amazing! Very intuitive and easy to use.", source: "web" },
      { content: "Excellent recommendations engine. Helped us improve retention by 15%!", source: "email" },
      { content: "Love the real-time event tracking. Perfect for debugging issues.", source: "web" },
      { content: "The AI insights are spot-on. Exactly what we needed.", source: "in_app" },
      { content: "Best analytics tool we've used. Highly recommended!", source: "web" },
      { content: "The alerts feature saved us from a production outage.", source: "support" },
      { content: "Seamless integration. Our team was up and running in minutes.", source: "web" },
      { content: "Customer support is outstanding. Very responsive.", source: "email" },
      
      // Neutral feedback
      { content: "The learning curve is a bit steep, but documentation helps.", source: "web" },
      { content: "Works well for basic analytics. Would like more advanced features.", source: "web" },
      { content: "Good product overall. Some UI elements could be improved.", source: "in_app" },
      { content: "Pricing is reasonable for the features provided.", source: "email" },
      
      // Negative/Constructive feedback  
      { content: "Sometimes the recommendations take a while to generate.", source: "web" },
      { content: "Would love to see webhook integrations.", source: "support" },
      { content: "Export functionality could be improved.", source: "web" },
      { content: "The mobile view needs some work.", source: "web" },
    ];

    let feedbackCount = 0;
    for (const feedback of feedbackSamples) {
      await makeRequest("POST", "/api/feedback", feedback);
      feedbackCount++;
    }
    console.log(`✅ Created ${feedbackCount} feedback entries with mixed sentiment\n`);

    // 4. Create alerts
    console.log("🚨 Setting up monitoring alerts...");
    const alerts = [
      {
        name: "High Error Rate Alert",
        condition: "error_rate > 5%",
        threshold: 5,
        metricType: "error_rate",
        channels: ["email"],
      },
      {
        name: "API Latency Warning",
        condition: "p95_latency > 1000ms",
        threshold: 1000,
        metricType: "latency_p95",
        channels: ["email", "slack"],
      },
      {
        name: "Critical 5xx Errors",
        condition: "status_5xx > 10",
        threshold: 10,
        metricType: "status_5xx",
        channels: ["email"],
      },
      {
        name: "Low User Activity",
        condition: "active_users < 5",
        threshold: 5,
        metricType: "active_users",
        channels: ["email"],
      },
      {
        name: "High Bounce Rate",
        condition: "bounce_rate > 50%",
        threshold: 50,
        metricType: "bounce_rate",
        channels: ["email"],
      },
    ];

    let alertCount = 0;
    for (const alert of alerts) {
      const result = await makeRequest("POST", "/api/alerts", alert);
      if (result.status === 201 || result.status === 200) {
        alertCount++;
      }
    }
    console.log(`✅ Created ${alertCount} monitoring alerts\n`);

    // 5. Create API keys
    console.log("🔑 Generating API keys...");
    const apiKeyNames = [
      "Production Web App",
      "Mobile App",
      "Backend Service",
      "Data Export Tool",
    ];
    
    let keyCount = 0;
    for (const name of apiKeyNames) {
      const result = await makeRequest("POST", "/api/api-keys", { name });
      if (result.status === 201 || result.status === 200) {
        keyCount++;
        console.log(`  ✓ ${name}`);
      }
    }
    console.log(`✅ Generated ${keyCount} API keys\n`);

    // 6. Generate AI recommendations
    console.log("🤖 Generating AI-powered recommendations...");
    const recResult = await makeRequest("POST", "/api/recommendations/generate", {});
    if (recResult.status === 201 || recResult.status === 200) {
      const count = recResult.data.recommendations?.length || recResult.data.length || 1;
      console.log(`✅ Generated ${count} AI recommendations\n`);
    } else if (recResult.status === 429) {
      console.log("⚠️  Recommendation quota reached (max 10/day)\n");
    } else {
      console.log(`⚠️  Could not generate recommendations (status: ${recResult.status})\n`);
    }

    // 7. Update workspace settings
    console.log("⚙️  Configuring workspace settings...");
    await makeRequest("PUT", "/api/settings", {
      dataCollectionEnabled: true,
      aiAnalysisFrequency: "daily",
      retentionDays: 90,
      privacyMode: false,
      sampleRate: 1.0,
    });
    console.log("✅ Workspace settings configured\n");

    console.log("=" . repeat(50));
    console.log("\n🎉 Demo Data Seeding Complete!\n");
    console.log("📊 Summary:");
    console.log(`  • ${eventCount} events created`);
    console.log(`  • ${feedbackCount} feedback entries created`);
    console.log(`  • ${alertCount} alerts configured`);
    console.log(`  • ${keyCount} API keys generated`);
    console.log("\n🚀 Quick Start:");
    console.log("  1. Go to http://localhost:5000");
    console.log("  2. Sign in with:");
    console.log("     Email: demo@example.com");
    console.log("     Password: DemoPassword123");
    console.log("\n📍 Explore:");
    console.log("  • Dashboard: Real-time KPIs and charts");
    console.log("  • Events: Raw event stream with 150+ events");
    console.log("  • Feedback: Mixed sentiment feedback entries");
    console.log("  • Recommendations: AI-generated insights");
    console.log("  • Alerts: 5 monitoring alerts");
    console.log("  • Integration: API keys and integration docs");
    console.log("\n" + "=" . repeat(50) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error.message);
    process.exit(1);
  }
}

seedDemoData();
    console.log("📝 Creating sample alerts...");
    const alerts = [
      {
        name: "High Error Rate",
        condition: "greater_than",
        threshold: 5,
        metricType: "error_rate",
        channels: ["email"],
      },
      {
        name: "Slow API Response",
        condition: "greater_than",
        threshold: 1000,
        metricType: "latency_p95",
        channels: ["email", "slack"],
      },
      {
        name: "5xx Errors",
        condition: "greater_than",
        threshold: 10,
        metricType: "status_5xx",
        channels: ["email"],
      },
    ];

    for (const alert of alerts) {
      const result = await makeRequest("POST", "/api/alerts", alert);
      if (result.status === 201) {
        console.log(`  ✓ Alert: ${alert.name}`);
      }
    }
    console.log("✅ Created sample alerts\n");

    // 4. Create sample API keys
    console.log("📝 Creating sample API keys...");
    const apiKeyResult = await makeRequest("POST", "/api/api-keys", {
      name: "Demo SDK Key",
    });
    if (apiKeyResult.status === 201) {
      console.log(`  ✓ API Key: ${apiKeyResult.data.name}`);
      console.log(`    Public Key: ${apiKeyResult.data.key}\n`);
    }

    // 5. Update settings
    console.log("📝 Configuring workspace settings...");
    await makeRequest("PUT", "/api/settings", {
      dataCollectionEnabled: true,
      aiAnalysisFrequency: "daily",
      retentionDays: 90,
      privacyMode: false,
      sampleRate: 1.0,
    });
    console.log("✅ Updated workspace settings\n");

    // 6. Generate AI recommendations
    console.log("📝 Generating AI recommendations...");
    const recResult = await makeRequest("POST", "/api/recommendations/generate", {});
    if (recResult.status === 201) {
      console.log(`✅ Generated ${recResult.data.recommendations?.length || 1} recommendations\n`);
    } else if (recResult.status === 429) {
      console.log("⚠️  Recommendation quota reached (max 10/day)\n");
    }

    console.log("🎉 Demo data seeding complete!");
    console.log("\nYou can now:");
    console.log("  • View sample events at /events");
    console.log("  • See feedback at /feedback");
    console.log("  • View AI insights at /recommendations");
    console.log("  • Check alerts at /alerts");
    console.log("  • Manage settings at /settings");
    console.log("  • Review errors at /errors");
    console.log("  • Analyze data at /analytics");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

seedDemoData();
