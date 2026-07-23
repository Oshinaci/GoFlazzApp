/**
 * Enterprise Fee Estimator for GoFlazz
 * Calculates network fee, USD conversion, max possible fee, and detailed fee breakdown.
 */
import { ethers } from "ethers";
import { ChainId } from "@/types/blockchain";
import { FeeBreakdown } from "@/types/transaction";
import { PriceService } from "@/services/price.service";
import { SUPPORTED_NETWORKS } from "@/lib/networks";

export class FeeEstimatorService {
  /**
   * Calculate exact fee breakdown for a transaction given gasLimit and fee data
   */
  static async calculateFeeBreakdown(
    chainId: ChainId,
    gasLimitStr: string,
    maxFeePerGasWeiStr: string,
    maxPriorityFeeWeiStr: string
  ): Promise<FeeBreakdown> {
    const netConfig = SUPPORTED_NETWORKS[chainId];
    const symbol = netConfig?.nativeCurrency?.symbol || "ETH";

    const gasLimit = BigInt(gasLimitStr || "21000");
    const maxFeePerGas = BigInt(maxFeePerGasWeiStr || "100000000"); // 0.1 gwei default
    const maxPriorityFee = BigInt(maxPriorityFeeWeiStr || "10000000");

    // Max Possible Fee = gasLimit * maxFeePerGas
    const maxPossibleFeeWei = gasLimit * maxFeePerGas;
    const maxPossibleFeeFormatted = ethers.formatEther(maxPossibleFeeWei);

    // Estimated Fee (assuming ~85% of maxFee is effective)
    const estimatedEffectiveGasPrice = (maxFeePerGas * BigInt(85)) / BigInt(100);
    const estimatedFeeWei = gasLimit * estimatedEffectiveGasPrice;
    const estimatedFeeFormatted = ethers.formatEther(estimatedFeeWei);

    // Fetch USD price for chain's native token
    const prices = await PriceService.fetchTokenPrices();
    const priceKey = chainId === 137 ? "polygon-ecosystem-token" : chainId === 56 ? "binancecoin" : chainId === 43114 ? "avalanche-2" : "ethereum";
    const nativePrice = prices[priceKey]?.price || 3250;

    const estimatedFeeUsd = parseFloat((parseFloat(estimatedFeeFormatted) * nativePrice).toFixed(4));
    const maxPossibleFeeUsd = parseFloat((parseFloat(maxPossibleFeeFormatted) * nativePrice).toFixed(4));

    return {
      gasLimit: gasLimitStr,
      effectiveGasPriceWei: estimatedEffectiveGasPrice.toString(),
      maxFeePerGasWei: maxFeePerGasWeiStr,
      maxPriorityFeeWei: maxPriorityFeeWeiStr,
      estimatedFeeWei: estimatedFeeWei.toString(),
      estimatedFeeFormatted: parseFloat(estimatedFeeFormatted).toFixed(6),
      estimatedFeeUsd,
      maxPossibleFeeWei: maxPossibleFeeWei.toString(),
      maxPossibleFeeFormatted: parseFloat(maxPossibleFeeFormatted).toFixed(6),
      maxPossibleFeeUsd,
      nativeSymbol: symbol,
    };
  }
}
