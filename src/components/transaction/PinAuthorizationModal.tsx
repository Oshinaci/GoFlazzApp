"use client";

import { useState } from "react";
import { Lock, ShieldCheck, X, Loader2, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { TransactionSignerService } from "@/services/transaction-signer.service";
import { TransactionBroadcasterService } from "@/services/transaction-broadcaster.service";
import { BlockchainService } from "@/services/blockchain.service";
import { TransactionIntent, TransactionReview } from "@/services/transaction/transaction.types";
import { ChainId } from "@/types/blockchain";

interface PinAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  walletId: string;
  intent: TransactionIntent;
  review: TransactionReview;
  onSuccess: (txHash: string) => void;
}

export default function PinAuthorizationModal({
  isOpen,
  onClose,
  userId,
  walletId,
  intent,
  review,
  onSuccess,
}: PinAuthorizationModalProps) {
  const [pin, setPin] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [stepDescription, setStepDescription] = useState<string>("Enter security PIN to authorize transaction");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successHash, setSuccessHash] = useState<string>("");

  if (!isOpen) return null;

  const handleAuthorizeAndExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || pin.length < 4) {
      setErrorMessage("Please enter a valid 4-6 digit security PIN.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Prepare unsigned transaction request (Native vs ERC-20)
      setStepDescription("Preparing transaction & fetching gas/nonce...");
      let unsignedTx;
      const chainIdNum = intent.chainId as ChainId;

      if (intent.assetSymbol.toUpperCase() === "ETH") {
        unsignedTx = await BlockchainService.prepareNativeTransfer(
          chainIdNum,
          intent.walletAddress,
          intent.recipientAddress,
          intent.amount.toString()
        );
      } else {
        if (!intent.assetContractAddress) {
          throw new Error("Missing token contract address for ERC-20 transfer");
        }
        unsignedTx = await BlockchainService.prepareErc20Transfer(
          chainIdNum,
          intent.walletAddress,
          intent.assetContractAddress,
          intent.recipientAddress,
          intent.amount.toString(),
          intent.decimals || 18
        );
      }

      // 2. Sign transaction securely with PIN
      setStepDescription("Decrypting keystore & signing transaction securely...");
      const signedResult = await TransactionSignerService.signTransaction({
        userId,
        walletId,
        pin,
        unsignedTx: {
          to: unsignedTx.to,
          value: unsignedTx.value,
          data: unsignedTx.data,
          nonce: unsignedTx.nonce ?? 0,
          gasLimit: unsignedTx.gasLimit ?? "21000",
          maxFeePerGas: unsignedTx.maxFeePerGas,
          maxPriorityFeePerGas: unsignedTx.maxPriorityFeePerGas,
          chainId: Number(unsignedTx.chainId),
        },
      });

      // 3. Broadcast transaction to Arbitrum One / EVM network
      setStepDescription("Broadcasting transaction to network & recording lifecycle...");
      const broadcastResult = await TransactionBroadcasterService.broadcastTransaction({
        userId,
        chainId: chainIdNum,
        rawTxHex: signedResult.rawTxHex,
        walletAddress: intent.walletAddress,
      });

      setSuccessHash(broadcastResult.txHash);
      setStepDescription("Transaction broadcasted successfully!");
      toast.success("Transaction broadcasted to network!");
      setLoading(false);

      setTimeout(() => {
        onSuccess(broadcastResult.txHash);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("[PinAuthorizationModal] Execution error:", err);
      setLoading(false);
      const msg = err.message || "Transaction execution failed.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[26px] border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-foreground">Authorize Transaction</h3>
              <p className="text-[11px] text-muted-foreground">GoFlazz Secure Execution Engine</p>
            </div>
          </div>
          {!loading && !successHash && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-card-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {successHash ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[16px] font-bold text-foreground">Transaction Broadcasted!</h4>
              <p className="text-[12px] text-muted-foreground font-mono truncate px-4">{successHash}</p>
            </div>
            <div className="pt-2">
              <a
                href={`https://arbiscan.io/tx/${successHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-bold text-primary hover:underline"
              >
                <span>View on Arbiscan</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuthorizeAndExecute} className="space-y-4">
            <div className="rounded-[16px] border border-border/80 bg-card-secondary p-4 space-y-2 text-left">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold text-foreground">
                  {intent.amount} {intent.assetSymbol}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-mono text-[11px] text-foreground truncate max-w-[200px]">
                  {intent.recipientAddress}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Network Fee:</span>
                <span className="font-bold text-foreground">{review.feeEstimate.estimatedFeeNative}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Security PIN</span>
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-6 digit PIN"
                disabled={loading}
                className="w-full rounded-[14px] border border-border/80 bg-card-secondary px-4 py-3 text-[14px] font-mono tracking-widest text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/60"
              />
              <p className="text-[11px] text-muted-foreground pt-0.5">
                Private key is decrypted securely in memory, used for EIP-155 signing, and zeroized immediately.
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-[12px] bg-red-500/10 border border-red-500/30 p-3 flex items-start gap-2 text-red-600 dark:text-red-400 text-[12px]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{errorMessage}</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 py-2 text-[13px] font-bold text-primary">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{stepDescription}</span>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !pin}
                className="w-full py-3.5 rounded-[16px] bg-primary text-white text-[14px] font-bold shadow-sm hover:bg-primary/90 transition disabled:opacity-50"
              >
                {loading ? "Processing..." : "Authorize & Send Transaction"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
