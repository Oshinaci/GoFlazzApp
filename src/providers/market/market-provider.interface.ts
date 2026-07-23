/**
 * Market Data Provider Interface for GoFlazz
 * Allows pluggable providers (CoinGecko, CoinMarketCap, DefiLlama, DexScreener, Birdeye, Custom)
 */
import {
  GlobalMarketOverview,
  TokenDetailItem,
  TokenSearchQuery,
  MarketRankingType,
  TokenCategory,
  CategoryInfo,
  OHLCVPoint,
  ChartTimeframe,
  MarketProviderId,
} from "@/types/market";

export interface IMarketDataProvider {
  readonly providerId: MarketProviderId;
  readonly name: string;

  getGlobalOverview(): Promise<GlobalMarketOverview>;
  getTokens(query: TokenSearchQuery): Promise<TokenDetailItem[]>;
  getTokenDetail(tokenIdOrSymbol: string): Promise<TokenDetailItem | null>;
  getMarketRankings(rankingType: MarketRankingType, limit?: number): Promise<TokenDetailItem[]>;
  getCategories(): Promise<CategoryInfo[]>;
  getChartHistory(tokenId: string, timeframe: ChartTimeframe): Promise<OHLCVPoint[]>;
}
