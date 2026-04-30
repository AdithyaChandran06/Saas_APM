#!/usr/bin/env node
/**
 * Demo Data Seeding Script
 * Run with: node scripts/seed-demo-data.js
 * 
 * Creates sample events, feedback, recommendations, and alerts for demo purposes
 */

const http = require("http");

const API_BASE = process.env.API_URL || "http://localhost:5000";

async function makeRequest(method, path, data = null) {
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
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body,
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
  console.log("🌱 Seeding demo data...\n");

  try {
    // 1. Create sample events
    console.log("📝 Creating sample events...");
    const eventTypes = ["page_view", "click", "feature_used", "error", "custom_event"];
    const pages = ["/dashboard", "/events", "/feedback", "/analytics", "/settings"];
    
    for (let i = 0; i < 50; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const page = pages[Math.floor(Math.random() * pages.length)];
      
      await makeRequest("POST", "/api/events", {
        type: eventType,
        payload: {
          page,
          userId: `user_${Math.floor(Math.random() * 20)}`,
          sessionId: `session_${Math.floor(Math.random() * 10)}`,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          ...(eventType === "error" && { error: "Sample error for demo" }),
          ...(eventType === "click" && { elementId: "btn_action" }),
        },
      });
    }
    console.log("✅ Created 50 sample events\n");

    // 2. Create sample feedback
    console.log("📝 Creating sample feedback...");
    const feedbackSamples = [
      { content: "This is amazing! Love the new dashboard design.", source: "web" },
      { content: "The alerts feature is very helpful for monitoring.", source: "web" },
      { content: "Great experience so far!", source: "in_app" },
      { content: "Performance is a bit slow sometimes.", source: "web" },
      { content: "The interface could be more intuitive.", source: "web" },
      { content: "Excellent product! Very satisfied.", source: "email" },
      { content: "Some features are confusing, but overall good.", source: "web" },
      { content: "Would love to see more analytics options.", source: "support" },
    ];

    for (const feedback of feedbackSamples) {
      await makeRequest("POST", "/api/feedback", feedback);
    }
    console.log("✅ Created sample feedback\n");

    // 3. Create sample alerts
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
