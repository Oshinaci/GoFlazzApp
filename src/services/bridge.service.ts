import { NotificationsService } from "./notifications.service";

export interface ChainOption {
  id: string;
  name: string;
  symbol: string;
  logo: string;
  color: string;
  chainId: number;
}

export interface BridgeProvider {
  id: string;
  name: string;
  logo: string;
  estimatedTimeMins: number;
  bridgeFeeUsd: number;
  gasFeeUsd: number;
  isFastest: boolean;
  isCheapest: boolean;
}

export interface BridgeQuoteRequest {
  fromChain: ChainOption;
  toChain: ChainOption;
  assetSymbol: string;
  amount: number;
}

export interface BridgeStepStatus {
  step: number;
  label: string;
  status: "pending" | "processing" | "completed" | "failed";
  time?: string;
}

export interface BridgeExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  fromChain: string;
  toChain: string;
  amount: number;
  assetSymbol: string;
  provider: string;
}

export const SUPPORTED_BRIDGE_CHAINS: ChainOption[] = [
  { id: "ethereum", name: "Ethereum Mainnet", symbol: "ETH", logo: "⟠", color: "#627EEA", chainId: 1 },
  { id: "arbitrum", name: "Arbitrum One", symbol: "ARB", logo: "🔵", color: "#28A0F0", chainId: 42161 },
  { id: "polygon", name: "Polygon POS", symbol: "MATIC", logo: "💜", color: "#8247E5", chainId: 137 },
  { id: "optimism", name: "Optimism", symbol: "OP", logo: "🔴", color: "#FF0420", chainId: 10 },
  { id: "base", name: "Base", symbol: "BASE", logo: "🟦", color: "#0052FF", chainId: 8453 },
  { id: "bsc", name: "BNB Smart Chain", symbol: "BNB", logo: "🟡", color: "#F3BA2F", chainId: 56 },
];

export class BridgeService {
  /**
   * Get comparative bridge provider quotes (Hop, Stargate, Synapse, Across)
   */
  static getBridgeProviders(req: BridgeQuoteRequest): BridgeProvider[] {
    const { amount } = req;
    if (!amount || amount <= 0) return [];

    const providers: BridgeProvider[] = [
      {
        id: "across",
        name: "Across Protocol",
        logo: "⚡",
        estimatedTimeMins: 2,
        bridgeFeeUsd: 1.2,
        gasFeeUsd: 2.1,
        isFastest: true,
        isCheapest: false,
      },
      {
        id: "stargate",
        name: "Stargate Finance",
        logo: "⭐",
        estimatedTimeMins: 5,
        bridgeFeeUsd: 0.8,
        gasFeeUsd: 1.5,
        isFastest: false,
        isCheapest: true,
      },
      {
        id: "hop",
        name: "Hop Protocol",
        logo: "🐇",
        estimatedTimeMins: 4,
        bridgeFeeUsd: 1.5,
        gasFeeUsd: 2.4,
        isFastest: false,
        isCheapest: false,
      },
      {
        id: "synapse",
        name: "Synapse Bridge",
        logo: "🧬",
        estimatedTimeMins: 6,
        bridgeFeeUsd: 1.1,
        gasFeeUsd: 1.9,
        isFastest: false,
        isCheapest: false,
      },
    ];

    return providers;
  }

  /**
   * Execute cross-chain bridge request
   */
  static async executeBridge(
    req: BridgeQuoteRequest,
    provider: BridgeProvider
  ): Promise<BridgeExecutionResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const randomHex = Math.random().toString(16).substring(2, 10);
        const txHash = `0x${randomHex}${Math.random().toString(16).substring(2, 34)}`;

        NotificationsService.addNotification(
          "transaction",
          `Bridged ${req.amount} ${req.assetSymbol} (${req.fromChain.name} ➔ ${req.toChain.name})`,
          `Relayed via ${provider.name}. Arrival in ~${provider.estimatedTimeMins} mins. (Tx: ${txHash.slice(0, 8)}...)`,
          "/activity"
        );

        resolve({
          success: true,
          txHash,
          fromChain: req.fromChain.name,
          toChain: req.toChain.name,
          amount: req.amount,
          assetSymbol: req.assetSymbol,
          provider: provider.name,
        });
      }, 2000);
    });
  }
}
