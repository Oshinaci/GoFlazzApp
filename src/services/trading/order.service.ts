import { TradingOrderRecord, TradingProviderId } from "./trading.types";
import { ProviderAdapterFactory } from "./providerAdapter";
import { OrderHistoryService } from "./orderHistory";

export class OrderService {
  static async getOpenOrders(providerId: TradingProviderId = "goflazz_native"): Promise<TradingOrderRecord[]> {
    const adapter = ProviderAdapterFactory.getAdapter(providerId);
    return adapter.getOpenOrders();
  }

  static async cancelOrder(orderId: string, providerId: TradingProviderId = "goflazz_native"): Promise<boolean> {
    const adapter = ProviderAdapterFactory.getAdapter(providerId);
    const success = await adapter.cancelOrder(orderId);
    if (success) {
      OrderHistoryService.logAction({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "ORDER_CANCELLED",
        details: `Cancelled order ${orderId}`,
        marketSymbol: "ALL",
        orderId,
      });
    }
    return success;
  }

  static async cancelAllOrders(providerId: TradingProviderId = "goflazz_native"): Promise<number> {
    const adapter = ProviderAdapterFactory.getAdapter(providerId);
    const openOrders = await adapter.getOpenOrders();
    let count = 0;
    for (const ord of openOrders) {
      const ok = await adapter.cancelOrder(ord.id);
      if (ok) count++;
    }
    return count;
  }
}
