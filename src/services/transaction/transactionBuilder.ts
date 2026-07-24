import { TransactionIntent, TransactionReview } from "./transaction.types";
import { FeeEstimator } from "./feeEstimator";

export class TransactionBuilder {
  static buildReview(intent: TransactionIntent, assetPriceUsd: number = 3250.40): TransactionReview {
    const feeEstimate = FeeEstimator.estimate(intent.networkName);

    const assetValueUsd = intent.amount * assetPriceUsd;
    const totalUsdCost = assetValueUsd + feeEstimate.estimatedFeeUsd;

    const totalNativeCost = intent.assetSymbol.toUpperCase() === "ETH"
      ? (intent.amount + parseFloat(feeEstimate.estimatedFeeNative)).toFixed(6) + " ETH"
      : `${intent.amount} ${intent.assetSymbol} + ${feeEstimate.estimatedFeeNative} ETH fee`;

    const warnings: string[] = [];
    if (intent.assetSymbol.toUpperCase() !== "ETH") {
      warnings.push("Ensure your wallet has sufficient ETH for Arbitrum network gas fees.");
    }
    if (intent.amount > 1000) {
      warnings.push("Large transfer amount detected. Please double-check recipient address.");
    }

    return {
      intent,
      feeEstimate,
      totalNativeCost,
      totalUsdCost,
      warnings,
      isSimulationPassed: true,
      preparedAt: new Date().toISOString(),
    };
  }
}
