/**
 * Production-Ready Transaction Broadcaster Service for GoFlazz
 * Handles raw transaction broadcasting with RPC failover, speed up, cancel,
 * timeout handling, database updates, and security logging.
 */
import { ethers } from "ethers";
import { supabase, safeStringify } from "@/lib/supabaseClient";
import { BlockchainService } from "@/services/blockchain.service";
import { TransactionSignerService } from "@/services/transaction-signer.service";
import { NonceManagerService } from "@/services/nonce-manager.service";
import { ChainId } from "@/types/blockchain";
import { TransactionQueueService } from "@/services/transaction-queue.service";

export interface BroadcastResult {
  txHash: string;
  chainId: ChainId;
  broadcastAt: string;
  senderAddress: string;
  nonce: number;
}

export class TransactionBroadcasterService {
  /**
   * Broadcast raw signed transaction hex to network
   */
  static async broadcastTransaction(params: {
    userId?: string;
    chainId: ChainId;
    rawTxHex: string;
    walletAddress: string;
    queueItemId?: string;
  }): Promise<BroadcastResult> {
    const { userId, chainId, rawTxHex, walletAddress, queueItemId } = params;

    // Parse transaction to verify hash and nonce
    const parsedTx = ethers.Transaction.from(rawTxHex);
    const txHash = parsedTx.hash;

    if (!txHash) {
      throw new Error("Invalid signed transaction payload: missing txHash");
    }

    try {
      // 1. Broadcast via BlockchainService with automatic RPC failover
      const broadcastHash = await BlockchainService.sendRawTransaction(chainId, rawTxHex);

      const now = new Date().toISOString();

      // 2. Register nonce with NonceManager
      if (parsedTx.nonce !== undefined) {
        NonceManagerService.registerUsedNonce(walletAddress, chainId, parsedTx.nonce, broadcastHash);
      }

      // 3. Update transaction queue item if provided
      if (queueItemId) {
        await TransactionQueueService.updateStatus(queueItemId, "broadcasting");
      }

      // 4. Persist transaction record in wallet_transactions table
      await this.saveTransactionToDb({
        user_id: userId,
        tx_hash: broadcastHash,
        chain_id: chainId,
        from_address: walletAddress,
        to_address: parsedTx.to || "",
        value_wei: parsedTx.value.toString(),
        data: parsedTx.data,
        nonce: parsedTx.nonce,
        status: "pending",
        gas_limit: parsedTx.gasLimit.toString(),
        max_fee_per_gas: parsedTx.maxFeePerGas?.toString(),
        max_priority_fee_per_gas: parsedTx.maxPriorityFeePerGas?.toString(),
        created_at: now,
      });

      // 5. Audit Log
      await this.logAuditEvent(userId, "transaction_broadcast", {
        txHash: broadcastHash,
        chainId,
        walletAddress,
        nonce: parsedTx.nonce,
      });

      return {
        txHash: broadcastHash,
        chainId,
        broadcastAt: now,
        senderAddress: walletAddress,
        nonce: parsedTx.nonce,
      };
    } catch (error: any) {
      if (queueItemId) {
        await TransactionQueueService.updateStatus(queueItemId, "failed", error?.message || "Broadcast failed");
      }
      throw error;
    }
  }

