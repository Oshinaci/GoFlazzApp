import { ChainId } from "./blockchain";

export type TransactionQueueStatus =
  | "pending"
  | "queued"
  | "preparing"
  | "ready"
  | "broadcasting"
  | "confirming"
  | "confirmed"
  | "failed"
  | "cancelled";

export type TransactionType =
  | "native_transfer"
  | "erc20_transfer"
  | "contract_interaction"
  | "token_approval"
  | "nft_transfer"
  | "bridge"
  | "swap";

export interface GasRecommendationOption {
  speed: "slow" | "standard" | "fast";
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasPrice: string;
  estimatedTimeSeconds: number;
  formattedFeeGwei: string;
}

export interface GasEngineResult {
  gasLimit: string;
  baseFeePerGas?: string;
  slow: GasRecommendationOption;
  standard: GasRecommendationOption;
  fast: GasRecommendationOption;
}

export interface FeeBreakdown {
  gasLimit: string;
  effectiveGasPriceWei: string;
  maxFeePerGasWei: string;
  maxPriorityFeeWei: string;
  estimatedFeeWei: string;
  estimatedFeeFormatted: string;
  estimatedFeeUsd: number;
  maxPossibleFeeWei: string;
  maxPossibleFeeFormatted: string;
  maxPossibleFeeUsd: number;
  nativeSymbol: string;
}

export interface SimulationResult {
  isSuccess: boolean;
  revertReason?: string;
  gasUsed: string;
  logsCount: number;
  warnings: string[];
  riskScore: "low" | "medium" | "high";
  simulatedAt: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QueuedTransactionItem {
  id: string;
  userId?: string;
  walletAddress: string;
  chainId: ChainId;
  type: TransactionType;
  status: TransactionQueueStatus;
  to: string;
  valueWei: string;
  data?: string;
  tokenSymbol?: string;
  tokenContractAddress?: string;
  nonce?: number;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  feeEstimateUsd?: number;
  createdAt: string;
  updatedAt: string;
  errorReason?: string;
  simulationResult?: SimulationResult;
}

export type TransactionAuditEvent =
  | "transaction_created"
  | "transaction_queued"
  | "transaction_signed"
  | "transaction_broadcast"
  | "transaction_confirmed"
  | "transaction_failed"
  | "transaction_cancelled"
  | "transaction_sped_up"
  | "simulation_failed"
  | "gas_estimation_failed"
  | "pin_verified_for_tx";

export interface SignedTransactionResult {
  rawTxHex: string;
  txHash: string;
  senderAddress: string;
  nonce: number;
  chainId: ChainId;
  signedAt: string;
}

export interface BroadcastResult {
  txHash: string;
  chainId: ChainId;
  broadcastAt: string;
  senderAddress: string;
  nonce: number;
}


export interface TransactionReceiptRecord {
  hash: string;
  chainId: ChainId;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string;
  contractAddress?: string;
  gasUsed: string;
  effectiveGasPriceWei: string;
  feePaidWei: string;
  feePaidFormatted: string;
  status: "success" | "failed";
  confirmations: number;
  logs: any[];
  minedAt: string;
}

export interface DecodedEvent {
  eventName: "Transfer" | "Approval" | "Swap" | "Deposit" | "Unknown";
  contractAddress: string;
  from?: string;
  to?: string;
  owner?: string;
  spender?: string;
  valueWei?: string;
  formattedValue?: string;
  symbol?: string;
  detailsSummary: string;
}

export interface FailureAnalysisResult {
  category:
    | "out_of_gas"
    | "reverted"
    | "insufficient_funds"
    | "nonce_too_low"
    | "nonce_too_high"
    | "gas_price_too_low"
    | "replacement_underpriced"
    | "rpc_failure"
    | "user_rejected"
    | "unknown";
  title: string;
  userExplanation: string;
  suggestedAction: string;
  rawErrorText: string;
}

export interface EIP712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
  salt?: string;
}

export interface EIP712TypedData {
  domain: EIP712Domain;
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, any>;
}

