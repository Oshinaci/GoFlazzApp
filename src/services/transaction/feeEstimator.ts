import { FeeEstimateResult } from "./transaction.types";

export class FeeEstimator {
  static estimate(networkId: string = "arbitrum"): FeeEstimateResult {
    // Arbitrum One L2 gas fee simulation
    const gasLimit = "21000";
    const gasPriceGwei = "0.1";
    const estimatedFeeNative = "0.0000021";
    const estimatedFeeUsd = 0.0068;

    return {
      gasLimit,
      gasPriceGwei,
      estimatedFeeNative,
      estimatedFeeUsd,
      nativeSymbol: "ETH",
    };
  }
}
