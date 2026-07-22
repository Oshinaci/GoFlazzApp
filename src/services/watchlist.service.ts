import { NotificationsService } from "./notifications.service";

import { safeStringify } from "@/lib/supabaseClient";

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  change7d: number;
  marketCapUsd: number;
  volume24hUsd: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
  color: string;
  isFavorite: boolean;
  alertPriceUpper?: number;
  alertPriceLower?: number;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  volume: number;
}

const INITIAL_WATCHLIST: WatchlistItem[] = [
  {
    id: "bitcoin",
    symbol: "BTC",
    name: "Bitcoin",
    priceUsd: 64200.0,
    change24h: 3.45,
    change7d: 8.2,
    marketCapUsd: 1260000000000,
    volume24hUsd: 32000000000,
    high24h: 65100.0,
    low24h: 62400.0,
    sparkline: [62100, 62800, 62400, 63100, 63800, 64200],
    color: "#F7931A",
    isFavorite: true,
    alertPriceUpper: 66000,
  },
  {
    id: "ethereum",
    symbol: "ETH",
    name: "Ethereum",
    priceUsd: 3350.0,
    change24h: 2.18,
    change7d: 5.4,
    marketCapUsd: 402000000000,
    volume24hUsd: 18500000000,
    high24h: 3390.0,
    low24h: 3280.0,
    sparkline: [3250, 3290, 3280, 3310, 3330, 3350],
    color: "#627EEA",
    isFavorite: true,
    alertPriceUpper: 3500,
  },
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    priceUsd: 148.5,
    change24h: -1.2,
    change7d: 12.8,
    marketCapUsd: 69000000000,
    volume24hUsd: 4200000000,
    high24h: 153.0,
    low24h: 146.2,
    sparkline: [142, 145, 151, 153, 150, 148.5],
    color: "#14F195",
    isFavorite: true,
  },
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Arbitrum",
    priceUsd: 0.84,
    change24h: -2.4,
    change7d: -4.1,
    marketCapUsd: 2800000000,
    volume24hUsd: 310000000,
    high24h: 0.88,
    low24h: 0.82,
    sparkline: [0.89, 0.87, 0.86, 0.85, 0.83, 0.84],
    color: "#28A0F0",
    isFavorite: true,
  },
  {
    id: "goflazz",
    symbol: "FLZ",
    name: "GoFlazz Utility",
    priceUsd: 0.24,
    change24h: 12.5,
    change7d: 34.0,
    marketCapUsd: 24000000,
    volume24hUsd: 3500000,
    high24h: 0.26,
    low24h: 0.21,
    sparkline: [0.18, 0.19, 0.21, 0.22, 0.23, 0.24],
    color: "#8B5CF6",
    isFavorite: true,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    priceUsd: 14.2,
    change24h: 4.1,
    change7d: 9.3,
    marketCapUsd: 8400000000,
    volume24hUsd: 480000000,
    high24h: 14.6,
    low24h: 13.5,
    sparkline: [13.2, 13.5, 13.8, 14.1, 13.9, 14.2],
    color: "#375BD2",
    isFavorite: false,
  },
];

const WATCHLIST_STORAGE_KEY = "goflazz_watchlist_v1";

export class WatchlistService {
  static getWatchlist(): WatchlistItem[] {
    if (typeof window === "undefined") return INITIAL_WATCHLIST;
    try {
      const stored = localStorage.getItem(WATCHLIST_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, safeStringify(INITIAL_WATCHLIST));
        return INITIAL_WATCHLIST;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_WATCHLIST;
    }
  }

  static saveWatchlist(items: WatchlistItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(WATCHLIST_STORAGE_KEY, safeStringify(items));
    } catch (e) {
      console.warn("Failed to save watchlist", e);
    }
  }

  static toggleFavorite(id: string): WatchlistItem[] {
    const list = WatchlistService.getWatchlist().map((item) =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    WatchlistService.saveWatchlist(list);
    return list;
  }

  static setPriceAlert(id: string, upper?: number, lower?: number): WatchlistItem[] {
    const list = WatchlistService.getWatchlist().map((item) => {
      if (item.id === id) {
        NotificationsService.addNotification(
          "price",
          `Price Alert set for ${item.symbol}`,
          `You will be notified when ${item.symbol} hits $${upper || lower}`,
          "/watchlist"
        );
        return { ...item, alertPriceUpper: upper, alertPriceLower: lower };
      }
      return item;
    });
    WatchlistService.saveWatchlist(list);
    return list;
  }

  /**
   * Generate realistic historical price chart points for a token across different timeframe windows
   */
  static getPriceChartHistory(symbol: string, timeframe: "24H" | "7D" | "30D" | "1Y"): PricePoint[] {
    const basePriceMap: Record<string, number> = {
      BTC: 64200,
      ETH: 3350,
      SOL: 148.5,
      ARB: 0.84,
      FLZ: 0.24,
      LINK: 14.2,
      USDC: 1.0,
    };

    const base = basePriceMap[symbol] || 100;
    const pointsCount = timeframe === "24H" ? 24 : timeframe === "7D" ? 28 : timeframe === "30D" ? 30 : 52;

    const points: PricePoint[] = [];
    let currentPrice = base * (timeframe === "24H" ? 0.97 : timeframe === "7D" ? 0.92 : 0.85);

    for (let i = 0; i < pointsCount; i++) {
      const volatility = base * 0.015;
      const change = (Math.random() - 0.48) * volatility;
      currentPrice = Math.max(0.01, currentPrice + change);

      let label = "";
      if (timeframe === "24H") {
        label = `${i}:00`;
      } else if (timeframe === "7D") {
        label = `Day ${Math.floor(i / 4) + 1}`;
      } else if (timeframe === "30D") {
        label = `Day ${i + 1}`;
      } else {
        label = `Wk ${i + 1}`;
      }

      points.push({
        timestamp: label,
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(base * 1000 * (1 + Math.random())),
      });
    }

    // Force last point to match current live price
    if (points.length > 0) {
      points[points.length - 1].price = base;
    }

    return points;
  }
}