  /**
   * Speed up a pending transaction by re-sending with higher gas fee (+20%) at same nonce
   */
  static async speedUpTransaction(params: {
    userId: string;
    walletId: string;
    pin: string;
    chainId: ChainId;
    originalTxHash: string;
    originalTx: {
      to: string;
      value: string;
      data?: string;
      nonce: number;
      gasLimit: string;
      currentMaxFeePerGas: string;
      currentMaxPriorityFeePerGas: string;
    };
  }): Promise<BroadcastResult> {
    const { userId, walletId, pin, chainId, originalTxHash, originalTx } = params;

    // Increase gas fees by 25% to satisfy network replacement rules
    const newMaxFee = (BigInt(originalTx.currentMaxFeePerGas) * BigInt(125)) / BigInt(100);
    const newPriorityFee = (BigInt(originalTx.currentMaxPriorityFeePerGas) * BigInt(125)) / BigInt(100);


    // 1. Sign replacement transaction
    const signed = await TransactionSignerService.signTransaction({
      userId,
      walletId,
      pin,
      unsignedTx: {
        to: originalTx.to,
        value: originalTx.value,
        data: originalTx.data,
        nonce: originalTx.nonce,
        gasLimit: originalTx.gasLimit,
        maxFeePerGas: newMaxFee.toString(),
        maxPriorityFeePerGas: newPriorityFee.toString(),
        chainId: Number(chainId),
      },
    });

    // 2. Broadcast replacement transaction
    const result = await this.broadcastTransaction({
      userId,
      chainId,
      rawTxHex: signed.rawTxHex,
      walletAddress: signed.senderAddress,
    });

    // 3. Log Audit Event
    await this.logAuditEvent(userId, "transaction_sped_up", {
      originalTxHash,
      newTxHash: result.txHash,
      nonce: originalTx.nonce,
      chainId,
    });

    return result;
  }

  /**
   * Cancel a pending transaction by sending 0 native token to self with same nonce and higher gas fee (+25%)
   */
  static async cancelTransaction(params: {
    userId: string;
    walletId: string;
    pin: string;
    chainId: ChainId;
    walletAddress: string;
    originalTxHash: string;
    nonce: number;
    currentMaxFeePerGas: string;
    currentMaxPriorityFeePerGas: string;
  }): Promise<BroadcastResult> {
    const {
      userId,
      walletId,
      pin,
      chainId,
      walletAddress,
      originalTxHash,
      nonce,
      currentMaxFeePerGas,
      currentMaxPriorityFeePerGas,
    } = params;

    const newMaxFee = (BigInt(currentMaxFeePerGas) * BigInt(125)) / BigInt(100);
    const newPriorityFee = (BigInt(currentMaxPriorityFeePerGas) * BigInt(125)) / BigInt(100);


    // 1. Sign 0-value transfer to self
    const signed = await TransactionSignerService.signTransaction({
      userId,
      walletId,
      pin,
      unsignedTx: {
        to: walletAddress,
        value: "0",
        data: "0x",
        nonce,
        gasLimit: "21000",
        maxFeePerGas: newMaxFee.toString(),
        maxPriorityFeePerGas: newPriorityFee.toString(),
        chainId: Number(chainId),
      },
    });

    // 2. Broadcast cancellation transaction
    const result = await this.broadcastTransaction({
      userId,
      chainId,
      rawTxHex: signed.rawTxHex,
      walletAddress: signed.senderAddress,
    });

    // 3. Log Audit Event
    await this.logAuditEvent(userId, "transaction_cancelled", {
      originalTxHash,
      cancellationTxHash: result.txHash,
      nonce,
      chainId,
    });

    return result;
  }

  /**
   * Helper to persist transaction record in database / localStorage
   */
  private static async saveTransactionToDb(record: any) {
    try {
      await supabase.from("wallet_transactions").insert(record);
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("goflazz_wallet_transactions") || "[]";
        const txs = JSON.parse(raw);
        txs.unshift(record);
        localStorage.setItem("goflazz_wallet_transactions", safeStringify(txs));
      }
    }
  }

  /**
   * Helper to log audit event
   */
  private static async logAuditEvent(userId: string | undefined, action: string, metadata: any) {
    if (!userId) return;
    try {
      await supabase.from("security_logs").insert({
        user_id: userId,
        action,
        metadata: safeStringify(metadata),
        created_at: new Date().toISOString(),
      });
    } catch {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("goflazz_security_logs") || "[]";
        const logs = JSON.parse(raw);
        logs.unshift({ user_id: userId, action, metadata, created_at: new Date().toISOString() });
        localStorage.setItem("goflazz_security_logs", safeStringify(logs));
      }
    }
  }
}
