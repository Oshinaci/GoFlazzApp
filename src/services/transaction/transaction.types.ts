import { ChainId } from "@/types/blockchain";

export type SendStep = "asset" | "recipient" | "amount" | "review" | "ready";

export interface TransactionIntent {
  userId: string;
  walletAddress: string;
  chainId: ChainId;
  assetSymbol: string;
  assetName: string;
  assetContractAddress: string | null;
  recipientAddress: string;
  amount: number;
  decimals: number;
  networkName: string;
  memo?: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  isEns?: boolean;
}

export interface AmountValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface TransactionValidationResult {
  isValid: boolean;
  addressValidation: AddressValidationResult;
  amountValidation: AmountValidationResult;
  errors: string[];
  warnings: string[];
}

export interface FeeEstimateResult {
  gasLimit: string;
  gasPriceGwei: string;
  estimatedFeeNative: string;
  estimatedFeeUsd: number;
  nativeSymbol: string;
}

export interface TransactionReview {
  intent: TransactionIntent;
  feeEstimate: FeeEstimateResult;
  totalNativeCost: string;
  totalUsdCost: number;
  warnings: string[];
  isSimulationPassed: boolean;
  preparedAt: string;
}
