/**
 * GoFlazz Market Engine Type Definitions
 */

export type MarketProviderId = "coingecko" | "coinmarketcap" | "defillama" | "dexscreener" | "birdeye" | "goflazz_custom";

export interface GlobalMarketOverview {
  totalMarketCapUsd: number;
  marketCapChange24hPercentage: number;
  totalVolume24hUsd: number;
  btcDominancePercentage: number;
  ethDominancePercentage: number;
  fearAndGreedIndex: {
    value: number; // 0 to 100
    classification: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
    lastUpdated: string;
  };
  trendingNarrative: {
    name: string;
    description: string;
    topGainersCount: number;
    change24h: number;
  };
  marketStatus: "BULLISH" | "BEARISH" | "NEUTRAL" | "VOLATILE";
  lastUpdated: string;
}

export type TokenCategory =
  | "layer-1"
  | "layer-2"
  | "ai"
  | "defi"
  | "gaming"
  | "meme"
  | "rwa"
  | "stablecoin"
  | "infrastructure"
  | "dex"
  | "nft"
  | "privacy";

export interface CategoryInfo {
  id: TokenCategory;
  name: string;
  description: string;
  marketCapUsd: number;
  change24hPercentage: number;
  topTokens: string[];
}

export interface TokenContractInfo {
  chainId: number;
  chainName: string;
  address: string;
  decimals: number;
}

export interface TokenSocialLinks {
  website?: string;
  explorer?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  github?: string;
  whitepaper?: string;
}

export interface TokenRiskInfo {
  score: number; // 0 (safest) to 100 (highest risk)
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  verifiedContract: boolean;
  audited: boolean;
  warnings: string[];
}

export interface TokenMarketStatistics {
  priceUsd: number;
  priceChange24hPercentage: number;
  priceChange7dPercentage: number;
  priceChange30dPercentage: number;
  marketCapUsd: number;
  marketCapRank: number;
  fullyDilutedValuationUsd: number;
  volume24hUsd: number;
  high24hUsd: number;
  low24hUsd: number;
  athUsd: number;
  athChangePercentage: number;
  athDate: string;
  atlUsd: number;
  atlChangePercentage: number;
  atlDate: string;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  lastUpdated: string;
}

export interface TokenDetailItem {
  id: string; // e.g. "bitcoin", "ethereum", "arbitrum"
  symbol: string;
  name: string;
  logoUrl: string;
  verified: boolean;
  category: TokenCategory;
  description: string;
  contracts: TokenContractInfo[];
  socials: TokenSocialLinks;
  risk: TokenRiskInfo;
  stats: TokenMarketStatistics;
}

export interface TokenSearchQuery {
  keyword?: string;
  category?: TokenCategory;
  chainId?: number;
  verifiedOnly?: boolean;
  sortBy?: "rank" | "price" | "change24h" | "volume" | "marketCap";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export type MarketRankingType =
  | "top_gainers"
  | "top_losers"
  | "trending"
  | "most_visited"
  | "most_watchlisted"
  | "highest_volume"
  | "highest_market_cap"
  | "new_listings";

export type ChartTimeframe = "1H" | "4H" | "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export interface OHLCVPoint {
  timestamp: number; // UNIX timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartDataSeries {
  symbol: string;
  timeframe: ChartTimeframe;
  points: OHLCVPoint[];
}

export type PriceAlertType =
  | "ABOVE_PRICE"
  | "BELOW_PRICE"
  | "PERCENT_CHANGE"
  | "DAILY_CHANGE"
  | "VOLUME_SPIKE"
  | "MARKET_CAP_CHANGE";

export interface PriceAlertRule {
  id: string;
  userId: string;
  tokenId: string;
  tokenSymbol: string;
  alertType: PriceAlertType;
  targetValue: number; // Target price or % threshold
  currentValueAtCreation: number;
  notifyPush: boolean;
  notifyEmail: boolean;
  enabled: boolean;
  triggered: boolean;
  createdAt: string;
  lastTriggeredAt?: string;
}

export interface CustomWatchlistGroup {
  id: string;
  userId: string;
  name: string;
  tokenIds: string[];
  createdAt: string;
}
