/**
 * Enterprise Transaction Simulator for GoFlazz
 * Performs dry-run execution checks via eth_call and estimateGas before broadcasting.
 * Detects reverts, allowance issues, contract validity, and risk flags.
 */
import { ethers } from "ethers";
import { ChainId, UnsignedTransactionRequest } from "@/types/blockchain";
import { SimulationResult } from "@/types/transaction";
import { ProviderManager } from "@/providers/provider-manager";
import { blockchainLogger } from "@/lib/blockchain-logger";

export class TransactionSimulatorService {
  /**
   * Simulate execution of an unsigned transaction request
   */
  static async simulateTransaction(
    senderAddress: string,
    tx: UnsignedTransactionRequest
  ): Promise<SimulationResult> {
    const warnings: string[] = [];
    let riskScore: "low" | "medium" | "high" = "low";

    try {
      const provider = await ProviderManager.getProvider(tx.chainId);

      // Check recipient code if transaction is calling a contract or sending value
      const code = await provider.getCode(tx.to);
      const isContract = code !== "0x" && code !== "0x0";

      if (tx.data && tx.data !== "0x" && !isContract) {
        warnings.push("Recipient address has no contract code deployed (calling standard EOA).");
        riskScore = "high";
      }

      // Check balance
      const senderBalance = await provider.getBalance(senderAddress);
      const valueWei = BigInt(tx.value || "0");

      if (senderBalance < valueWei) {
        return {
          isSuccess: false,
          revertReason: `Insufficient native balance. Required: ${ethers.formatEther(valueWei)} ETH, Available: ${ethers.formatEther(senderBalance)} ETH`,
          gasUsed: "0",
          logsCount: 0,
          warnings: ["Insufficient sender balance"],
          riskScore: "high",
          simulatedAt: new Date().toISOString(),
        };
      }

      // Perform dry-run call simulation
      let gasUsed = tx.gasLimit || "21000";
      try {
        const estimatedGas = await provider.estimateGas({
          from: senderAddress,
          to: tx.to,
          value: valueWei,
          data: tx.data || "0x",
        });
        gasUsed = estimatedGas.toString();

        if (estimatedGas > BigInt(500000)) {
          warnings.push("Transaction requires unusually high gas (> 500,000 gas units).");
          riskScore = "medium";
        }
      } catch (estErr: any) {
        const revertReason = this.parseRevertReason(estErr?.message || estErr);
        blockchainLogger.log("tx_prep", "warn", `Transaction simulation dry-run failed for ${senderAddress}`, revertReason);

        return {
          isSuccess: false,
          revertReason,
          gasUsed: "0",
          logsCount: 0,
          warnings: ["Dry-run execution reverted on-chain"],
          riskScore: "high",
          simulatedAt: new Date().toISOString(),
        };
      }

      // Dry run eth_call
      await provider.call({
        from: senderAddress,
        to: tx.to,
        value: valueWei,
        data: tx.data || "0x",
      });

      return {
        isSuccess: true,
        gasUsed,
        logsCount: isContract ? 1 : 0,
        warnings,
        riskScore,
        simulatedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      const reason = this.parseRevertReason(err?.message || String(err));
      return {
        isSuccess: false,
        revertReason: reason,
        gasUsed: "0",
        logsCount: 0,
        warnings: [reason],
        riskScore: "high",
        simulatedAt: new Date().toISOString(),
      };
    }
  }

  private static parseRevertReason(rawError: string): string {
    if (!rawError) return "Execution reverted without reason.";
    if (rawError.includes("insufficient funds")) return "Insufficient native funds for transfer + gas fee.";
    if (rawError.includes("TRANSFER_FAILED")) return "Token transfer failed inside contract execution.";
    if (rawError.includes("allowance")) return "Insufficient token allowance for spender contract.";
    if (rawError.includes("execution reverted")) {
      const match = rawError.match(/execution reverted:? (.*?)(?:"|$)/i);
      if (match && match[1]) return match[1];
      return "Execution reverted by smart contract logic.";
    }
    return rawError.slice(0, 150);
  }
}
