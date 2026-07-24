export type MarginMode = "cross" | "isolated";
export type OrderType = "market" | "limit" | "stop_market" | "stop_limit";
export type PositionSide = "long" | "short";

export interface PerpetualMarket {
  id: string;
  symbol: string; // e.g. "BTC-PERP"
  baseAsset: string;
  quoteAsset: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number; // e.g. 0.0001 (0.01% / 8h)
  nextFundingCountdownSeconds: number;
  openInterest: string;
  volume24h: string;
  high24h: number;
  low24h: number;
  change24h: number;
  maxLeverage: number;
  category: "crypto" | "layer1" | "defi" | "meme" | "trending";
  sparkline: number[];
}

export interface PerpetualPosition {
  id: string;
  marketSymbol: string;
  side: PositionSide;
  size: number; // e.g. 0.5 BTC
  entryPrice: number;
  markPrice: number;
  leverage: number;
  marginMode: MarginMode;
  margin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  roe: number;
}

export interface PerpetualOrder {
  id: string;
  marketSymbol: string;
  side: PositionSide;
  orderType: OrderType;
  price?: number;
  triggerPrice?: number;
  size: number;
  leverage: number;
  marginMode: MarginMode;
  status: "pending" | "filled" | "cancelled" | "triggered";
  createdAt: string;
  reduceOnly: boolean;
  postOnly: boolean;
  takeProfit?: number;
  stopLoss?: number;
}

export interface TradingAccountSummary {
  totalBalance: number;
  unrealizedPnl: number;
  todayPnl: number;
  todayPnlPercent: number;
  availableMargin: number;
  initialMarginUsed: number;
  maintenanceMargin: number;
  marginUsageRatio: number; // e.g. 0.24 (24%)
}

export interface TradingPerformanceStats {
  dailyPnl: number;
  weeklyPnl: number;
  winRate: number; // e.g. 68.4%
  averageReturn: number; // e.g. +4.2%
  largestWin: number;
  largestLoss: number;
  totalTrades: number;
  profitableTrades: number;
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  pnl: number;
  roi: number;
  winRate: number;
}
