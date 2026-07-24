import { PnLRecord } from "./risk.types";

export class PnLService {
  static calculatePositionPnL(
    side: "long" | "short",
    entryPrice: number,
    markPrice: number,
    size: number,
    margin: number,
    leverage: number
  ): { unrealizedPnl: number; roe: number; roi: number } {
    const priceDiff = side === "long" ? markPrice - entryPrice : entryPrice - markPrice;
    const unrealizedPnl = priceDiff * size;
    const roe = margin > 0 ? (unrealizedPnl / margin) * 100 : 0;
    const totalNotional = entryPrice * size;
    const roi = totalNotional > 0 ? (unrealizedPnl / totalNotional) * 100 : 0;

    return {
      unrealizedPnl,
      roe,
      roi,
    };
  }

  static getMockPnLSummary(): PnLRecord {
    return {
      realizedPnl: 1420.50,
      unrealizedPnl: 345.80,
      dailyPnl: 480.20,
      weeklyPnl: 1890.10,
      monthlyPnl: 5420.00,
      roi: 18.4,
      roe: 145.2,
      averageEntryPrice: 66850.0,
      averageExitPrice: 67420.0,
    };
  }
}
