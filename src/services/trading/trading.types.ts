export type MarginMode = "cross" | "isolated";
export type OrderType = "market" | "limit" | "stop_market" | "stop_limit";
export type PositionSide = "long" | "short";
export type TimeInForce = "GTC" | "IOC" | "FOK";

export type OrderStatus =
  | "preparing"
  | "pending"
  | "accepted"
  | "partially_filled"
  | "filled"
  | "cancelled"
  | "expired"
  | "rejected"
  | "failed";

export type TradingProviderId = "goflazz_native" | "hyperliquid" | "vertex" | "synfutures" | "orderly";

export interface TradingOrderIntent {
  marketSymbol: string;
  side: PositionSide;
  orderType: OrderType;
  marginMode: MarginMode;
  leverage: number;
  size: number;
  price?: number;
  triggerPrice?: number;
  timeInForce?: TimeInForce;
  reduceOnly?: boolean;
  postOnly?: boolean;
  takeProfit?: number;
  stopLoss?: number;
}

export interface OrderPreviewResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedFillPrice: number;
  estimatedFee: number;
  estimatedLiquidationPrice: number;
  marginRequired: number;
  leverage: number;
  riskScore: number; // 0 - 100
  fundingRate: number;
}

export interface TradingOrderRecord {
  id: string;
  clientOrderId: string;
  marketSymbol: string;
  side: PositionSide;
  orderType: OrderType;
  status: OrderStatus;
  marginMode: MarginMode;
  leverage: number;
  size: number;
  filledSize: number;
  price?: number;
  triggerPrice?: number;
  averageFillPrice?: number;
  feePaid: number;
  createdAt: string;
  updatedAt: string;
  reduceOnly: boolean;
  postOnly: boolean;
  providerId: TradingProviderId;
  errorMessage?: string;
}

export interface PerpetualPositionRecord {
  id: string;
  marketSymbol: string;
  side: PositionSide;
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  marginMode: MarginMode;
  margin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  roe: number;
  updatedAt: string;
}

export interface TradingAuditLog {
  id: string;
  timestamp: string;
  action:
    | "ORDER_CREATED"
    | "ORDER_SUBMITTED"
    | "ORDER_ACCEPTED"
    | "ORDER_FILLED"
    | "ORDER_CANCELLED"
    | "ORDER_MODIFIED"
    | "ORDER_FAILED"
    | "POSITION_INCREASED"
    | "POSITION_REDUCED"
    | "POSITION_CLOSED";
  details: string;
  marketSymbol: string;
  orderId?: string;
}

export interface ITradingProviderAdapter {
  providerId: TradingProviderId;
  submitOrder(intent: TradingOrderIntent): Promise<TradingOrderRecord>;
  cancelOrder(orderId: string): Promise<boolean>;
  getPositions(): Promise<PerpetualPositionRecord[]>;
  getOpenOrders(): Promise<TradingOrderRecord[]>;
}
