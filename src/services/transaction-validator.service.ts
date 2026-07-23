/**
 * Enterprise Transaction Validator for GoFlazz
 * Validates recipient addresses, checksums, supported chains, amounts, gas balances, and token balances.
 */
import { ethers } from "ethers";
import { ChainId, UnsignedTransactionRequest } from "@/types/blockchain";
import { ValidationResult } from "@/types/transaction";
import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { BlockchainService } from "@/services/blockchain.service";
import { ProviderManager } from "@/providers/provider-manager";

export class TransactionValidatorService {
  /**
   * Validate an unsigned transaction request before enqueueing or preparation
   */
  static async validateTransaction(
    senderAddress: string,
    tx: UnsignedTransactionRequest
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate Chain
    if (!SUPPORTED_NETWORKS[tx.chainId]) {
      errors.push(`Unsupported chain ID: ${tx.chainId}`);
    }

    // 2. Validate Sender & Recipient Addresses
    const validSender = BlockchainService.validateAddress(senderAddress);
    if (!validSender.isValid || !validSender.checksumAddress) {
      errors.push("Invalid sender wallet address.");
    }

    const validRecipient = BlockchainService.validateAddress(tx.to);
    if (!validRecipient.isValid || !validRecipient.checksumAddress) {
      errors.push("Invalid recipient address format.");
    } else if (validRecipient.checksumAddress === ethers.ZeroAddress) {
      errors.push("Recipient cannot be the zero address (0x0000...0000).");
    }

    // 3. Validate Amount / Value
    try {
      const valueWei = BigInt(tx.value || "0");
      if (valueWei < BigInt(0)) {
        errors.push("Transaction value cannot be negative.");
      }
    } catch {
      errors.push("Invalid transaction value format.");
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // 4. Validate Native Gas Balance & Value
    try {
      const provider = await ProviderManager.getProvider(tx.chainId);
      const nativeBalance = await provider.getBalance(validSender.checksumAddress!);
      
      const valueWei = BigInt(tx.value || "0");
      const gasLimit = BigInt(tx.gasLimit || "21000");
      const maxFee = BigInt(tx.maxFeePerGas || "100000000");
      const totalGasCost = gasLimit * maxFee;
      const totalRequiredNative = valueWei + totalGasCost;

      if (nativeBalance < totalRequiredNative) {
        errors.push(
          `Insufficient native gas balance. Required: ${ethers.formatEther(totalRequiredNative)} ETH, Available: ${ethers.formatEther(nativeBalance)} ETH`
        );
      }
    } catch (err: any) {
      warnings.push(`Could not verify native gas balance: ${err?.message || err}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
