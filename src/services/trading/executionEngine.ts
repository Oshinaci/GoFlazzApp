import {
  TradingOrderIntent,
  TradingOrderRecord,
  TradingProviderId,
  OrderPreviewResult,
} from "./trading.types";
import { OrderValidator, ValidationContext } from "./orderValidator";
import { ProviderAdapterFactory } from "./providerAdapter";
import { OrderHistoryService } from "./orderHistory";

export class ExecutionEngine {
  static async executeOrder(
    intent: TradingOrderIntent,
    context: ValidationContext,
    providerId: TradingProviderId = "goflazz_native"
  ): Promise<{ success: boolean; order?: TradingOrderRecord; error?: string; preview: OrderPreviewResult }> {
    // 1. Validate & Preview
    const preview = OrderValidator.validate(intent, context);

    OrderHistoryService.logAction({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: "ORDER_CREATED",
      details: `Created ${intent.side.toUpperCase()} ${intent.orderType.toUpperCase()} intent for ${intent.marketSymbol}`,
      marketSymbol: intent.marketSymbol,
    });

    if (!preview.isValid) {
      OrderHistoryService.logAction({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "ORDER_FAILED",
        details: `Validation failed: ${preview.errors.join("; ")}`,
        marketSymbol: intent.marketSymbol,
      });

      return {
        success: false,
        error: preview.errors[0] || "Order validation failed.",
        preview,
      };
    }

    try {
      OrderHistoryService.logAction({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "ORDER_SUBMITTED",
        details: `Submitting order via provider adapter [${providerId}]`,
        marketSymbol: intent.marketSymbol,
      });

      const adapter = ProviderAdapterFactory.getAdapter(providerId);

      // Simulate network latency / exchange check
      await new Promise((resolve) => setTimeout(resolve, 300));

      const orderRecord = await adapter.submitOrder(intent);

      OrderHistoryService.logAction({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: orderRecord.status === "filled" ? "ORDER_FILLED" : "ORDER_ACCEPTED",
        details: `Order ${orderRecord.id} successfully processed with status: ${orderRecord.status}`,
        marketSymbol: intent.marketSymbol,
        orderId: orderRecord.id,
      });

      return {
        success: true,
        order: orderRecord,
        preview,
      };
    } catch (err: any) {
      const errMsg = err.message || "Exchange communication failure or provider timeout.";
      OrderHistoryService.logAction({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: "ORDER_FAILED",
        details: `Execution exception: ${errMsg}`,
        marketSymbol: intent.marketSymbol,
      });

      return {
        success: false,
        error: errMsg,
        preview,
      };
    }
  }
}
