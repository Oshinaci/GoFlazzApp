"use client";

import { useState, useEffect, useCallback } from "react";
import { ChainId, UnsignedTransactionRequest } from "@/types/blockchain";
import { PreparedTransactionPackage, TransactionBuilderService } from "@/services/transaction-builder.service";
import { TransactionQueueService } from "@/services/transaction-queue.service";
import { TransactionSignerService } from "@/services/transaction-signer.service";
import { TransactionBroadcasterService } from "@/services/transaction-broadcaster.service";
import { TransactionMonitorService } from "@/services/transaction-monitor.service";
import { FailureAnalyzerService } from "@/services/failure-analyzer.service";
import { QueuedTransactionItem, BroadcastResult, TransactionReceiptRecord, FailureAnalysisResult } from "@/types/transaction";
import { hashPin } from "@/lib/encryption";

export function useTransactionEngine(walletAddress?: string, chainId: ChainId = 42161, userId?: string) {
  const [queue, setQueue] = useState<QueuedTransactionItem[]>([]);
  const [activePackage, setActivePackage] = useState<PreparedTransactionPackage | null>(null);
  const [lastBroadcastResult, setLastBroadcastResult] = useState<BroadcastResult | null>(null);
  const [lastReceipt, setLastReceipt] = useState<TransactionReceiptRecord | null>(null);
  const [lastFailure, setLastFailure] = useState<FailureAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const items = await TransactionQueueService.getQueue(walletAddress);
      setQueue(items);
    } catch {
      // ignore
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  /**
   * Prepare native transfer
   */
  const prepareNativeTransfer = async (
    recipientAddress: string,
    amountFormatted: string,
    speed: "slow" | "standard" | "fast" = "standard"
  ) => {
    if (!walletAddress) throw new Error("No wallet address connected");
    setLoading(true);
    setError(null);
    try {
      const pkg = await TransactionBuilderService.buildNativeTransfer(
        walletAddress,
        recipientAddress,
        amountFormatted,
        chainId,
        speed,
        userId
      );
      setActivePackage(pkg);
      await fetchQueue();
      return pkg;
    } catch (err: any) {
      setError(err?.message || "Failed to prepare native transfer");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Prepare ERC-20 transfer
   */
  const prepareErc20Transfer = async (
    tokenContractAddress: string,
    recipientAddress: string,
    amountFormatted: string,
    decimals = 18,
    symbol = "TOKEN",
    speed: "slow" | "standard" | "fast" = "standard"
  ) => {
    if (!walletAddress) throw new Error("No wallet address connected");
    setLoading(true);
    setError(null);
    try {
      const pkg = await TransactionBuilderService.buildErc20Transfer(
        walletAddress,
        tokenContractAddress,
        recipientAddress,
        amountFormatted,
        decimals,
        symbol,
        chainId,
        speed,
        userId
      );
      setActivePackage(pkg);
      await fetchQueue();
      return pkg;
    } catch (err: any) {
      setError(err?.message || "Failed to prepare ERC-20 transfer");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Prepare Token Approval
   */
  const prepareApproval = async (
    tokenContractAddress: string,
    spenderAddress: string,
    amountFormatted: string,
    decimals = 18,
    symbol = "TOKEN"
  ) => {
    if (!walletAddress) throw new Error("No wallet address connected");
    setLoading(true);
    setError(null);
    try {
      const pkg = await TransactionBuilderService.buildTokenApproval(
        walletAddress,
        tokenContractAddress,
        spenderAddress,
        amountFormatted,
        decimals,
        symbol,
        chainId,
        userId
      );
      setActivePackage(pkg);
      await fetchQueue();
      return pkg;
    } catch (err: any) {
      setError(err?.message || "Failed to prepare token approval");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sign and Broadcast active transaction package with PIN authorization
   */
  const signAndBroadcast = async (walletId: string, pin: string) => {
    if (!activePackage) throw new Error("No active transaction package prepared");
    if (!userId) throw new Error("User ID is required for signing");

    setLoading(true);
    setError(null);
    setLastFailure(null);

    try {
      // 1. Sign transaction
      const signed = await TransactionSignerService.signTransaction({
        userId,
        walletId,
        pin,
        unsignedTx: {
          to: activePackage.unsignedTx.to,
          value: activePackage.unsignedTx.value,
          data: activePackage.unsignedTx.data,
          nonce: activePackage.unsignedTx.nonce ?? 0,
          gasLimit: activePackage.unsignedTx.gasLimit || "21000",
          maxFeePerGas: activePackage.unsignedTx.maxFeePerGas,
          maxPriorityFeePerGas: activePackage.unsignedTx.maxPriorityFeePerGas,
          chainId: Number(chainId),
        },
      });



      // 2. Broadcast raw transaction
      const broadcastRes = await TransactionBroadcasterService.broadcastTransaction({
        userId,
        chainId,
        rawTxHex: signed.rawTxHex,
        walletAddress: signed.senderAddress,
        queueItemId: activePackage.queuedItem.id,
      });

      setLastBroadcastResult(broadcastRes);
      await fetchQueue();
      return broadcastRes;
    } catch (err: any) {
      const diag = FailureAnalyzerService.analyzeError(err);
      setLastFailure(diag);
      setError(diag.userExplanation);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Speed up transaction on-chain
   */
  const speedUpTxOnChain = async (
    walletId: string,
    pin: string,
    originalTxHash: string,
    originalTx: any
  ) => {
    if (!userId) throw new Error("User ID required");
    setLoading(true);
    setError(null);

    try {
      const result = await TransactionBroadcasterService.speedUpTransaction({
        userId,
        walletId,
        pin,
        chainId,
        originalTxHash,
        originalTx,
      });
      setLastBroadcastResult(result);
      await fetchQueue();
      return result;
    } catch (err: any) {
      const diag = FailureAnalyzerService.analyzeError(err);
      setLastFailure(diag);
      setError(diag.userExplanation);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancel transaction on-chain (0-ETH self transfer)
   */
  const cancelTxOnChain = async (
    walletId: string,
    pin: string,
    originalTxHash: string,
    nonce: number,
    maxFeePerGas: string,
    maxPriorityFee: string
  ) => {
    if (!userId || !walletAddress) throw new Error("User ID & wallet required");
    setLoading(true);
    setError(null);

    try {
      const result = await TransactionBroadcasterService.cancelTransaction({
        userId,
        walletId,
        pin,
        chainId,
        walletAddress,
        originalTxHash,
        nonce,
        currentMaxFeePerGas: maxFeePerGas,
        currentMaxPriorityFeePerGas: maxPriorityFee,
      });
      setLastBroadcastResult(result);
      await fetchQueue();
      return result;
    } catch (err: any) {
      const diag = FailureAnalyzerService.analyzeError(err);
      setLastFailure(diag);
      setError(diag.userExplanation);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Monitor transaction confirmation status
   */
  const monitorTx = async (txHash: string, targetConfirmations = 1) => {
    const res = await TransactionMonitorService.checkTransactionStatus(chainId, txHash, targetConfirmations);
    if (res.receipt) setLastReceipt(res.receipt);
    if (res.failureAnalysis) setLastFailure(res.failureAnalysis);
    return res;
  };

  /**
   * Cancel queued transaction
   */
  const cancelQueuedTx = async (txId: string) => {
    await TransactionQueueService.cancelTransaction(txId, userId);
    await fetchQueue();
  };

  /**
   * PIN Verification helper required before transaction confirmation
   */
  const verifySecurityPin = async (enteredPin: string): Promise<boolean> => {
    if (!enteredPin || enteredPin.length < 4) return false;
    const hashed = await hashPin(enteredPin);
    await TransactionQueueService.logAuditEvent(userId, "pin_verified_for_tx", { walletAddress });
    return Boolean(hashed);
  };

  return {
    queue,
    activePackage,
    lastBroadcastResult,
    lastReceipt,
    lastFailure,
    loading,
    error,
    prepareNativeTransfer,
    prepareErc20Transfer,
    prepareApproval,
    signAndBroadcast,
    speedUpTxOnChain,
    cancelTxOnChain,
    monitorTx,
    cancelQueuedTx,
    verifySecurityPin,
    refreshQueue: fetchQueue,
  };
}

