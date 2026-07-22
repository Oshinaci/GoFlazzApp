export interface NetworkGasInfo {
  chainId: string;
  chainName: string;
  lowGwei: number;
  standardGwei: number;
  fastGwei: number;
  instantGwei: number;
  baseFeeGwei: number;
  priorityFeeGwei: number;
  updatedAt: string;
}

export interface EstimatedActionFee {
  action: string;
  label: string;
  gasLimit: number;
  feeEth: number;
  feeUsd: number;
}

export interface GasAlertSetting {
  id: string;
  chainId: string;
  targetGwei: number;
  enabled: boolean;
}

export const MOCK_GAS_DATA: Record<string, NetworkGasInfo> = {
  ethereum: {
    chainId: "1",
    chainName: "Ethereum Mainnet",
    lowGwei: 12,
    standardGwei: 16,
    fastGwei: 22,
    instantGwei: 28,
    baseFeeGwei: 14.2,
    priorityFeeGwei: 1.8,
    updatedAt: "Just now",
  },
  arbitrum: {
    chainId: "42161",
    chainName: "Arbitrum One",
    lowGwei: 0.1,
    standardGwei: 0.12,
    fastGwei: 0.15,
    instantGwei: 0.2,
    baseFeeGwei: 0.08,
    priorityFeeGwei: 0.04,
    updatedAt: "Just now",
  },
  polygon: {
    chainId: "137",
    chainName: "Polygon POS",
    lowGwei: 32,
    standardGwei: 45,
    fastGwei: 60,
    instantGwei: 80,
    baseFeeGwei: 38,
    priorityFeeGwei: 7,
    updatedAt: "Just now",
  },
  base: {
    chainId: "8453",
    chainName: "Base",
    lowGwei: 0.005,
    standardGwei: 0.008,
    fastGwei: 0.012,
    instantGwei: 0.02,
    baseFeeGwei: 0.006,
    priorityFeeGwei: 0.002,
    updatedAt: "Just now",
  },
  optimism: {
    chainId: "10",
    chainName: "Optimism",
    lowGwei: 0.004,
    standardGwei: 0.007,
    fastGwei: 0.01,
    instantGwei: 0.015,
    baseFeeGwei: 0.005,
    priorityFeeGwei: 0.002,
    updatedAt: "Just now",
  },
};

export class GasService {
  /**
   * Get current gas prices for a given chain or all chains
   */
  static getGasInfo(chainId: string = "ethereum"): NetworkGasInfo {
    return MOCK_GAS_DATA[chainId] || MOCK_GAS_DATA.ethereum;
  }

  /**
   * Get estimated fee breakdown for standard wallet operations
   */
  static getEstimatedFees(standardGwei: number, ethPriceUsd: number = 3350): EstimatedActionFee[] {
    const gweiToEth = (gwei: number, limit: number) => (gwei * 1e-9) * limit;

    const actions = [
      { action: "eth_transfer", label: "ETH Transfer", gasLimit: 21000 },
      { action: "token_transfer", label: "ERC-20 Transfer", gasLimit: 65000 },
      { action: "swap", label: "DEX Swap (Uniswap)", gasLimit: 150000 },
      { action: "bridge", label: "Cross-Chain Bridge", gasLimit: 220000 },
      { action: "nft_mint", label: "NFT Mint", gasLimit: 120000 },
    ];

    return actions.map((item) => {
      const feeEth = gweiToEth(standardGwei, item.gasLimit);
      const feeUsd = feeEth * ethPriceUsd;
      return {
        action: item.action,
        label: item.label,
        gasLimit: item.gasLimit,
        feeEth: parseFloat(feeEth.toFixed(6)),
        feeUsd: parseFloat(feeUsd.toFixed(2)),
      };
    });
  }

  /**
   * Get historical gas trend (Gwei over time)
   */
  static getGasHistory(): { time: string; gwei: number }[] {
    return [
      { time: "00:00", gwei: 28 },
      { time: "04:00", gwei: 19 },
      { time: "08:00", gwei: 35 },
      { time: "12:00", gwei: 42 },
      { time: "16:00", gwei: 24 },
      { time: "20:00", gwei: 16 },
      { time: "Now", gwei: 18 },
    ];
  }
}
