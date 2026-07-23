/**
 * GoFlazz Market Repository
 * Coordinates data providers (CoinGecko, Fallback, etc.), market caching, and rate limiting.
 */
import { IMarketDataProvider } from "@/providers/market/market-provider.interface";
import { CoinGeckoMarketProvider } from "@/providers/market/coingecko-provider";
import { FallbackMarketProvider } from "@/providers/market/fallback-market-provider";
import { MarketCacheEngine } from "@/cache/market-cache";
import {
  GlobalMarketOverview,
  TokenDetailItem,
  TokenSearchQuery,
  MarketRankingType,
  CategoryInfo,
  OHLCVPoint,
  ChartTimeframe,
} from "@/types/market";

export class MarketRepository {
  private primaryProvider: IMarketDataProvider;
  private fallbackProvider: IMarketDataProvider;

  constructor() {
    this.primaryProvider = new CoinGeckoMarketProvider();
    this.fallbackProvider = new FallbackMarketProvider();
  }

  async getGlobalOverview(): Promise<GlobalMarketOverview> {
    const cacheKey = "market_global_overview";
    const cached = MarketCacheEngine.get<GlobalMarketOverview>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.primaryProvider.getGlobalOverview();
      MarketCacheEngine.set(cacheKey, data, 60000); // 1 min TTL
      return data;
    } catch (err) {
      const fallback = await this.fallbackProvider.getGlobalOverview();
      MarketCacheEngine.set(cacheKey, fallback, 120000);
      return fallback;
    }
  }

  async getTokens(query: TokenSearchQuery): Promise<TokenDetailItem[]> {
    const cacheKey = `market_tokens_${JSON.stringify(query)}`;
    const cached = MarketCacheEngine.get<TokenDetailItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.primaryProvider.getTokens(query);
      MarketCacheEngine.set(cacheKey, data, 45000); // 45s TTL
      return data;
    } catch (err) {
      const fallback = await this.fallbackProvider.getTokens(query);
      MarketCacheEngine.set(cacheKey, fallback, 120000);
      return fallback;
    }
  }

  async getTokenDetail(idOrSymbol: string): Promise<TokenDetailItem | null> {
    const cacheKey = `market_token_detail_${idOrSymbol.toLowerCase()}`;
    const cached = MarketCacheEngine.get<TokenDetailItem>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.primaryProvider.getTokenDetail(idOrSymbol);
      if (data) {
        MarketCacheEngine.set(cacheKey, data, 60000);
        return data;
      }
    } catch (_) {}

    const fallback = await this.fallbackProvider.getTokenDetail(idOrSymbol);
    if (fallback) {
      MarketCacheEngine.set(cacheKey, fallback, 120000);
    }
    return fallback;
  }

  async getMarketRankings(rankingType: MarketRankingType, limit = 10): Promise<TokenDetailItem[]> {
    const cacheKey = `market_rankings_${rankingType}_${limit}`;
    const cached = MarketCacheEngine.get<TokenDetailItem[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.primaryProvider.getMarketRankings(rankingType, limit);
      MarketCacheEngine.set(cacheKey, data, 60000);
      return data;
    } catch (err) {
      const fallback = await this.fallbackProvider.getMarketRankings(rankingType, limit);
      MarketCacheEngine.set(cacheKey, fallback, 120000);
      return fallback;
    }
  }

  async getCategories(): Promise<CategoryInfo[]> {
    const cacheKey = "market_categories";
    const cached = MarketCacheEngine.get<CategoryInfo[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.primaryProvider.getCategories();
      MarketCacheEngine.set(cacheKey, data, 300000); // 5 mins TTL
      return data;
    } catch (err) {
      const fallback = await this.fallbackProvider.getCategories();
      MarketCacheEngine.set(cacheKey, fallback, 300000);
      return fallback;
    }
  }

  async getChartHistory(tokenId: string, timeframe: ChartTimeframe): Promise<OHLCVPoint[]> {
    const cacheKey = `market_chart_${tokenId}_${timeframe}`;
    const cached = MarketCacheEngine.get<OHLCVPoint[]>(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.primaryProvider.getChartHistory(tokenId, timeframe);
      MarketCacheEngine.set(cacheKey, data, 120000); // 2 mins TTL
      return data;
    } catch (err) {
      const fallback = await this.fallbackProvider.getChartHistory(tokenId, timeframe);
      MarketCacheEngine.set(cacheKey, fallback, 300000);
      return fallback;
    }
  }
}

export const marketRepository = new MarketRepository();
