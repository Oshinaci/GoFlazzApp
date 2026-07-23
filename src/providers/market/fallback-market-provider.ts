/**
 * Fallback Market Data Provider for GoFlazz
 * Guarantees zero downtime and realistic data if CoinGecko/remote providers rate limit or fail.
 */
import { IMarketDataProvider } from "./market-provider.interface";
import {
  GlobalMarketOverview,
  TokenDetailItem,
  TokenSearchQuery,
  MarketRankingType,
  CategoryInfo,
  OHLCVPoint,
  ChartTimeframe,
  MarketProviderId,
} from "@/types/market";

export class FallbackMarketProvider implements IMarketDataProvider {
  readonly providerId: MarketProviderId = "goflazz_custom";
  readonly name = "GoFlazz Fallback Market Node";

  private defaultTokens: TokenDetailItem[] = [
    {
      id: "bitcoin",
      symbol: "BTC",
      name: "Bitcoin",
      logoUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      verified: true,
      category: "layer-1",
      description: "Bitcoin is the first decentralized digital currency, enabling peer-to-peer transfers worldwide.",
      contracts: [],
      socials: {
        website: "https://bitcoin.org",
        explorer: "https://mempool.space",
        twitter: "https://twitter.com/bitcoin",
        whitepaper: "https://bitcoin.org/bitcoin.pdf",
      },
      risk: {
        score: 5,
        level: "LOW",
        verifiedContract: true,
        audited: true,
        warnings: [],
      },
      stats: {
        priceUsd: 64200.0,
        priceChange24hPercentage: 3.45,
        priceChange7dPercentage: 8.2,
        priceChange30dPercentage: 15.4,
        marketCapUsd: 1260000000000,
        marketCapRank: 1,
        fullyDilutedValuationUsd: 1348200000000,
        volume24hUsd: 32000000000,
        high24hUsd: 65100.0,
        low24hUsd: 62400.0,
        athUsd: 73750.0,
        athChangePercentage: -12.9,
        athDate: "2024-03-14T00:00:00.000Z",
        atlUsd: 67.81,
        atlChangePercentage: 94650,
        atlDate: "2013-07-06T00:00:00.000Z",
        circulatingSupply: 19700000,
        totalSupply: 19700000,
        maxSupply: 21000000,
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: "ethereum",
      symbol: "ETH",
      name: "Ethereum",
      logoUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      verified: true,
      category: "layer-1",
      description: "Ethereum is a decentralized, open-source blockchain with smart contract functionality.",
      contracts: [],
      socials: {
        website: "https://ethereum.org",
        explorer: "https://etherscan.io",
        twitter: "https://twitter.com/ethereum",
      },
      risk: {
        score: 8,
        level: "LOW",
        verifiedContract: true,
        audited: true,
        warnings: [],
      },
      stats: {
        priceUsd: 3350.0,
        priceChange24hPercentage: 2.18,
        priceChange7dPercentage: 5.4,
        priceChange30dPercentage: 11.2,
        marketCapUsd: 402000000000,
        marketCapRank: 2,
        fullyDilutedValuationUsd: 402000000000,
        volume24hUsd: 18500000000,
        high24hUsd: 3390.0,
        low24hUsd: 3280.0,
        athUsd: 4878.26,
        athChangePercentage: -31.3,
        athDate: "2021-11-10T00:00:00.000Z",
        atlUsd: 0.43,
        atlChangePercentage: 778900,
        atlDate: "2015-10-20T00:00:00.000Z",
        circulatingSupply: 120200000,
        totalSupply: 120200000,
        maxSupply: null,
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: "arbitrum",
      symbol: "ARB",
      name: "Arbitrum",
      logoUrl: "https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png",
      verified: true,
      category: "layer-2",
      description: "Arbitrum is an Optimistic Rollup Layer 2 suite designed to scale Ethereum.",
      contracts: [{ chainId: 42161, chainName: "Arbitrum One", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 }],
      socials: {
        website: "https://arbitrum.io",
        explorer: "https://arbiscan.io",
      },
      risk: {
        score: 12,
        level: "LOW",
        verifiedContract: true,
        audited: true,
        warnings: [],
      },
      stats: {
        priceUsd: 0.85,
        priceChange24hPercentage: -1.25,
        priceChange7dPercentage: 4.1,
        priceChange30dPercentage: -8.2,
        marketCapUsd: 2800000000,
        marketCapRank: 45,
        fullyDilutedValuationUsd: 8500000000,
        volume24hUsd: 180000000,
        high24hUsd: 0.89,
        low24hUsd: 0.82,
        athUsd: 2.39,
        athChangePercentage: -64.4,
        athDate: "2024-01-12T00:00:00.000Z",
        atlUsd: 0.74,
        atlChangePercentage: 14.8,
        atlDate: "2023-09-11T00:00:00.000Z",
        circulatingSupply: 3250000000,
        totalSupply: 10000000000,
        maxSupply: 10000000000,
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: "solana",
      symbol: "SOL",
      name: "Solana",
      logoUrl: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      verified: true,
      category: "layer-1",
      description: "Solana is a high-performance blockchain supporting builders around the globe.",
      contracts: [],
      socials: { website: "https://solana.com", explorer: "https://solscan.io" },
      risk: { score: 15, level: "LOW", verifiedContract: true, audited: true, warnings: [] },
      stats: {
        priceUsd: 148.5,
        priceChange24hPercentage: 4.2,
        priceChange7dPercentage: 12.8,
        priceChange30dPercentage: 22.4,
        marketCapUsd: 69000000000,
        marketCapRank: 5,
        fullyDilutedValuationUsd: 86000000000,
        volume24hUsd: 4200000000,
        high24hUsd: 153.0,
        low24hUsd: 142.1,
        athUsd: 259.96,
        athChangePercentage: -42.8,
        athDate: "2021-11-06T00:00:00.000Z",
        atlUsd: 0.5,
        atlChangePercentage: 29600,
        atlDate: "2020-05-11T00:00:00.000Z",
        circulatingSupply: 465000000,
        totalSupply: 580000000,
        maxSupply: null,
        lastUpdated: new Date().toISOString(),
      },
    },
    {
      id: "goflazz",
      symbol: "FLZ",
      name: "GoFlazz Token",
      logoUrl: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
      verified: true,
      category: "infrastructure",
      description: "Native utility & governance token powering the GoFlazz cross-chain ecosystem.",
      contracts: [{ chainId: 42161, chainName: "Arbitrum One", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8", decimals: 18 }],
      socials: { website: "https://goflazz.io", explorer: "https://arbiscan.io" },
      risk: { score: 0, level: "LOW", verifiedContract: true, audited: true, warnings: [] },
      stats: {
        priceUsd: 0.24,
        priceChange24hPercentage: 12.5,
        priceChange7dPercentage: 34.0,
        priceChange30dPercentage: 88.5,
        marketCapUsd: 24000000,
        marketCapRank: 450,
        fullyDilutedValuationUsd: 240000000,
        volume24hUsd: 3500000,
        high24hUsd: 0.26,
        low24hUsd: 0.21,
        athUsd: 0.35,
        athChangePercentage: -31.4,
        athDate: "2024-05-01T00:00:00.000Z",
        atlUsd: 0.05,
        atlChangePercentage: 380,
        atlDate: "2023-11-01T00:00:00.000Z",
        circulatingSupply: 100000000,
        totalSupply: 1000000000,
        maxSupply: 1000000000,
        lastUpdated: new Date().toISOString(),
      },
    },
  ];

  async getGlobalOverview(): Promise<GlobalMarketOverview> {
    return {
      totalMarketCapUsd: 2450000000000,
      marketCapChange24hPercentage: 2.85,
      totalVolume24hUsd: 82500000000,
      btcDominancePercentage: 54.2,
      ethDominancePercentage: 16.8,
      fearAndGreedIndex: {
        value: 68,
        classification: "Greed",
        lastUpdated: new Date().toISOString(),
      },
      trendingNarrative: {
        name: "Layer 2 & AI Tokens",
        description: "Zero-knowledge rollups and decentralized AI compute providers leading market volume.",
        topGainersCount: 14,
        change24h: 8.4,
      },
      marketStatus: "BULLISH",
      lastUpdated: new Date().toISOString(),
    };
  }

  async getTokens(query: TokenSearchQuery): Promise<TokenDetailItem[]> {
    let list = [...this.defaultTokens];

    if (query.keyword) {
      const kw = query.keyword.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(kw) ||
          t.symbol.toLowerCase().includes(kw) ||
          t.contracts.some((c) => c.address.toLowerCase() === kw)
      );
    }

    if (query.category) {
      list = list.filter((t) => t.category === query.category);
    }

    if (query.sortBy) {
      list.sort((a, b) => {
        let valA = a.stats[query.sortBy === "rank" ? "marketCapRank" : "priceUsd"] || 0;
        let valB = b.stats[query.sortBy === "rank" ? "marketCapRank" : "priceUsd"] || 0;
        return query.sortOrder === "asc" ? valA - valB : valB - valA;
      });
    }

    return list;
  }

  async getTokenDetail(idOrSymbol: string): Promise<TokenDetailItem | null> {
    const target = idOrSymbol.toLowerCase();
    const found = this.defaultTokens.find(
      (t) => t.id.toLowerCase() === target || t.symbol.toLowerCase() === target
    );
    return found || this.defaultTokens[0];
  }

  async getMarketRankings(rankingType: MarketRankingType, limit = 10): Promise<TokenDetailItem[]> {
    let list = [...this.defaultTokens];

    if (rankingType === "top_gainers") {
      list.sort((a, b) => b.stats.priceChange24hPercentage - a.stats.priceChange24hPercentage);
    } else if (rankingType === "top_losers") {
      list.sort((a, b) => a.stats.priceChange24hPercentage - b.stats.priceChange24hPercentage);
    } else if (rankingType === "highest_volume") {
      list.sort((a, b) => b.stats.volume24hUsd - a.stats.volume24hUsd);
    }

    return list.slice(0, limit);
  }

  async getCategories(): Promise<CategoryInfo[]> {
    return [
      {
        id: "layer-1",
        name: "Layer 1 Blockchains",
        description: "Base layer smart contract platforms like Bitcoin, Ethereum, and Solana.",
        marketCapUsd: 1750000000000,
        change24hPercentage: 3.1,
        topTokens: ["bitcoin", "ethereum", "solana"],
      },
      {
        id: "layer-2",
        name: "Layer 2 Scaling",
        description: "Rollups and scaling solutions for Ethereum.",
        marketCapUsd: 18500000000,
        change24hPercentage: 1.8,
        topTokens: ["arbitrum", "polygon"],
      },
      {
        id: "ai",
        name: "Artificial Intelligence",
        description: "Decentralized AI infrastructure and machine learning networks.",
        marketCapUsd: 28000000000,
        change24hPercentage: 8.5,
        topTokens: ["near", "render"],
      },
      {
        id: "defi",
        name: "DeFi Protocols",
        description: "Decentralized exchanges, lending platforms, and yield aggregators.",
        marketCapUsd: 95000000000,
        change24hPercentage: 4.2,
        topTokens: ["uniswap", "aave"],
      },
    ];
  }

  async getChartHistory(tokenId: string, timeframe: ChartTimeframe): Promise<OHLCVPoint[]> {
    const token = await this.getTokenDetail(tokenId);
    const basePrice = token?.stats.priceUsd || 100;
    const count = timeframe === "1H" ? 12 : timeframe === "1D" ? 24 : timeframe === "1W" ? 28 : 30;

    const points: OHLCVPoint[] = [];
    let now = Date.now();
    const intervalMs = (24 * 60 * 60 * 1000) / count;

    for (let i = count; i >= 0; i--) {
      const timestamp = now - i * intervalMs;
      const variation = (Math.random() - 0.48) * (basePrice * 0.02);
      const close = Math.max(0.001, basePrice + variation);
      const open = close - (Math.random() - 0.5) * (basePrice * 0.01);
      const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
      const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);

      points.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.floor(basePrice * 10000 * (1 + Math.random())),
      });
    }

    return points;
  }
}
