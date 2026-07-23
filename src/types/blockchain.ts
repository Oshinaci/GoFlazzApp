export type ChainId = 42161 | 1 | 8453 | 10 | 137 | 56 | 43114;

export interface NetworkConfig {
  chainId: ChainId;
  name: string;
  networkKey: string;
  rpcUrls: {
    primary: string;
    backup: string;
  };
  wsUrls?: string[];
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
    logoUrl?: string;
  };
  isTestnet: boolean;
  isDefault?: boolean;
}

export interface RpcHealthStatus {
  chainId: ChainId;
  rpcUrl: string;
  isHealthy: boolean;
  latencyMs: number;
  lastChecked: string;
  errorCount: number;
}

export interface GasPriceData {
  gasPrice: string; // in wei
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  baseFeePerGas?: string;
  estimatedTimeSeconds: number;
}

export interface TokenMetadata {
  contractAddress: string;
  chainId: ChainId;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  balance?: string;
  formattedBalance?: string;
}

export interface UnsignedTransactionRequest {
  to: string;
  value: string; // in wei
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  chainId: ChainId;
}

export interface BlockchainLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  category: 'rpc' | 'gas' | 'network' | 'tx_prep' | 'balance';
  message: string;
  metadata?: any;
}
