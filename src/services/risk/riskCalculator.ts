import { RiskAssessment, RiskAlert, PositionHealthStatus } from "./risk.types";

export class RiskCalculator {
  static assessPortfolioRisk(
    totalEquity: number,
    usedMargin: number,
    positions: { marketSymbol: string; leverage: number; notional: number; liquidationDistancePct: number }[]
  ): RiskAssessment {
    const alerts: RiskAlert[] = [];

    // 1. Exposure Calculation
    const totalExposure = positions.reduce((acc, p) => acc + p.notional, 0);
    const portfolioExposureRatio = totalEquity > 0 ? totalExposure / totalEquity : 0;

    // 2. Leverage Risk Score
    const maxLeverageUsed = positions.length > 0 ? Math.max(...positions.map((p) => p.leverage)) : 1;
    const leverageRisk = Math.min(100, (maxLeverageUsed / 100) * 80 + (portfolioExposureRatio > 5 ? 20 : 0));

    // 3. Margin Health
    const marginUtilization = totalEquity > 0 ? (usedMargin / totalEquity) * 100 : 0;
    let marginHealth: PositionHealthStatus = "healthy";

    if (marginUtilization > 85) marginHealth = "critical";
    else if (marginUtilization > 70) marginHealth = "danger";
    else if (marginUtilization > 50) marginHealth = "warning";

    // 4. Check for Liquidation proximity alerts
    for (const pos of positions) {
      if (pos.liquidationDistancePct <= 2) {
        alerts.push({
          id: `alert-liq-${pos.marketSymbol}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: "critical",
          category: "liquidation",
          title: "Critical Liquidation Warning",
          message: `${pos.marketSymbol} position is within ${pos.liquidationDistancePct.toFixed(1)}% of liquidation!`,
          marketSymbol: pos.marketSymbol,
        });
      } else if (pos.liquidationDistancePct <= 5) {
        alerts.push({
          id: `alert-liq-${pos.marketSymbol}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: "danger",
          category: "liquidation",
          title: "Approaching Liquidation",
          message: `${pos.marketSymbol} position is within ${pos.liquidationDistancePct.toFixed(1)}% of liquidation.`,
          marketSymbol: pos.marketSymbol,
        });
      }

      if (pos.leverage >= 50) {
        alerts.push({
          id: `alert-lev-${pos.marketSymbol}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          severity: "warning",
          category: "leverage",
          title: "High Leverage Active",
          message: `${pos.marketSymbol} is operating at ${pos.leverage}x leverage.`,
          marketSymbol: pos.marketSymbol,
        });
      }
    }

    if (marginUtilization > 80) {
      alerts.push({
        id: `alert-margin-${Date.now()}`,
        timestamp: new Date().toISOString(),
        severity: "danger",
        category: "margin",
        title: "Low Margin Buffer",
        message: `Margin utilization has reached ${marginUtilization.toFixed(1)}%. Deposit funds or reduce positions.`,
      });
    }

    // Overall Risk Score calculation (0 - 100)
    let riskScore = (marginUtilization * 0.4) + (leverageRisk * 0.4);
    if (positions.some((p) => p.liquidationDistancePct <= 5)) {
      riskScore = Math.max(85, riskScore);
    }
    riskScore = Math.min(100, Math.max(5, riskScore));

    return {
      riskScore,
      exposure: totalExposure,
      maxPositionSize: totalEquity * 20, // max buying power cap
      portfolioExposureRatio,
      marginHealth,
      openPositionRisk: positions.length * 10,
      leverageRisk,
      alerts,
    };
  }
}
