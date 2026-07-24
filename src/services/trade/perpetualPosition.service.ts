import { PerpetualPosition, PerpetualOrder, TradingAccountSummary } from "./perpetual.types";

export class PerpetualPositionService {
  private static positions: PerpetualPosition[] = [
    {
      id: "pos-1",
      marketSymbol: "BTC-PERP",
      side: "long",
      size: 0.75,
      entryPrice: 65800.00,
      markPrice: 67250.00,
      leverage: 20,
      marginMode: "cross",
      margin: 2467.50,
      liquidationPrice: 62800.00,
      unrealizedPnl: 1087.50,
      unrealizedPnlPercent: 44.07,
      roe: 881.40,
    },
    {
      id: "pos-2",
      marketSymbol: "ETH-PERP",
      side: "short",
      size: 8.0,
      entryPrice: 3510.00,
      markPrice: 3465.50,
      leverage: 10,
      marginMode: "isolated",
      margin: 2808.00,
      liquidationPrice: 3820.00,
      unrealizedPnl: 356.00,
      unrealizedPnlPercent: 12.68,
      roe: 126.78,
    },
    {
      id: "pos-3",
      marketSymbol: "SOL-PERP",
      side: "long",
      size: 45.0,
      entryPrice: 172.50,
      markPrice: 178.40,
      leverage: 25,
      marginMode: "cross",
      margin: 310.50,
      liquidationPrice: 165.20,
      unrealizedPnl: 265.50,
      unrealizedPnlPercent: 85.50,
      roe: 2137.50,
    },
  ];

  private static orders: PerpetualOrder[] = [
    {
      id: "ord-1",
      marketSymbol: "BTC-PERP",
      side: "long",
      orderType: "limit",
      price: 65000.00,
      size: 0.5,
      leverage: 10,
      marginMode: "cross",
      status: "pending",
      createdAt: "2026-07-23T14:20:00Z",
      reduceOnly: false,
      postOnly: true,
      takeProfit: 69000.00,
      stopLoss: 63500.00,
    },
    {
      id: "ord-2",
      marketSymbol: "ETH-PERP",
      side: "short",
      orderType: "stop_limit",
      price: 3400.00,
      triggerPrice: 3420.00,
      size: 5.0,
      leverage: 15,
      marginMode: "isolated",
      status: "pending",
      createdAt: "2026-07-23T16:45:00Z",
      reduceOnly: false,
      postOnly: false,
    },
    {
      id: "ord-3",
      marketSymbol: "SOL-PERP",
      side: "long",
      orderType: "limit",
      price: 165.00,
      size: 20.0,
      leverage: 10,
      marginMode: "cross",
      status: "filled",
      createdAt: "2026-07-22T10:15:00Z",
      reduceOnly: false,
      postOnly: false,
    },
  ];

  static getPositions(): PerpetualPosition[] {
    return this.positions;
  }

  static getOrders(): PerpetualOrder[] {
    return this.orders;
  }

  static getAccountSummary(): TradingAccountSummary {
    const unrealizedPnl = this.positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
    const totalMarginUsed = this.positions.reduce((acc, p) => acc + p.margin, 0);
    const baseBalance = 15420.50;
    const totalBalance = baseBalance + unrealizedPnl;
    const availableMargin = baseBalance - totalMarginUsed;

    return {
      totalBalance,
      unrealizedPnl,
      todayPnl: 1443.20,
      todayPnlPercent: 9.35,
      availableMargin: Math.max(0, availableMargin),
      initialMarginUsed: totalMarginUsed,
      maintenanceMargin: totalMarginUsed * 0.5,
      marginUsageRatio: totalMarginUsed / totalBalance,
    };
  }
}
