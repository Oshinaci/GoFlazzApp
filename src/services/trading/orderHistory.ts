import { TradingAuditLog } from "./trading.types";

export class OrderHistoryService {
  private static logs: TradingAuditLog[] = [
    {
      id: "log-init",
      timestamp: new Date().toISOString(),
      action: "ORDER_ACCEPTED",
      details: "Perpetual Execution Engine initialized successfully with multi-provider abstraction.",
      marketSymbol: "BTC-PERP",
    },
  ];

  static logAction(log: TradingAuditLog): void {
    this.logs.unshift(log);
    if (this.logs.length > 100) {
      this.logs.pop();
    }
  }

  static getLogs(): TradingAuditLog[] {
    return this.logs;
  }
}
