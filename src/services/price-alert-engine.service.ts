/**
 * Price Alert Engine Service for GoFlazz
 * Supports Above Price, Below Price, % Change, Daily Change, Volume Spike, Market Cap Change alerts.
 */
import { PriceAlertRule, PriceAlertType, TokenMarketStatistics } from "@/types/market";
import { NotificationsService } from "@/services/notifications.service";

const ALERTS_STORAGE_KEY = "goflazz_price_alerts_v1";

export class PriceAlertEngineService {
  /**
   * Get active price alerts
   */
  static getAlerts(): PriceAlertRule[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save price alerts
   */
  static saveAlerts(alerts: PriceAlertRule[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch (e) {
      console.warn("Failed to save price alerts", e);
    }
  }

  /**
   * Create a new price alert rule
   */
  static createAlert(rule: Omit<PriceAlertRule, "id" | "createdAt" | "triggered">): PriceAlertRule {
    const alerts = this.getAlerts();
    const newRule: PriceAlertRule = {
      ...rule,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      triggered: false,
    };

    alerts.push(newRule);
    this.saveAlerts(alerts);

    // Notify user creation
    NotificationsService.addNotification(
      "price",
      `Price Alert Created: ${rule.tokenSymbol}`,
      `Alert set for ${rule.alertType.replace("_", " ")} at ${rule.targetValue}`,
      "/market"
    );

    return newRule;
  }

  /**
   * Delete an alert
   */
  static deleteAlert(id: string): void {
    const alerts = this.getAlerts().filter((a) => a.id !== id);
    this.saveAlerts(alerts);
  }

  /**
   * Evaluate all alerts against live market statistics and trigger notifications
   */
  static evaluateAlerts(liveStats: Record<string, TokenMarketStatistics>): void {
    const alerts = this.getAlerts();
    let updated = false;

    const remainingAlerts = alerts.map((alert) => {
      if (!alert.enabled || alert.triggered) return alert;

      const stats = liveStats[alert.tokenSymbol] || liveStats[alert.tokenId];
      if (!stats) return alert;

      let isTriggered = false;
      let triggerMessage = "";

      switch (alert.alertType) {
        case "ABOVE_PRICE":
          if (stats.priceUsd >= alert.targetValue) {
            isTriggered = true;
            triggerMessage = `${alert.tokenSymbol} passed above $${alert.targetValue} (Current: $${stats.priceUsd})`;
          }
          break;

        case "BELOW_PRICE":
          if (stats.priceUsd <= alert.targetValue) {
            isTriggered = true;
            triggerMessage = `${alert.tokenSymbol} dropped below $${alert.targetValue} (Current: $${stats.priceUsd})`;
          }
          break;

        case "PERCENT_CHANGE":
          if (Math.abs(stats.priceChange24hPercentage) >= alert.targetValue) {
            isTriggered = true;
            triggerMessage = `${alert.tokenSymbol} moved ${stats.priceChange24hPercentage}% in 24 hours`;
          }
          break;

        case "DAILY_CHANGE":
          if (Math.abs(stats.priceChange24hPercentage) >= alert.targetValue) {
            isTriggered = true;
            triggerMessage = `${alert.tokenSymbol} 24h volatility reached ${stats.priceChange24hPercentage}%`;
          }
          break;

        case "VOLUME_SPIKE":
          if (stats.volume24hUsd >= alert.targetValue) {
            isTriggered = true;
            triggerMessage = `${alert.tokenSymbol} 24h volume spiked to $${(stats.volume24hUsd / 1e6).toFixed(2)}M`;
          }
          break;

        case "MARKET_CAP_CHANGE":
          if (stats.marketCapUsd >= alert.targetValue) {
            isTriggered = true;
            triggerMessage = `${alert.tokenSymbol} market cap crossed $${(stats.marketCapUsd / 1e9).toFixed(2)}B`;
          }
          break;
      }

      if (isTriggered) {
        updated = true;

        // Trigger Notification
        NotificationsService.addNotification(
          "price",
          `🚨 Price Alert: ${alert.tokenSymbol}`,
          triggerMessage,
          "/market"
        );

        return {
          ...alert,
          triggered: true,
          lastTriggeredAt: new Date().toISOString(),
        };
      }

      return alert;
    });

    if (updated) {
      this.saveAlerts(remainingAlerts);
    }
  }
}
