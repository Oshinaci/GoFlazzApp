import { TradingOrderIntent } from "@/services/trading/trading.types";
import { MarginSummary, OrderRiskValidation } from "./risk.types";

export interface RiskValidationContext {
  marginSummary: MarginSummary;
  maxAllowedLeverage: number;
  maxExposureLimit: number;
  currentExposure: number;
  markPrice: number;
}

export class RiskValidator {
  /**
   * Auto-risk check executed before every order submission.
   */
  static validateOrderRisk(
    intent: TradingOrderIntent,
    context: RiskValidationContext
  ): OrderRiskValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    const targetPrice = intent.price || context.markPrice;
    const notionalValue = intent.size * targetPrice;
    const requiredMargin = notionalValue / intent.leverage;

    // 1. Leverage Limit Check
    if (intent.leverage > context.maxAllowedLeverage) {
      errors.push(`Requested leverage (${intent.leverage}x) exceeds maximum allowed (${context.maxAllowedLeverage}x).`);
    }

    // 2. Margin Availability Check
    if (requiredMargin > context.marginSummary.availableMargin) {
      errors.push(`Insufficient available margin. Required: $${requiredMargin.toFixed(2)}, Available: $${context.marginSummary.availableMargin.toFixed(2)}.`);
    }

    // 3. Exposure Limit Check
    const newTotalExposure = context.currentExposure + notionalValue;
    if (newTotalExposure > context.maxExposureLimit) {
      warnings.push(`New exposure ($${newTotalExposure.toFixed(2)}) approaches account exposure limit ($${context.maxExposureLimit.toFixed(2)}).`);
    }

    // 4. Projected Margin Ratio & Liquidation Distance
    const projectedEquity = context.marginSummary.totalEquity;
    const projectedMaintMargin = context.marginSummary.maintenanceMargin + (notionalValue * 0.005);
    const projectedMarginRatio = projectedEquity > 0 ? (projectedMaintMargin / projectedEquity) * 100 : 0;

    if (projectedMarginRatio > 80) {
      errors.push(`Projected margin ratio (${projectedMarginRatio.toFixed(1)}%) is dangerously high. Order rejected to prevent immediate liquidation.`);
    }

    // Estimated liquidation distance calculation
    let liquidationDistance = 100;
    if (intent.side === "long") {
      const liqPrice = targetPrice * (1 - (1 / intent.leverage) + 0.005);
      liquidationDistance = ((targetPrice - liqPrice) / targetPrice) * 100;
    } else {
      const liqPrice = targetPrice * (1 + (1 / intent.leverage) - 0.005);
      liquidationDistance = ((liqPrice - targetPrice) / targetPrice) * 100;
    }

    if (liquidationDistance < 3) {
      warnings.push(`Liquidation distance is extremely tight (${liquidationDistance.toFixed(1)}%). High risk of liquidation on minor volatility.`);
    }

    // Risk Score calculation
    let riskScore = (intent.leverage / context.maxAllowedLeverage) * 50;
    if (requiredMargin / context.marginSummary.availableMargin > 0.7) riskScore += 30;
    if (intent.marginMode === "isolated") riskScore += 10;
    riskScore = Math.min(100, Math.max(10, riskScore));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      riskScore,
      requiredMargin,
      projectedMarginRatio,
      liquidationDistance,
    };
  }
}
