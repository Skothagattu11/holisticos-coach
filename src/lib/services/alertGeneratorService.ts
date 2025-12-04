/**
 * Alert Generator Service
 *
 * Analyzes health data and generates alerts when concerning patterns are detected.
 * Can be run periodically or triggered by health data updates.
 */

import { coachService } from "./coachService";
import { whoopDataService } from "./healthDataService";
import { emailAlertService } from "./emailAlertService";

// Default thresholds (can be overridden by coach preferences)
const DEFAULT_THRESHOLDS = {
  recoveryLow: 50,
  recoveryCritical: 33,
  sleepPerformanceLow: 70,
  sleepDurationMinHours: 6.0,
  strainHigh: 18.0,
  hrvDropPercent: 20,
  daysWithoutCheckin: 3,
};

interface AlertGeneratorResult {
  alertsCreated: number;
  emailsSent: number;
  errors: string[];
}

export const alertGeneratorService = {
  /**
   * Analyze health data for a single client and generate alerts
   */
  async analyzeClientHealth(
    relationshipId: string,
    userId: string,
    expertId: string,
    clientName: string,
    coachEmail: string,
    coachName: string,
    preferences?: any
  ): Promise<AlertGeneratorResult> {
    const result: AlertGeneratorResult = {
      alertsCreated: 0,
      emailsSent: 0,
      errors: [],
    };

    const thresholds = {
      ...DEFAULT_THRESHOLDS,
      ...(preferences || {}),
    };

    try {
      // Fetch recent WHOOP data
      const whoopData = await whoopDataService.fetchAll(userId, 7);

      if (whoopData.recovery.length === 0) {
        console.log(`[AlertGenerator] No WHOOP data for user ${userId}`);
        return result;
      }

      const latestRecovery = whoopData.recovery[0];
      const latestSleep = whoopData.sleep[0];
      const latestCycle = whoopData.cycle[0];

      const alerts: Array<{
        type: string;
        severity: "low" | "medium" | "high" | "critical";
        title: string;
        message: string;
        metricData: any;
      }> = [];

      // Check recovery score
      if (latestRecovery?.score?.recovery_score !== undefined) {
        const recoveryScore = latestRecovery.score.recovery_score;

        if (recoveryScore <= thresholds.recoveryCritical) {
          alerts.push({
            type: "recovery_low",
            severity: "critical",
            title: `Critical: ${clientName}'s recovery is dangerously low`,
            message: `Recovery score is ${recoveryScore}%, which is below the critical threshold of ${thresholds.recoveryCritical}%. This indicates severe physical or mental stress. Recommend checking in immediately.`,
            metricData: {
              recovery: recoveryScore,
              rhr: latestRecovery.score.resting_heart_rate,
              hrv: Math.round(latestRecovery.score.hrv_rmssd_milli),
            },
          });
        } else if (recoveryScore <= thresholds.recoveryLow) {
          alerts.push({
            type: "recovery_low",
            severity: "medium",
            title: `${clientName}'s recovery is below optimal`,
            message: `Recovery score is ${recoveryScore}%, below the ${thresholds.recoveryLow}% threshold. Consider suggesting lighter activities and better rest.`,
            metricData: {
              recovery: recoveryScore,
              rhr: latestRecovery.score.resting_heart_rate,
              hrv: Math.round(latestRecovery.score.hrv_rmssd_milli),
            },
          });
        }
      }

      // Check sleep performance
      if (latestSleep?.score?.sleep_performance_percentage !== undefined) {
        const sleepPerformance = latestSleep.score.sleep_performance_percentage;

        if (sleepPerformance < thresholds.sleepPerformanceLow) {
          const totalSleepHours = latestSleep.score.stage_summary?.total_in_bed_time_milli
            ? (latestSleep.score.stage_summary.total_in_bed_time_milli / (1000 * 60 * 60)).toFixed(1)
            : "unknown";

          alerts.push({
            type: "sleep_poor",
            severity: sleepPerformance < 50 ? "high" : "medium",
            title: `${clientName}'s sleep quality is concerning`,
            message: `Sleep performance is ${sleepPerformance}% with ${totalSleepHours}h in bed. This is below the ${thresholds.sleepPerformanceLow}% threshold. Consider discussing sleep hygiene.`,
            metricData: {
              sleep: sleepPerformance,
              totalHours: totalSleepHours,
              efficiency: latestSleep.score.sleep_efficiency_percentage,
            },
          });
        }
      }

      // Check strain
      if (latestCycle?.score?.strain !== undefined) {
        const strain = latestCycle.score.strain;

        if (strain >= thresholds.strainHigh) {
          alerts.push({
            type: "strain_high",
            severity: strain >= 20 ? "high" : "medium",
            title: `${clientName}'s strain is very high`,
            message: `Day strain reached ${strain.toFixed(1)}, which is above the ${thresholds.strainHigh} threshold. Combined with recovery status, this may require attention.`,
            metricData: {
              strain: strain.toFixed(1),
              avgHr: latestCycle.score.average_heart_rate,
              maxHr: latestCycle.score.max_heart_rate,
            },
          });
        }
      }

      // Check HRV drop (compare to 7-day average)
      if (whoopData.recovery.length >= 3) {
        const recentHrvs = whoopData.recovery
          .slice(1)
          .map((r) => r.score?.hrv_rmssd_milli)
          .filter((h) => h !== undefined);

        if (recentHrvs.length >= 2 && latestRecovery?.score?.hrv_rmssd_milli) {
          const avgHrv = recentHrvs.reduce((a, b) => a + b, 0) / recentHrvs.length;
          const currentHrv = latestRecovery.score.hrv_rmssd_milli;
          const dropPercent = ((avgHrv - currentHrv) / avgHrv) * 100;

          if (dropPercent >= thresholds.hrvDropPercent) {
            alerts.push({
              type: "hrv_drop",
              severity: dropPercent >= 30 ? "high" : "medium",
              title: `${clientName}'s HRV dropped significantly`,
              message: `HRV dropped ${Math.round(dropPercent)}% from recent average (${Math.round(avgHrv)}ms to ${Math.round(currentHrv)}ms). This could indicate accumulated stress or poor recovery.`,
              metricData: {
                hrv: Math.round(currentHrv),
                avgHrv: Math.round(avgHrv),
                dropPercent: Math.round(dropPercent),
              },
            });
          }
        }
      }

      // Create alerts in database and send emails
      for (const alert of alerts) {
        try {
          // Create alert in database
          await coachService.createAlert({
            relationshipId,
            expertId,
            userId,
            alertType: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            metricData: alert.metricData,
          });
          result.alertsCreated++;

          // Send email notification
          const emailSent = await emailAlertService.sendAlertEmail({
            recipientEmail: coachEmail,
            recipientName: coachName,
            clientName,
            alertType: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            metricData: alert.metricData,
            clientDashboardUrl: `${window.location.origin}/clients/${relationshipId}`,
          });

          if (emailSent) {
            result.emailsSent++;
          }
        } catch (err) {
          result.errors.push(`Failed to create alert: ${alert.title}`);
          console.error("[AlertGenerator] Error creating alert:", err);
        }
      }
    } catch (err) {
      result.errors.push(`Failed to analyze client ${userId}: ${err}`);
      console.error("[AlertGenerator] Exception:", err);
    }

    return result;
  },

  /**
   * Analyze all clients for a coach and generate alerts
   */
  async analyzeAllClients(
    expertId: string,
    coachEmail: string,
    coachName: string
  ): Promise<AlertGeneratorResult> {
    const totalResult: AlertGeneratorResult = {
      alertsCreated: 0,
      emailsSent: 0,
      errors: [],
    };

    try {
      // Fetch coach's clients
      const clients = await coachService.fetchCoachClients(expertId);

      // Fetch coach's alert preferences
      const preferences = await coachService.fetchAlertPreferences(expertId);

      // Analyze each client
      for (const client of clients) {
        if (!client.user_id) continue;

        const clientName = client.profile?.full_name || client.profile?.email?.split("@")[0] || "Client";

        const clientResult = await this.analyzeClientHealth(
          client.id,
          client.user_id,
          expertId,
          clientName,
          coachEmail,
          coachName,
          preferences
        );

        totalResult.alertsCreated += clientResult.alertsCreated;
        totalResult.emailsSent += clientResult.emailsSent;
        totalResult.errors.push(...clientResult.errors);
      }
    } catch (err) {
      totalResult.errors.push(`Failed to fetch clients: ${err}`);
      console.error("[AlertGenerator] Exception:", err);
    }

    return totalResult;
  },

  /**
   * Check for missing check-ins and generate alerts
   */
  async checkMissingCheckins(
    expertId: string,
    coachEmail: string,
    coachName: string,
    daysThreshold: number = 3
  ): Promise<AlertGeneratorResult> {
    const result: AlertGeneratorResult = {
      alertsCreated: 0,
      emailsSent: 0,
      errors: [],
    };

    try {
      const clients = await coachService.fetchCoachClients(expertId);

      for (const client of clients) {
        if (!client.user_id) continue;

        // Fetch recent check-ins
        const checkIns = await coachService.fetchCheckInsByUserId(client.user_id, 7);

        // Calculate days since last check-in
        const lastCheckinDate = checkIns.length > 0
          ? new Date(checkIns[0].checkin_date)
          : null;

        if (!lastCheckinDate) {
          // No check-ins at all - only alert if relationship started more than daysThreshold ago
          const relationshipStart = new Date(client.created_at);
          const daysSinceStart = Math.floor(
            (Date.now() - relationshipStart.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceStart >= daysThreshold) {
            const clientName = client.profile?.full_name || "Client";

            try {
              await coachService.createAlert({
                relationshipId: client.id,
                expertId,
                userId: client.user_id,
                alertType: "no_checkin",
                severity: "medium",
                title: `${clientName} hasn't started checking in yet`,
                message: `It's been ${daysSinceStart} days since the coaching relationship started, but no daily check-ins have been recorded. Consider reaching out to help them get started.`,
                metricData: { daysSinceStart },
              });
              result.alertsCreated++;
            } catch (err) {
              result.errors.push(`Failed to create no-checkin alert for ${clientName}`);
            }
          }
        } else {
          const daysSinceLastCheckin = Math.floor(
            (Date.now() - lastCheckinDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysSinceLastCheckin >= daysThreshold) {
            const clientName = client.profile?.full_name || "Client";

            try {
              await coachService.createAlert({
                relationshipId: client.id,
                expertId,
                userId: client.user_id,
                alertType: "no_checkin",
                severity: daysSinceLastCheckin >= 7 ? "high" : "low",
                title: `${clientName} hasn't checked in for ${daysSinceLastCheckin} days`,
                message: `The last check-in was on ${lastCheckinDate.toLocaleDateString()}. This may indicate disengagement or life circumstances. Consider following up.`,
                metricData: {
                  daysSinceLastCheckin,
                  lastCheckinDate: lastCheckinDate.toISOString(),
                },
              });
              result.alertsCreated++;
            } catch (err) {
              result.errors.push(`Failed to create no-checkin alert for ${clientName}`);
            }
          }
        }
      }
    } catch (err) {
      result.errors.push(`Failed to check missing check-ins: ${err}`);
    }

    return result;
  },
};
