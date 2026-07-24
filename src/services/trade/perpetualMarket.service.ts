import { PerpetualMarket } from "./perpetual.types";

export class PerpetualMarketService {
  private static markets: PerpetualMarket[] = [
    {
      id: "btc-perp",
      symbol: "BTC-PERP",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      markPrice: 67250.00,
      indexPrice: 67240.00,
      fundingRate: 0.00012,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$1.48B",
      volume24h: "$5.2B",
      high24h: 68150.00,
      low24h: 65900.00,
      change24h: 1.92,
      maxLeverage: 100,
      category: "crypto",
      sparkline: [66000, 66300, 65900, 66800, 67100, 66900, 67400, 67250],
    },
    {
      id: "eth-perp",
      symbol: "ETH-PERP",
      baseAsset: "ETH",
      quoteAsset: "USDT",
      markPrice: 3465.50,
      indexPrice: 3464.20,
      fundingRate: 0.00010,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$890M",
      volume24h: "$3.1B",
      high24h: 3540.00,
      low24h: 3380.00,
      change24h: 3.15,
      maxLeverage: 100,
      category: "crypto",
      sparkline: [3350, 3390, 3420, 3410, 3450, 3465.5],
    },
    {
      id: "sol-perp",
      symbol: "SOL-PERP",
      baseAsset: "SOL",
      quoteAsset: "USDT",
      markPrice: 178.40,
      indexPrice: 178.25,
      fundingRate: 0.00025,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$420M",
      volume24h: "$1.8B",
      high24h: 184.50,
      low24h: 171.20,
      change24h: 5.40,
      maxLeverage: 50,
      category: "layer1",
      sparkline: [168, 172, 175, 174, 178.4],
    },
    {
      id: "arb-perp",
      symbol: "ARB-PERP",
      baseAsset: "ARB",
      quoteAsset: "USDT",
      markPrice: 0.845,
      indexPrice: 0.844,
      fundingRate: 0.00008,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$110M",
      volume24h: "$450M",
      high24h: 0.880,
      low24h: 0.820,
      change24h: -0.85,
      maxLeverage: 50,
      category: "layer1",
      sparkline: [0.85, 0.86, 0.84, 0.845],
    },
    {
      id: "op-perp",
      symbol: "OP-PERP",
      baseAsset: "OP",
      quoteAsset: "USDT",
      markPrice: 1.92,
      indexPrice: 1.91,
      fundingRate: 0.00015,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$95M",
      volume24h: "$380M",
      high24h: 2.02,
      low24h: 1.85,
      change24h: 2.10,
      maxLeverage: 50,
      category: "layer1",
      sparkline: [1.86, 1.89, 1.90, 1.92],
    },
    {
      id: "bnb-perp",
      symbol: "BNB-PERP",
      baseAsset: "BNB",
      quoteAsset: "USDT",
      markPrice: 585.20,
      indexPrice: 585.00,
      fundingRate: 0.00010,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$310M",
      volume24h: "$920M",
      high24h: 595.00,
      low24h: 578.00,
      change24h: 0.65,
      maxLeverage: 50,
      category: "defi",
      sparkline: [580, 582, 581, 585.2],
    },
    {
      id: "xrp-perp",
      symbol: "XRP-PERP",
      baseAsset: "XRP",
      quoteAsset: "USDT",
      markPrice: 0.562,
      indexPrice: 0.561,
      fundingRate: 0.00005,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$240M",
      volume24h: "$710M",
      high24h: 0.585,
      low24h: 0.550,
      change24h: 1.45,
      maxLeverage: 50,
      category: "crypto",
      sparkline: [0.55, 0.558, 0.56, 0.562],
    },
    {
      id: "doge-perp",
      symbol: "DOGE-PERP",
      baseAsset: "DOGE",
      quoteAsset: "USDT",
      markPrice: 0.134,
      indexPrice: 0.133,
      fundingRate: 0.00030,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$380M",
      volume24h: "$1.4B",
      high24h: 0.142,
      low24h: 0.128,
      change24h: 7.20,
      maxLeverage: 50,
      category: "meme",
      sparkline: [0.122, 0.128, 0.131, 0.134],
    },
    {
      id: "pepe-perp",
      symbol: "PEPE-PERP",
      baseAsset: "PEPE",
      quoteAsset: "USDT",
      markPrice: 0.0000124,
      indexPrice: 0.0000123,
      fundingRate: 0.00045,
      nextFundingCountdownSeconds: 14200,
      openInterest: "$290M",
      volume24h: "$1.1B",
      high24h: 0.0000132,
      low24h: 0.0000118,
      change24h: 9.40,
      maxLeverage: 20,
      category: "meme",
      sparkline: [0.0000112, 0.0000119, 0.0000121, 0.0000124],
    },
  ];

  static getMarkets(): PerpetualMarket[] {
    return this.markets;
  }

  static getMarket(symbol: string): PerpetualMarket | undefined {
    return this.markets.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase() || m.id.toLowerCase() === symbol.toLowerCase());
  }

  static searchMarkets(query: string, category: string = "all", filter: string = "all"): PerpetualMarket[] {
    return this.markets.filter((m) => {
      const matchesQuery =
        !query ||
        m.symbol.toLowerCase().includes(query.toLowerCase()) ||
        m.baseAsset.toLowerCase().includes(query.toLowerCase());

      const matchesCategory =
        category === "all" ||
        (category === "trending" && (m.change24h > 5 || m.category === "meme")) ||
        m.category === category;

      return matchesQuery && matchesCategory;
    });
  }
}
