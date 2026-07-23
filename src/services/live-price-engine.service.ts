/**
 * Live Price Engine Service
 * Manages token pricing ticker, 24h/7d/30d changes, ATH/ATL, and streaming price updates.
 */
import { marketRepository } from "@/repositories/market.repository";
import { TokenMarketStatistics, TokenDetailItem } from "@/types/market";

export class LivePriceEngineService {
  /**
   * Get price stats for a token
   */
  static async getTokenPriceStats(tokenIdOrSymbol: string): Promise<TokenMarketStatistics | null> {
    const detail = await marketRepository.getTokenDetail(tokenIdOrSymbol);
    return detail?.stats || null;
  }

  /**
   * Get price stats for multiple tokens in parallel
   */
  static async getMultipleTokenPrices(symbolsOrIds: string[]): Promise<Record<string, TokenMarketStatistics>> {
    const results: Record<string, TokenMarketStatistics> = {};

    await Promise.all(
      symbolsOrIds.map(async (id) => {
        const detail = await marketRepository.getTokenDetail(id);
        if (detail) {
          results[detail.symbol] = detail.stats;
          results[detail.id] = detail.stats;
        }
      })
    );

    return results;
  }

  /**
   * Format currency values nicely
   */
  static formatPrice(price: number): string {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.0001) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }

  /**
   * Format percentage change
   */
  static formatChange(change: number): string {
    const prefix = change >= 0 ? "+" : "";
    return `${prefix}${change.toFixed(2)}%`;
  }
}
