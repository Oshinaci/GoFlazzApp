/**
 * Enterprise Gas Engine for GoFlazz
 * Handles EIP-1559 / Legacy gas estimation, speed tiers (Slow, Standard, Fast),
 * gas limit buffers, and caching.
 */
import { ethers } from "ethers";
import { ChainId } from "@/types/blockchain";
import { GasEngineResult, GasRecommendationOption } from "@/types/transaction";
import { ProviderManager } from "@/providers/provider-manager";
import { blockchainCache } from "@/lib/blockchain-cache";
import { blockchainLogger } from "@/lib/blockchain-logger";

export class GasEngineService {
  /**
   * Fetch comprehensive gas recommendations (Slow, Standard, Fast) for a given chain and gasLimit
   */
  static async getGasRecommendations(chainId: ChainId, gasLimitEstimate = "21000"): Promise<GasEngineResult> {
    const cacheKey = `gas_recommendations_${chainId}_${gasLimitEstimate}`;
    const cached = blockchainCache.get<GasEngineResult>(cacheKey);
    if (cached) return cached;

    try {
      const provider = await ProviderManager.getProvider(chainId);
      const feeData = await provider.getFeeData();

      const latestBlock = await provider.getBlock("latest");
      const baseFee = latestBlock?.baseFeePerGas || feeData.gasPrice || ethers.parseUnits("0.1", "gwei");

      const baseFeeGwei = parseFloat(ethers.formatUnits(baseFee, "gwei"));

      // Standard priority fee (0.1 - 2.0 gwei depending on chain)
      const defaultPriorityFeeWei = feeData.maxPriorityFeePerGas || ethers.parseUnits("0.05", "gwei");

      // Calculate Tier Multipliers
      // Slow: 1.05x Base Fee + 0.8x Priority
      // Standard: 1.15x Base Fee + 1.0x Priority
      // Fast: 1.30x Base Fee + 1.5x Priority

      const slowBase = (baseFee * BigInt(105)) / BigInt(100);
      const slowPriority = (defaultPriorityFeeWei * BigInt(80)) / BigInt(100);
      const slowMaxFee = slowBase + slowPriority;

      const stdBase = (baseFee * BigInt(115)) / BigInt(100);
      const stdPriority = defaultPriorityFeeWei;
      const stdMaxFee = stdBase + stdPriority;

      const fastBase = (baseFee * BigInt(130)) / BigInt(100);
      const fastPriority = (defaultPriorityFeeWei * BigInt(150)) / BigInt(100);
      const fastMaxFee = fastBase + fastPriority;

      const slowOption: GasRecommendationOption = {
        speed: "slow",
        maxFeePerGas: slowMaxFee.toString(),
        maxPriorityFeePerGas: slowPriority.toString(),
        gasPrice: slowMaxFee.toString(),
        estimatedTimeSeconds: 30,
        formattedFeeGwei: parseFloat(ethers.formatUnits(slowMaxFee, "gwei")).toFixed(3),
      };

      const stdOption: GasRecommendationOption = {
        speed: "standard",
        maxFeePerGas: stdMaxFee.toString(),
        maxPriorityFeePerGas: stdPriority.toString(),
        gasPrice: stdMaxFee.toString(),
        estimatedTimeSeconds: 12,
        formattedFeeGwei: parseFloat(ethers.formatUnits(stdMaxFee, "gwei")).toFixed(3),
      };

      const fastOption: GasRecommendationOption = {
        speed: "fast",
        maxFeePerGas: fastMaxFee.toString(),
        maxPriorityFeePerGas: fastPriority.toString(),
        gasPrice: fastMaxFee.toString(),
        estimatedTimeSeconds: 5,
        formattedFeeGwei: parseFloat(ethers.formatUnits(fastMaxFee, "gwei")).toFixed(3),
      };

      const result: GasEngineResult = {
        gasLimit: gasLimitEstimate,
        baseFeePerGas: baseFee.toString(),
        slow: slowOption,
        standard: stdOption,
        fast: fastOption,
      };

      blockchainCache.set(cacheKey, result, 8000); // 8s TTL
      return result;
    } catch (err: any) {
      blockchainLogger.log("gas", "error", `Failed to estimate gas for chain ${chainId}`, err?.message);

      // Fallback defaults
      const fallbackFee = ethers.parseUnits("0.1", "gwei").toString();
      const fallbackOption: GasRecommendationOption = {
        speed: "standard",
        maxFeePerGas: fallbackFee,
        maxPriorityFeePerGas: ethers.parseUnits("0.01", "gwei").toString(),
        gasPrice: fallbackFee,
        estimatedTimeSeconds: 15,
        formattedFeeGwei: "0.100",
      };

      return {
        gasLimit: gasLimitEstimate,
        baseFeePerGas: fallbackFee,
        slow: { ...fallbackOption, speed: "slow", estimatedTimeSeconds: 30 },
        standard: fallbackOption,
        fast: { ...fallbackOption, speed: "fast", estimatedTimeSeconds: 5 },
      };
    }
  }

  /**
   * Apply safety buffer to estimated gas limit (default +20%)
   */
  static applyGasLimitBuffer(rawGasLimit: bigint, bufferPercent = 20): string {
    const buffered = (rawGasLimit * BigInt(100 + bufferPercent)) / BigInt(100);
    return buffered.toString();
  }
}
