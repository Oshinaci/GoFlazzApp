import { TransactionReview } from "./transaction.types";

export class ReviewGenerator {
  static formatSummary(review: TransactionReview): string {
    return `Prepared ${review.intent.assetSymbol} Transfer: ${review.intent.amount} ${review.intent.assetSymbol} to ${review.intent.recipientAddress.slice(0, 6)}...${review.intent.recipientAddress.slice(-4)} on ${review.intent.networkName}. Est. Fee: $${review.feeEstimate.estimatedFeeUsd.toFixed(4)}. 100% Read-Only Simulation.`;
  }
}
