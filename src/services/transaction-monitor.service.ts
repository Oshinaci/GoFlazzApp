/**
 * Enterprise Transaction Monitor & Confirmation Engine for GoFlazz
 * Polls block status, calculates confirmation depth (1, 3, 12 blocks),
 * stores transaction receipts, decodes log events, and diagnoses failures.
 */
import { ethers } from "ethers";
import { supabase, safeStringify } from "@/lib/supabaseClient";
import { BlockchainService } from "@/services/blockchain.service";
import { EventDecoderService } from "@/services/event-decoder.service";
import { FailureAnalyzerService } from "@/services/failure-analyzer.service";
import { ChainId } from "@/types/blockchain";
import { TransactionReceiptRecord, DecodedEvent, FailureAnalysisResult } from "@/types/transaction";

export class TransactionMonitorService {
  /**
   * Check transaction hash status on-chain
   */
  static async checkTransactionStatus(
    chainId: ChainId,
    txHash: string,
    targetConfirmations = 1
  ): Promise<{
    status: "pending" | "mined" | "confirmed" | "failed" | "not_found";
    confirmations: number;
    receipt?: TransactionReceiptRecord;
    decodedEvents?: DecodedEvent[];
    failureAnalysis?: FailureAnalysisResult;
  }> {
    try {
      // 1. Fetch receipt from blockchain
      const receipt = await BlockchainService.getTransactionReceipt(chainId, txHash);

      if (!receipt) {
        return { status: "pending", confirmations: 0 };
      }

      // 2. Fetch latest block number for confirmation calculation
      const latestBlock = await BlockchainService.getLatestBlockNumber(chainId);
      const confirmations = Math.max(0, latestBlock - receipt.blockNumber + 1);

      const isSuccess = receipt.status === 1 || Number(receipt.status) === 1;

      const statusText: "success" | "failed" = isSuccess ? "success" : "failed";

      const gasUsed = receipt.gasUsed ? receipt.gasUsed.toString() : "0";
      const effectiveGasPrice = receipt.gasPrice ? receipt.gasPrice.toString() : "0";
      const feePaidWei = (BigInt(gasUsed) * BigInt(effectiveGasPrice)).toString();
      const feePaidFormatted = parseFloat(ethers.formatEther(feePaidWei)).toFixed(6);

      const receiptRecord: TransactionReceiptRecord = {
        hash: txHash,
        chainId,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash || "",
        from: receipt.from,
        to: receipt.to || "",
        contractAddress: receipt.contractAddress || undefined,
        gasUsed,
        effectiveGasPriceWei: effectiveGasPrice,
        feePaidWei,
        feePaidFormatted,
        status: statusText,
        confirmations,
        logs: Array.from(receipt.logs || []),
        minedAt: new Date().toISOString(),
      };

      // Decode log events
      const decodedEvents = EventDecoderService.decodeLogs(Array.from(receipt.logs || []));


      // If failed, run FailureAnalyzer
      let failureAnalysis: FailureAnalysisResult | undefined;
      if (!isSuccess) {
        failureAnalysis = FailureAnalyzerService.analyzeError(
          `Execution reverted on block #${receipt.blockNumber}`
        );
      }

      // Determine aggregated status
      let aggregateStatus: "pending" | "mined" | "confirmed" | "failed" = "mined";
      if (!isSuccess) {
        aggregateStatus = "failed";
      } else if (confirmations >= targetConfirmations) {
        aggregateStatus = "confirmed";
      }

      // Persist receipt & update status in DB
      await this.saveReceiptAndStatus(txHash, chainId, aggregateStatus, receiptRecord, failureAnalysis);

      return {
        status: aggregateStatus,
        confirmations,
        receipt: receiptRecord,
        decodedEvents,
        failureAnalysis,
      };
    } catch (error) {
      return { status: "pending", confirmations: 0 };
    }
  }

  /**
   * Persist transaction receipt and update transaction record
   */
  private static async saveReceiptAndStatus(
    txHash: string,
    chainId: ChainId,
    status: string,
    receiptRecord: TransactionReceiptRecord,
    failureAnalysis?: FailureAnalysisResult
  ) {
    try {
      // Update wallet_transactions table
      await supabase
        .from("wallet_transactions")
        .update({
          status,
          gas_used: receiptRecord.gasUsed,
          fee_paid_wei: receiptRecord.feePaidWei,
          confirmations: receiptRecord.confirmations,
          updated_at: new Date().toISOString(),
          error_reason: failureAnalysis?.userExplanation,
        })
        .eq("tx_hash", txHash)
        .eq("chain_id", chainId);

      // Save receipt to transaction_receipts table
      await supabase.from("transaction_receipts").upsert({
        hash: txHash,
        chain_id: chainId,
        block_number: receiptRecord.blockNumber,
        from_address: receiptRecord.from,
        to_address: receiptRecord.to,
        gas_used: receiptRecord.gasUsed,
        fee_paid_wei: receiptRecord.feePaidWei,
        status: receiptRecord.status,
        receipt_json: safeStringify(receiptRecord),
        created_at: new Date().toISOString(),
      });
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("goflazz_wallet_transactions") || "[]";
        const txs = JSON.parse(raw);
        const index = txs.findIndex((t: any) => t.tx_hash === txHash);
        if (index !== -1) {
          txs[index].status = status;
          txs[index].confirmations = receiptRecord.confirmations;
          txs[index].gas_used = receiptRecord.gasUsed;
          localStorage.setItem("goflazz_wallet_transactions", safeStringify(txs));
        }

        const rawReceipts = localStorage.getItem("goflazz_transaction_receipts") || "{}";
        const receipts = JSON.parse(rawReceipts);
        receipts[txHash] = receiptRecord;
        localStorage.setItem("goflazz_transaction_receipts", safeStringify(receipts));
      }
    }
  }
}
