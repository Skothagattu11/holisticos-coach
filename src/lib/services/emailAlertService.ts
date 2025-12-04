/**
 * Email Alert Service
 *
 * This service handles sending email notifications for coach alerts.
 * It can be configured to use different email providers:
 * - Supabase Edge Functions
 * - Resend
 * - SendGrid
 * - AWS SES
 *
 * For now, it uses Supabase Edge Functions with a simple webhook pattern.
 */

import { supabase, isSupabaseConfigured } from "../supabase";

export interface AlertEmailData {
  recipientEmail: string;
  recipientName: string;
  clientName: string;
  alertType: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  metricData?: {
    recovery?: number;
    sleep?: number;
    strain?: number;
    hrv?: number;
    [key: string]: any;
  };
  clientDashboardUrl: string;
}

const SEVERITY_COLORS = {
  low: "#22c55e",
  medium: "#eab308",
  high: "#f97316",
  critical: "#ef4444",
};

const ALERT_TYPE_EMOJI = {
  recovery_low: "💓",
  sleep_poor: "🌙",
  strain_high: "🔥",
  hrv_drop: "📉",
  consistency_drop: "📅",
  no_checkin: "🔕",
};

export const emailAlertService = {
  /**
   * Send an alert email to a coach
   */
  async sendAlertEmail(data: AlertEmailData): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn("[EmailAlertService] Supabase not configured");
      return false;
    }

    try {
      // Call Supabase Edge Function to send email
      const { data: result, error } = await supabase.functions.invoke("send-alert-email", {
        body: {
          to: data.recipientEmail,
          subject: `${this.getAlertEmoji(data.alertType)} Alert: ${data.title}`,
          html: this.generateEmailHtml(data),
          text: this.generateEmailText(data),
        },
      });

      if (error) {
        console.error("[EmailAlertService] Error sending email:", error);
        return false;
      }

      console.log("[EmailAlertService] Email sent successfully:", result);
      return true;
    } catch (err) {
      console.error("[EmailAlertService] Exception sending email:", err);
      return false;
    }
  },

  /**
   * Send a daily digest email with all unactioned alerts
   */
  async sendDailyDigest(
    recipientEmail: string,
    recipientName: string,
    alerts: Array<{
      clientName: string;
      alertType: string;
      severity: string;
      title: string;
      message: string;
      triggeredAt: string;
    }>
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      return false;
    }

    try {
      const { error } = await supabase.functions.invoke("send-alert-email", {
        body: {
          to: recipientEmail,
          subject: `📊 Daily Alert Digest - ${alerts.length} clients need attention`,
          html: this.generateDigestHtml(recipientName, alerts),
          text: this.generateDigestText(recipientName, alerts),
        },
      });

      return !error;
    } catch (err) {
      console.error("[EmailAlertService] Exception sending digest:", err);
      return false;
    }
  },

  /**
   * Queue an alert for batch sending
   * This stores the alert in a queue table for later batch processing
   */
  async queueAlertEmail(
    expertId: string,
    alertId: string,
    emailData: AlertEmailData
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) {
      return false;
    }

    try {
      const { error } = await supabase.from("email_queue").insert({
        expert_id: expertId,
        alert_id: alertId,
        recipient_email: emailData.recipientEmail,
        subject: `${this.getAlertEmoji(emailData.alertType)} Alert: ${emailData.title}`,
        html_content: this.generateEmailHtml(emailData),
        text_content: this.generateEmailText(emailData),
        status: "pending",
      });

      return !error;
    } catch (err) {
      console.error("[EmailAlertService] Error queuing email:", err);
      return false;
    }
  },

  // Helper: Get emoji for alert type
  getAlertEmoji(alertType: string): string {
    return ALERT_TYPE_EMOJI[alertType as keyof typeof ALERT_TYPE_EMOJI] || "⚠️";
  },

  // Helper: Generate HTML email
  generateEmailHtml(data: AlertEmailData): string {
    const severityColor = SEVERITY_COLORS[data.severity];
    const emoji = this.getAlertEmoji(data.alertType);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coach Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">
      ${emoji} Client Alert
    </h1>
    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0;">
      HolisticOS Coaching Dashboard
    </p>
  </div>

  <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
      <span style="background: ${severityColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
        ${data.severity}
      </span>
    </div>
    <h2 style="margin: 0 0 8px 0; color: #1a1a1a;">${data.title}</h2>
    <p style="margin: 0 0 16px 0; color: #666;">Client: <strong>${data.clientName}</strong></p>
    <p style="margin: 0; color: #444;">${data.message}</p>
  </div>

  ${data.metricData ? `
  <div style="background: white; border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
    <h3 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
      Current Metrics
    </h3>
    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
      ${data.metricData.recovery !== undefined ? `
        <div style="background: #f0f4f8; padding: 12px 16px; border-radius: 8px; min-width: 80px;">
          <div style="font-size: 24px; font-weight: bold; color: ${data.metricData.recovery < 50 ? '#ef4444' : '#22c55e'};">
            ${data.metricData.recovery}%
          </div>
          <div style="font-size: 12px; color: #666;">Recovery</div>
        </div>
      ` : ''}
      ${data.metricData.sleep !== undefined ? `
        <div style="background: #f0f4f8; padding: 12px 16px; border-radius: 8px; min-width: 80px;">
          <div style="font-size: 24px; font-weight: bold; color: ${data.metricData.sleep < 70 ? '#ef4444' : '#22c55e'};">
            ${data.metricData.sleep}%
          </div>
          <div style="font-size: 12px; color: #666;">Sleep</div>
        </div>
      ` : ''}
      ${data.metricData.strain !== undefined ? `
        <div style="background: #f0f4f8; padding: 12px 16px; border-radius: 8px; min-width: 80px;">
          <div style="font-size: 24px; font-weight: bold; color: ${data.metricData.strain > 18 ? '#ef4444' : '#22c55e'};">
            ${data.metricData.strain}
          </div>
          <div style="font-size: 12px; color: #666;">Strain</div>
        </div>
      ` : ''}
      ${data.metricData.hrv !== undefined ? `
        <div style="background: #f0f4f8; padding: 12px 16px; border-radius: 8px; min-width: 80px;">
          <div style="font-size: 24px; font-weight: bold; color: #6366f1;">
            ${data.metricData.hrv}ms
          </div>
          <div style="font-size: 12px; color: #666;">HRV</div>
        </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <div style="text-align: center; margin-bottom: 20px;">
    <a href="${data.clientDashboardUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
      View Client Dashboard
    </a>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
    <p style="margin: 0;">
      You're receiving this because you have email alerts enabled in your coach settings.
    </p>
    <p style="margin: 8px 0 0 0;">
      <a href="#" style="color: #666;">Manage alert preferences</a>
    </p>
  </div>
</body>
</html>
    `.trim();
  },

  // Helper: Generate plain text email
  generateEmailText(data: AlertEmailData): string {
    let text = `
CLIENT ALERT - ${data.severity.toUpperCase()}
================================

${data.title}

Client: ${data.clientName}

${data.message}
`;

    if (data.metricData) {
      text += `
CURRENT METRICS
---------------`;
      if (data.metricData.recovery !== undefined) {
        text += `
Recovery: ${data.metricData.recovery}%`;
      }
      if (data.metricData.sleep !== undefined) {
        text += `
Sleep: ${data.metricData.sleep}%`;
      }
      if (data.metricData.strain !== undefined) {
        text += `
Strain: ${data.metricData.strain}`;
      }
      if (data.metricData.hrv !== undefined) {
        text += `
HRV: ${data.metricData.hrv}ms`;
      }
    }

    text += `

View client dashboard: ${data.clientDashboardUrl}

---
HolisticOS Coaching Dashboard
`;

    return text.trim();
  },

  // Helper: Generate digest HTML
  generateDigestHtml(recipientName: string, alerts: any[]): string {
    const alertRows = alerts.map(alert => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${alert.clientName}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          ${alert.title}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <span style="background: ${SEVERITY_COLORS[alert.severity as keyof typeof SEVERITY_COLORS]}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; text-transform: uppercase;">
            ${alert.severity}
          </span>
        </td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Alert Digest</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">
      📊 Daily Alert Digest
    </h1>
    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0;">
      ${alerts.length} client${alerts.length !== 1 ? 's' : ''} need${alerts.length === 1 ? 's' : ''} your attention
    </p>
  </div>

  <p>Hi ${recipientName},</p>
  <p>Here's a summary of alerts from your clients that haven't been addressed yet:</p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background: #f8f9fa;">
        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666;">Client</th>
        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666;">Alert</th>
        <th style="padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #666;">Severity</th>
      </tr>
    </thead>
    <tbody>
      ${alertRows}
    </tbody>
  </table>

  <div style="text-align: center; margin: 30px 0;">
    <a href="#" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      View All Alerts
    </a>
  </div>

  <div style="text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px;">
    <p>HolisticOS Coaching Dashboard</p>
  </div>
</body>
</html>
    `.trim();
  },

  // Helper: Generate digest plain text
  generateDigestText(recipientName: string, alerts: any[]): string {
    const alertList = alerts.map(alert =>
      `- ${alert.clientName}: ${alert.title} (${alert.severity})`
    ).join('\n');

    return `
DAILY ALERT DIGEST
==================

Hi ${recipientName},

${alerts.length} client${alerts.length !== 1 ? 's' : ''} need${alerts.length === 1 ? 's' : ''} your attention:

${alertList}

---
HolisticOS Coaching Dashboard
    `.trim();
  },
};
