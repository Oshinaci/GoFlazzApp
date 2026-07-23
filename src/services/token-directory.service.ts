/**
 * Token Directory Service for GoFlazz
 * Handles searchable directory, category filters, rankings, and search history.
 */
import { marketRepository } from "@/repositories/market.repository";
import {
  TokenDetailItem,
  TokenSearchQuery,
  MarketRankingType,
  CategoryInfo,
  TokenCategory,
} from "@/types/market";

const RECENT_SEARCHES_KEY = "goflazz_market_recent_searches";

export class TokenDirectoryService {
  /**
   * Search token directory with filtering, sorting, pagination
   */
  static async searchTokens(query: TokenSearchQuery): Promise<TokenDetailItem[]> {
    return await marketRepository.getTokens(query);
  }

  /**
   * Fetch single token full detail
   */
  static async getTokenDetail(idOrSymbol: string): Promise<TokenDetailItem | null> {
    return await marketRepository.getTokenDetail(idOrSymbol);
  }

  /**
   * Get Market Rankings (Top Gainers, Top Losers, Trending, Most Visited, Volume, Market Cap)
   */
  static async getRankings(type: MarketRankingType, limit = 10): Promise<TokenDetailItem[]> {
    return await marketRepository.getMarketRankings(type, limit);
  }

  /**
   * Get Market Categories
   */
  static async getCategories(): Promise<CategoryInfo[]> {
    return await marketRepository.getCategories();
  }

  /**
   * Store recent user search keyword
   */
  static saveRecentSearch(keyword: string): string[] {
    if (typeof window === "undefined" || !keyword.trim()) return [];
    try {
      const recent = TokenDirectoryService.getRecentSearches();
      const filtered = recent.filter((s) => s.toLowerCase() !== keyword.toLowerCase());
      const updated = [keyword, ...filtered].slice(0, 8); // Keep top 8
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    } catch (_) {
      return [];
    }
  }

  /**
   * Get recent user searches
   */
  static getRecentSearches(): string[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : ["Bitcoin", "ETH", "Arbitrum", "Solana", "AI Tokens"];
    } catch (_) {
      return ["Bitcoin", "ETH", "Arbitrum", "Solana", "AI Tokens"];
    }
  }

  /**
   * Clear recent searches
   */
  static clearRecentSearches(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  }
}
