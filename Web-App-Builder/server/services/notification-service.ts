/**
 * Notification Service
 * Handles sending notifications via email, Slack, and webhooks
 */

// Optional: nodemailer is not required, email sending falls back to logging
let nodemailer: any;
try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

export type NotificationChannel = "email" | "slack" | "webhook";

export interface NotificationPayload {
  channel: NotificationChannel;
  title: string;
  message: string;
  webhookUrl?: string;
  email?: string;
  slackWebhookUrl?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Send notification via email
 */
export async function sendEmailNotification(
  to: string,
  title: string,
  message: string
): Promise<void> {
  try {
    // For development/demo, we'll just log
    // In production, configure SMTP_* environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.log(`[EMAIL NOTIFICATION - DEMO MODE]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${title}`);
      console.log(`Body: ${message}`);
      return;
    }

    if (!nodemailer) {
      console.log(`[EMAIL NOTIFICATION - NODEMAILER NOT INSTALLED]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${title}`);
      console.log(`Body: ${message}`);
      console.log(`Note: Install 'nodemailer' package to enable real email sending`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to,
      subject: `Quantora Alert: ${title}`,
      html: `
        <h2>${title}</h2>
        <p>${message}</p>
        <p><a href="${process.env.CORS_ORIGIN || 'http://localhost:5000'}/alerts">View Alert</a></p>
      `,
    });

    console.log(`[EMAIL SENT] ${title} → ${to}`);
  } catch (error) {
    console.error(`Failed to send email notification:`, error);
    throw error;
  }
}

/**
 * Send notification via Slack
 */
export async function sendSlackNotification(
  webhookUrl: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const payload = {
      text: title,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${title}*\n${message}`,
          },
        },
        ...(metadata
          ? [
              {
                type: "section",
                fields: Object.entries(metadata).map(([key, value]) => ({
                  type: "mrkdwn",
                  text: `*${key}:*\n${value}`,
                })),
              },
            ]
          : []),
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    console.log(`[SLACK SENT] ${title}`);
  } catch (error) {
    console.error(`Failed to send Slack notification:`, error);
    throw error;
  }
}

/**
 * Send notification via webhook
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const payload = {
      event: "alert.triggered",
      timestamp: new Date().toISOString(),
      title,
      message,
      metadata,
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    console.log(`[WEBHOOK SENT] ${title} → ${webhookUrl}`);
  } catch (error) {
    console.error(`Failed to send webhook notification:`, error);
    throw error;
  }
}

/**
 * Send notification based on channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const { channel, title, message, email, webhookUrl, slackWebhookUrl, metadata } = payload;

  try {
    switch (channel) {
      case "email":
        if (!email) throw new Error("Email address required for email notification");
        await sendEmailNotification(email, title, message);
        break;

      case "slack":
        if (!slackWebhookUrl) throw new Error("Slack webhook URL required");
        await sendSlackNotification(slackWebhookUrl, title, message, metadata);
        break;

      case "webhook":
        if (!webhookUrl) throw new Error("Webhook URL required");
        await sendWebhookNotification(webhookUrl, title, message, metadata);
        break;

      default:
        console.warn(`Unknown notification channel: ${channel}`);
    }
  } catch (error) {
    console.error(`Notification failed (${channel}):`, error);
    // Don't throw - allow other channels to proceed
  }
}
