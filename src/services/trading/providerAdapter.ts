import {
  ITradingProviderAdapter,
  TradingProviderId,
  TradingOrderIntent,
  TradingOrderRecord,
  PerpetualPositionRecord,
} from "./trading.types";

export class GoFlazzNativeAdapter implements ITradingProviderAdapter {
  providerId: TradingProviderId = "goflazz_native";

  private orders: TradingOrderRecord[] = [];
  private positions: PerpetualPositionRecord[] = [];

  async submitOrder(intent: TradingOrderIntent): Promise<TradingOrderRecord> {
    const newOrder: TradingOrderRecord = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      clientOrderId: `cl-${Date.now()}`,
      marketSymbol: intent.marketSymbol,
      side: intent.side,
      orderType: intent.orderType,
      status: intent.orderType === "market" ? "filled" : "accepted",
      marginMode: intent.marginMode,
      leverage: intent.leverage,
      size: intent.size,
      filledSize: intent.orderType === "market" ? intent.size : 0,
      price: intent.price,
      triggerPrice: intent.triggerPrice,
      averageFillPrice: intent.orderType === "market" ? intent.price || 67250 : undefined,
      feePaid: intent.size * (intent.price || 67250) * 0.0005,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reduceOnly: intent.reduceOnly || false,
      postOnly: intent.postOnly || false,
      providerId: this.providerId,
    };

    this.orders.unshift(newOrder);

    // If market order, also update or create simulated position
    if (newOrder.status === "filled") {
      const existingPosIndex = this.positions.findIndex((p) => p.marketSymbol === intent.marketSymbol);
      const entryPrice = newOrder.averageFillPrice || 67250;
      const margin = (intent.size * entryPrice) / intent.leverage;

      if (existingPosIndex >= 0) {
        const p = this.positions[existingPosIndex];
        const newSize = p.side === intent.side ? p.size + intent.size : Math.abs(p.size - intent.size);
        if (newSize === 0) {
          this.positions.splice(existingPosIndex, 1);
        } else {
          p.size = newSize;
          p.entryPrice = entryPrice;
          p.margin += margin;
        }
      } else {
        this.positions.push({
          id: `pos-${Date.now()}`,
          marketSymbol: intent.marketSymbol,
          side: intent.side,
          size: intent.size,
          entryPrice,
          markPrice: entryPrice,
          leverage: intent.leverage,
          marginMode: intent.marginMode,
          margin,
          liquidationPrice: intent.side === "long" ? entryPrice * 0.9 : entryPrice * 1.1,
          unrealizedPnl: 0,
          realizedPnl: 0,
          roe: 0,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return newOrder;
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.find((o) => o.id === orderId);
    if (order && order.status === "accepted") {
      order.status = "cancelled";
      order.updatedAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  async getPositions(): Promise<PerpetualPositionRecord[]> {
    return this.positions;
  }

  async getOpenOrders(): Promise<TradingOrderRecord[]> {
    return this.orders.filter((o) => o.status === "accepted" || o.status === "partially_filled");
  }
}

export class HyperliquidAdapter implements ITradingProviderAdapter {
  providerId: TradingProviderId = "hyperliquid";
  private native = new GoFlazzNativeAdapter();

  async submitOrder(intent: TradingOrderIntent): Promise<TradingOrderRecord> {
    const res = await this.native.submitOrder(intent);
    res.providerId = this.providerId;
    return res;
  }
  async cancelOrder(orderId: string): Promise<boolean> {
    return this.native.cancelOrder(orderId);
  }
  async getPositions(): Promise<PerpetualPositionRecord[]> {
    return this.native.getPositions();
  }
  async getOpenOrders(): Promise<TradingOrderRecord[]> {
    return this.native.getOpenOrders();
  }
}

export class VertexAdapter implements ITradingProviderAdapter {
  providerId: TradingProviderId = "vertex";
  private native = new GoFlazzNativeAdapter();

  async submitOrder(intent: TradingOrderIntent): Promise<TradingOrderRecord> {
    const res = await this.native.submitOrder(intent);
    res.providerId = this.providerId;
    return res;
  }
  async cancelOrder(orderId: string): Promise<boolean> {
    return this.native.cancelOrder(orderId);
  }
  async getPositions(): Promise<PerpetualPositionRecord[]> {
    return this.native.getPositions();
  }
  async getOpenOrders(): Promise<TradingOrderRecord[]> {
    return this.native.getOpenOrders();
  }
}

export class SynFuturesAdapter implements ITradingProviderAdapter {
  providerId: TradingProviderId = "synfutures";
  private native = new GoFlazzNativeAdapter();

  async submitOrder(intent: TradingOrderIntent): Promise<TradingOrderRecord> {
    const res = await this.native.submitOrder(intent);
    res.providerId = this.providerId;
    return res;
  }
  async cancelOrder(orderId: string): Promise<boolean> {
    return this.native.cancelOrder(orderId);
  }
  async getPositions(): Promise<PerpetualPositionRecord[]> {
    return this.native.getPositions();
  }
  async getOpenOrders(): Promise<TradingOrderRecord[]> {
    return this.native.getOpenOrders();
  }
}

export class OrderlyAdapter implements ITradingProviderAdapter {
  providerId: TradingProviderId = "orderly";
  private native = new GoFlazzNativeAdapter();

  async submitOrder(intent: TradingOrderIntent): Promise<TradingOrderRecord> {
    const res = await this.native.submitOrder(intent);
    res.providerId = this.providerId;
    return res;
  }
  async cancelOrder(orderId: string): Promise<boolean> {
    return this.native.cancelOrder(orderId);
  }
  async getPositions(): Promise<PerpetualPositionRecord[]> {
    return this.native.getPositions();
  }
  async getOpenOrders(): Promise<TradingOrderRecord[]> {
    return this.native.getOpenOrders();
  }
}

export class ProviderAdapterFactory {
  static getAdapter(providerId: TradingProviderId = "goflazz_native"): ITradingProviderAdapter {
    switch (providerId) {
      case "hyperliquid":
        return new HyperliquidAdapter();
      case "vertex":
        return new VertexAdapter();
      case "synfutures":
        return new SynFuturesAdapter();
      case "orderly":
        return new OrderlyAdapter();
      case "goflazz_native":
      default:
        return new GoFlazzNativeAdapter();
    }
  }
}
