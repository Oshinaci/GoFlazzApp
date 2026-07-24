import { MarginSummary, MarginMode } from "./risk.types";

export class MarginService {
  /**
   * Calculates complete margin metrics for a trading account.
   */
  static calculateMarginSummary(
    walletBalance: number,
    unrealizedPnl: number,
    positions: { notionalValue: number; maintenanceMarginRate: number; initialMarginRate: number }[]
  ): MarginSummary {
    const totalEquity = Math.max(0, walletBalance + unrealizedPnl);
    
    let initialMargin = 0;
    let maintenanceMargin = 0;

    for (const pos of positions) {
      initialMargin += pos.notionalValue * pos.initialMarginRate;
      maintenanceMargin += pos.notionalValue * pos.maintenanceMarginRate;
    }

    const usedMargin = initialMargin;
    const freeMargin = Math.max(0, totalEquity - usedMargin);
    const availableMargin = freeMargin; // Buying power / available for new positions

    // Margin Ratio = (Maintenance Margin / Total Equity) * 100
    const marginRatio = totalEquity > 0 ? (maintenanceMargin / totalEquity) * 100 : 0;

    // Margin Utilization = (Used Margin / Total Equity) * 100
    const marginUtilization = totalEquity > 0 ? (usedMargin / totalEquity) * 100 : 0;

    // Buying Power (assuming max 20x average leverage or 5% IM rate)
    const averageImRate = 0.05;
    const buyingPower = freeMargin / averageImRate;

    // Margin Buffer = Equity - Maintenance Margin
    const marginBuffer = Math.max(0, totalEquity - maintenanceMargin);

    return {
      totalEquity,
      initialMargin,
      maintenanceMargin,
      availableMargin,
      usedMargin,
      freeMargin,
      marginRatio,
      marginUtilization,
      buyingPower,
      marginBuffer,
    };
  }

  /**
   * Validates whether a position or account can switch margin mode.
   */
  static validateMarginModeSwitch(
    currentMode: MarginMode,
    targetMode: MarginMode,
    hasActiveOpenOrders: boolean,
    openPositionsCount: number
  ): { allowed: boolean; reason?: string } {
    if (currentMode === targetMode) {
      return { allowed: true };
    }

    if (hasActiveOpenOrders) {
      return {
        allowed: false,
        reason: "Cannot switch margin mode while active open orders exist. Cancel open orders first.",
      };
    }

    if (openPositionsCount > 0 && currentMode === "isolated" && targetMode === "cross") {
      return {
        allowed: true,
      };
    }

    if (openPositionsCount > 0 && currentMode === "cross" && targetMode === "isolated") {
      return {
        allowed: false,
        reason: "Cannot switch from Cross to Isolated while active positions are open. Close positions first.",
      };
    }

    return { allowed: true };
  }
}
