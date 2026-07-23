/**
 * Enterprise Failure Analyzer Service for GoFlazz
 * Diagnoses failed transactions, reverts, RPC errors, and gas issues.
 * Returns user-friendly explanations and corrective actionable advice.
 */
import { FailureAnalysisResult } from "@/types/transaction";

export class FailureAnalyzerService {
  /**
   * Analyze raw transaction execution error or reverted receipt
   */
  static analyzeError(rawErrorMsg: string | any): FailureAnalysisResult {
    const errorString = typeof rawErrorMsg === "string"
      ? rawErrorMsg
      : rawErrorMsg?.message || JSON.stringify(rawErrorMsg || "");

    const strLower = errorString.toLowerCase();

    // 1. Out of Gas
    if (strLower.includes("out of gas") || strLower.includes("gas limit exceeded") || strLower.includes("intrinsic gas too low")) {
      return {
        category: "out_of_gas",
        title: "Transaction Out of Gas",
        userExplanation: "The transaction ran out of gas before completing execution on-chain.",
        suggestedAction: "Increase the Gas Limit buffer by 20% - 30% and try again.",
        rawErrorText: errorString,
      };
    }

    // 2. Insufficient Funds
    if (strLower.includes("insufficient funds") || strLower.includes("balance too low") || strLower.includes("exceeds balance")) {
      return {
        category: "insufficient_funds",
        title: "Insufficient Wallet Funds",
        userExplanation: "Your wallet balance does not have enough native token (e.g., ETH) to cover the transaction value plus network gas fees.",
        suggestedAction: "Top up native token balance for gas or decrease the send amount.",
        rawErrorText: errorString,
      };
    }

    // 3. Nonce Conflict
    if (strLower.includes("nonce too low") || strLower.includes("already known") || strLower.includes("transaction underpriced")) {
      return {
        category: "nonce_too_low",
        title: "Nonce Synchronization Conflict",
        userExplanation: "A transaction with the same or higher nonce was already confirmed or broadcast from this wallet.",
        suggestedAction: "Resynchronize your wallet's nonce sequence from network settings.",
        rawErrorText: errorString,
      };
    }

    if (strLower.includes("nonce too high")) {
      return {
        category: "nonce_too_high",
        title: "Future Nonce Sequence Gap",
        userExplanation: "This transaction's nonce is higher than expected by the network, leaving a sequence gap.",
        suggestedAction: "Wait for previous pending transactions to confirm or clear pending queue.",
        rawErrorText: errorString,
      };
    }

    // 4. Replacement Underpriced / Gas Too Low
    if (strLower.includes("replacement transaction underpriced") || strLower.includes("gas price too low")) {
      return {
        category: "replacement_underpriced",
        title: "Replacement Gas Fee Too Low",
        userExplanation: "When replacing or speeding up a transaction, the new max fee per gas must be at least 10% - 20% higher than the original.",
        suggestedAction: "Choose the 'Fast' speed option or manually increase max priority fee.",
        rawErrorText: errorString,
      };
    }

    // 5. Contract Execution Reverted
    if (strLower.includes("execution reverted") || strLower.includes("revert") || strLower.includes("transfer_failed") || strLower.includes("allowance")) {
      let customReason = "The smart contract rejected the transaction logic (e.g. slippage limit exceeded or insufficient allowance).";
      if (strLower.includes("allowance")) {
        customReason = "Insufficient token allowance granted to contract. Please approve token spending first.";
      }

      return {
        category: "reverted",
        title: "Smart Contract Execution Reverted",
        userExplanation: customReason,
        suggestedAction: "Check approval permissions, trade slippage tolerance, or contract parameters.",
        rawErrorText: errorString,
      };
    }

    // 6. User Rejection
    if (strLower.includes("user rejected") || strLower.includes("user cancelled") || strLower.includes("denied")) {
      return {
        category: "user_rejected",
        title: "Transaction Cancelled by User",
        userExplanation: "You declined or cancelled the transaction signature request.",
        suggestedAction: "Initiate the transaction again when ready.",
        rawErrorText: errorString,
      };
    }

    // 7. RPC Timeout / Unreachable
    if (strLower.includes("timeout") || strLower.includes("network error") || strLower.includes("failed to fetch") || strLower.includes("503")) {
      return {
        category: "rpc_failure",
        title: "Network RPC Node Timeout",
        userExplanation: "The blockchain RPC node did not respond within the expected timeout limit.",
        suggestedAction: "GoFlazz RPC Manager will automatically fail over to backup RPCs. Please retry.",
        rawErrorText: errorString,
      };
    }

    // Default Fallback
    return {
      category: "unknown",
      title: "Transaction Execution Failed",
      userExplanation: errorString.length < 150 ? errorString : "An unhandled execution error occurred on the network.",
      suggestedAction: "Inspect transaction logs or contact GoFlazz support.",
      rawErrorText: errorString,
    };
  }
}
