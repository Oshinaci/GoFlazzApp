import { TradingOrderIntent, OrderPreviewResult } from "./trading.types";

export interface ValidationContext {
  isWalletConnected: boolean;
  isTradingAccountReady: boolean;
  availableMargin: number;
  maxLeverage: number;
  currentPositionsCount: number;
  maxPositionsAllowed: number;
  markPrice: number;
  minOrderSize: number;
  maxOrderSize: number;
  minNotional: number;
  tickSize: number;
  lotSize: number;
}

export class OrderValidator {
  static validate(intent: TradingOrderIntent, context: ValidationContext): OrderPreviewResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Wallet & Account checks
    if (!context.isWalletConnected) {
      errors.push("Wallet is not connected.");
    }
    if (!context.isTradingAccountReady) {
      errors.push("Perpetual trading account is not initialized.");
    }

    // 2. Leverage checks
    if (intent.leverage <= 0 || intent.leverage > context.maxLeverage) {
      errors.push(`Invalid leverage. Must be between 1x and ${context.maxLeverage}x.`);
    }

    // 3. Size & Lot Size checks
    if (intent.size <= 0) {
      errors.push("Order size must be greater than 0.");
    }
    if (intent.size < context.minOrderSize) {
      errors.push(`Order size is below minimum allowed (${context.minOrderSize}).`);
    }
    if (intent.size > context.maxOrderSize) {
      errors.push(`Order size exceeds maximum allowed (${context.maxOrderSize}).`);
    }

    // Lot size remainder check
    if (intent.size % context.lotSize !== 0) {
      warnings.push(`Order size is not a clean multiple of lot size (${context.lotSize}). Rounded execution may occur.`);
    }

    // 4. Price & Tick Size checks
    const targetPrice = intent.price || context.markPrice;
    if (targetPrice <= 0) {
      errors.push("Invalid price.");
    }
    const tickRemainder = targetPrice % context.tickSize;
    if (Math.abs(tickRemainder) > 1e-8 && Math.abs(context.tickSize - tickRemainder) > 1e-8) {
      warnings.push(`Price does not align cleanly with tick size (${context.tickSize}).`);
    }

    // 5. Notional & Margin check
    const notionalValue = intent.size * targetPrice;
    if (notionalValue < context.minNotional) {
      errors.push(`Order notional value ($${notionalValue.toFixed(2)}) is below minimum required ($${context.minNotional}).`);
    }

    const estimatedMarginRequired = notionalValue / intent.leverage;
    if (estimatedMarginRequired > context.availableMargin) {
      errors.push(`Insufficient available margin. Required: $${estimatedMarginRequired.toFixed(2)}, Available: $${context.availableMargin.toFixed(2)}.`);
    }

    // 6. Risk Scoring & Estimates
    const estimatedFee = notionalValue * 0.0005; // 0.05% taker fee
    const maintenanceMarginRatio = 0.005; // 0.5%
    let estimatedLiquidationPrice = 0;

    if (intent.side === "long") {
      estimatedLiquidationPrice = targetPrice * (1 - (1 / intent.leverage) + maintenanceMarginRatio);
      estimatedLiquidationPrice = Math.max(0, estimatedLiquidationPrice);
    } else {
      estimatedLiquidationPrice = targetPrice * (1 + (1 / intent.leverage) - maintenanceMarginRatio);
    }

    let riskScore = (intent.leverage / context.maxLeverage) * 60;
    if (intent.marginMode === "isolated") riskScore += 15;
    if (estimatedMarginRequired / context.availableMargin > 0.8) riskScore += 20;
    riskScore = Math.min(100, Math.max(10, riskScore));

    if (riskScore > 75) {
      warnings.push("High leverage / high margin usage detected. Liquidation risk is elevated.");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedFillPrice: targetPrice,
      estimatedFee,
      estimatedLiquidationPrice,
      marginRequired: estimatedMarginRequired,
      leverage: intent.leverage,
      riskScore,
      fundingRate: 0.0001,
    };
  }
}
