import { LiquidationDetails, PositionHealthStatus } from "./risk.types";

export class LiquidationService {
  /**
   * Calculates liquidation price and position health metrics.
   */
  static calculateLiquidation(
    marketSymbol: string,
    side: "long" | "short",
    entryPrice: number,
    markPrice: number,
    leverage: number,
    size: number,
    margin: number,
    maintenanceMarginRate: number = 0.005
  ): LiquidationDetails {
    let liquidationPrice = 0;

    // Standard linear perpetual liquidation formula:
    // Long: LiqPrice = EntryPrice * (1 - (1/leverage) + MMR)
    // Short: LiqPrice = EntryPrice * (1 + (1/leverage) - MMR)
    if (side === "long") {
      liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
      liquidationPrice = Math.max(0, liquidationPrice);
    } else {
      liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
    }

    // Distance to Liquidation percentage
    const distancePercentage = markPrice > 0 ? (Math.abs(markPrice - liquidationPrice) / markPrice) * 100 : 0;

    // Estimated liquidation loss (total margin at risk)
    const estimatedLoss = margin;

    // Determine health status based on distance to liquidation
    let healthStatus: PositionHealthStatus = "healthy";
    if (distancePercentage <= 2) {
      healthStatus = "liquidating";
    } else if (distancePercentage <= 5) {
      healthStatus = "critical";
    } else if (distancePercentage <= 12) {
      healthStatus = "danger";
    } else if (distancePercentage <= 25) {
      healthStatus = "warning";
    } else {
      healthStatus = "healthy";
    }

    return {
      marketSymbol,
      side,
      entryPrice,
      markPrice,
      leverage,
      size,
      margin,
      liquidationPrice,
      distancePercentage,
      estimatedLoss,
      healthStatus,
    };
  }

  static getHealthColor(status: PositionHealthStatus): string {
    switch (status) {
      case "healthy":
        return "text-emerald-500 bg-emerald-500/10";
      case "warning":
        return "text-amber-500 bg-amber-500/10";
      case "danger":
        return "text-orange-500 bg-orange-500/10";
      case "critical":
        return "text-red-500 bg-red-500/10";
      case "liquidating":
        return "text-purple-500 bg-purple-500/20 animate-pulse";
    }
  }
}
