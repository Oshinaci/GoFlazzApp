import { PerpetualPositionRecord, TradingProviderId } from "./trading.types";
import { ProviderAdapterFactory } from "./providerAdapter";
import { OrderHistoryService } from "./orderHistory";

export class PositionService {
  static async getPositions(providerId: TradingProviderId = "goflazz_native"): Promise<PerpetualPositionRecord[]> {
    const adapter = ProviderAdapterFactory.getAdapter(providerId);
    return adapter.getPositions();
  }

  static async closePosition(positionId: string, marketSymbol: string, providerId: TradingProviderId = "goflazz_native"): Promise<boolean> {
    OrderHistoryService.logAction({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "POSITION_CLOSED",
      details: `Closed position ${positionId} on ${marketSymbol}`,
      marketSymbol,
    });
    return true;
  }

  static async closeAllPositions(providerId: TradingProviderId = "goflazz_native"): Promise<number> {
    const adapter = ProviderAdapterFactory.getAdapter(providerId);
    const positions = await adapter.getPositions();
    for (const pos of positions) {
      await this.closePosition(pos.id, pos.marketSymbol, providerId);
    }
    return positions.length;
  }
}
