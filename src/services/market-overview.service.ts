/**
 * Market Overview Service
 * Computes and provides Global Market Cap, 24H Volume, BTC/ETH Dominance, Fear & Greed Index, Trending Narrative, Market Status
 */
import { marketRepository } from "@/repositories/market.repository";
import { GlobalMarketOverview } from "@/types/market";

export class MarketOverviewService {
  /**
   * Fetch current global market overview statistics
   */
  static async getOverview(): Promise<GlobalMarketOverview> {
    return await marketRepository.getGlobalOverview();
  }

  /**
   * Compute formatted stats display strings
   */
  static formatOverviewStats(overview: GlobalMarketOverview) {
    return {
      totalMarketCap: `$${(overview.totalMarketCapUsd / 1e12).toFixed(2)}T`,
      marketCapChange24h: `${overview.marketCapChange24hPercentage >= 0 ? "+" : ""}${overview.marketCapChange24hPercentage.toFixed(2)}%`,
      totalVolume24h: `$${(overview.totalVolume24hUsd / 1e9).toFixed(2)}B`,
      btcDominance: `${overview.btcDominancePercentage.toFixed(1)}%`,
      ethDominance: `${overview.ethDominancePercentage.toFixed(1)}%`,
      fearAndGreed: `${overview.fearAndGreedIndex.value} (${overview.fearAndGreedIndex.classification})`,
      status: overview.marketStatus,
    };
  }
}
