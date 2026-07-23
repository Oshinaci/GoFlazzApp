/**
 * Enterprise Transaction Queue Service for GoFlazz
 * Manages queued transactions, multi-tx ordering, status lifecycle, and security audit logging.
 */
import { supabase, safeStringify } from "@/lib/supabaseClient";
import { QueuedTransactionItem, TransactionQueueStatus, TransactionAuditEvent } from "@/types/transaction";
import { blockchainLogger } from "@/lib/blockchain-logger";

export class TransactionQueueService {
  /**
   * Fetch all queued transactions for a wallet address
   */
  static async getQueue(walletAddress: string): Promise<QueuedTransactionItem[]> {
    try {
      const { data, error } = await supabase
        .from("transaction_queue")
        .select("*")
        .eq("wallet_address", walletAddress.toLowerCase())
        .order("created_at", { ascending: false });

      if (error || !data) {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("goflazz_tx_queue");
          const list: QueuedTransactionItem[] = raw ? JSON.parse(raw) : [];
          return list.filter((tx) => tx.walletAddress.toLowerCase() === walletAddress.toLowerCase());
        }
        return [];
      }

      return data.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        walletAddress: item.wallet_address,
        chainId: item.chain_id,
        type: item.type,
        status: item.status,
        to: item.to_address,
        valueWei: item.value_wei,
        data: item.data,
        tokenSymbol: item.token_symbol,
        tokenContractAddress: item.token_contract,
        nonce: item.nonce,
        gasLimit: item.gas_limit,
        maxFeePerGas: item.max_fee_per_gas,
        maxPriorityFeePerGas: item.max_priority_fee_per_gas,
        feeEstimateUsd: item.fee_estimate_usd,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        errorReason: item.error_reason,
        simulationResult: item.simulation_result ? JSON.parse(item.simulation_result) : undefined,
      }));
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("goflazz_tx_queue");
        const list: QueuedTransactionItem[] = raw ? JSON.parse(raw) : [];
        return list.filter((tx) => tx.walletAddress.toLowerCase() === walletAddress.toLowerCase());
      }
      return [];
    }
  }

  /**
   * Enqueue a new unsigned transaction item
   */
  static async enqueueTransaction(item: Omit<QueuedTransactionItem, "id" | "createdAt" | "updatedAt">): Promise<QueuedTransactionItem> {
    const newItem: QueuedTransactionItem = {
      ...item,
      id: "txq_" + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await supabase.from("transaction_queue").insert({
        id: newItem.id,
        user_id: newItem.userId,
        wallet_address: newItem.walletAddress.toLowerCase(),
        chain_id: newItem.chainId,
        type: newItem.type,
        status: newItem.status,
        to_address: newItem.to,
        value_wei: newItem.valueWei,
        data: newItem.data,
        token_symbol: newItem.tokenSymbol,
        token_contract: newItem.tokenContractAddress,
        nonce: newItem.nonce,
        gas_limit: newItem.gasLimit,
        max_fee_per_gas: newItem.maxFeePerGas,
        max_priority_fee_per_gas: newItem.maxPriorityFeePerGas,
        fee_estimate_usd: newItem.feeEstimateUsd,
        simulation_result: newItem.simulationResult ? safeStringify(newItem.simulationResult) : null,
        created_at: newItem.createdAt,
        updated_at: newItem.updatedAt,
      });
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("goflazz_tx_queue");
        const list: QueuedTransactionItem[] = raw ? JSON.parse(raw) : [];
        list.unshift(newItem);
        localStorage.setItem("goflazz_tx_queue", safeStringify(list));
      }
    }

    await this.logAuditEvent(newItem.userId, "transaction_queued", { id: newItem.id, to: newItem.to, value: newItem.valueWei });
    return newItem;
  }

  /**
   * Update status of a queued transaction item
   */
  static async updateStatus(id: string, status: TransactionQueueStatus, errorReason?: string): Promise<void> {
    try {
      await supabase
        .from("transaction_queue")
        .update({
          status,
          error_reason: errorReason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("goflazz_tx_queue");
        const list: QueuedTransactionItem[] = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex((x) => x.id === id);
        if (idx !== -1) {
          list[idx].status = status;
          if (errorReason) list[idx].errorReason = errorReason;
          list[idx].updatedAt = new Date().toISOString();
          localStorage.setItem("goflazz_tx_queue", safeStringify(list));
        }
      }
    }
  }

  /**
   * Cancel a queued transaction item
   */
  static async cancelTransaction(id: string, userId?: string): Promise<void> {
    await this.updateStatus(id, "cancelled");
    await this.logAuditEvent(userId, "transaction_cancelled", { id });
  }

  /**
   * Security audit logging helper
   */
  static async logAuditEvent(userId: string | undefined, action: TransactionAuditEvent, metadata: any = {}) {
    try {
      if (userId) {
        await supabase.from("security_logs").insert({
          user_id: userId,
          action,
          metadata: safeStringify(metadata),
          created_at: new Date().toISOString(),
        });
      }
    } catch {
      blockchainLogger.log("tx_prep", "info", `Audit event: ${action}`, metadata);
    }
  }
}
