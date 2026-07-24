import { LeverageConfig } from "./risk.types";

export class LeverageService {
  private static marketLeverageCaps: Record<string, number> = {
    "BTC-PERP": 100,
    "ETH-PERP": 100,
    "SOL-PERP": 50,
    "AVAX-PERP": 50,
    "DOGE-PERP": 25,
    "SUI-PERP": 25,
    "DEFAULT": 20,
  };

  static getLeverageConfig(marketSymbol: string, currentLeverage: number = 10): LeverageConfig {
    const maxLeverage = this.marketLeverageCaps[marketSymbol] || this.marketLeverageCaps["DEFAULT"];
    const minLeverage = 1;
    const clampedLeverage = Math.min(maxLeverage, Math.max(minLeverage, currentLeverage));
    const maintenanceMarginRate = 1 / (maxLeverage * 2); // e.g. 100x max -> 0.5% MMR

    return {
      marketSymbol,
      minLeverage,
      maxLeverage,
      defaultLeverage: Math.min(10, maxLeverage),
      currentLeverage: clampedLeverage,
      maintenanceMarginRate,
    };
  }

  static validateLeverage(marketSymbol: string, requestedLeverage: number): { valid: boolean; error?: string } {
    const config = this.getLeverageConfig(marketSymbol, requestedLeverage);
    if (requestedLeverage < config.minLeverage) {
      return { valid: false, error: `Leverage must be at least ${config.minLeverage}x.` };
    }
    if (requestedLeverage > config.maxLeverage) {
      return { valid: false, error: `Leverage exceeds maximum allowed (${config.maxLeverage}x) for ${marketSymbol}.` };
    }
    return { valid: true };
  }

  static getRecommendedLeverage(marketSymbol: string, volatilityIndex: number): number {
    const config = this.getLeverageConfig(marketSymbol);
    if (volatilityIndex > 80) return Math.min(5, config.maxLeverage);
    if (volatilityIndex > 50) return Math.min(10, config.maxLeverage);
    if (volatilityIndex > 25) return Math.min(25, config.maxLeverage);
    return Math.min(50, config.maxLeverage);
  }
}
