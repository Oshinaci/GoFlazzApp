"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  KeyRound,
  Delete,
  Fingerprint,
  LogOut,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWalletSecurityContext } from "@/context/WalletSecurityContext";
import { WalletService, WalletRecord } from "@/services/wallet.service";
import Logo from "@/components/layout/Logo";
import { toast } from "sonner";

export default function UnlockWalletPage() {
  const { user, profile, signOut } = useAuth();
  const {
    isUnlocked,
    unlockWallet,
    unlockWithBiometrics,
    isLockedByBruteForce,
    remainingLockSeconds,
    canUnlockWithBiometrics,
    biometricTypeLabel,
    failedAttempts,
  } = useWalletSecurityContext();

  const router = useRouter();

  const [pin, setPin] = useState<string>("");
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasAutoPromptedBiometric, setHasAutoPromptedBiometric] = useState<boolean>(false);

  // Fetch primary wallet for display
  useEffect(() => {
    let active = true;
    if (user?.id) {
      WalletService.getWallets(user.id)
        .then((wallets) => {
          if (!active) return;
          if (wallets.length > 0) {
            const primary = wallets.find((w) => w.is_primary) || wallets[0];
            setWallet(primary);
          }
        })
        .catch(console.error);
    }
    return () => {
      active = false;
    };
  }, [user?.id]);

  // If already unlocked, redirect to dashboard
  useEffect(() => {
    if (isUnlocked) {
      router.replace("/");
    }
  }, [isUnlocked, router]);

  // Biometric Unlock Trigger
  const handleBiometrics = useCallback(async () => {
    if (isLockedByBruteForce || isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await unlockWithBiometrics();
      if (res.success) {
        toast.success("Unlocked with " + biometricTypeLabel + ".");
        router.replace("/");
      } else {
        if (res.error && !res.error.includes("cancelled")) {
          toast.error(res.error);
          setErrorMessage(res.error);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Biometric unlock failed.");
    } finally {
      setIsLoading(false);
    }
  }, [isLockedByBruteForce, isLoading, unlockWithBiometrics, biometricTypeLabel, router]);

  // Auto-trigger biometrics once when landing on unlock page if biometrics enabled
  useEffect(() => {
    if (canUnlockWithBiometrics && !hasAutoPromptedBiometric && !isUnlocked && !isLockedByBruteForce) {
      setHasAutoPromptedBiometric(true);
      const timer = setTimeout(() => {
        handleBiometrics();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [canUnlockWithBiometrics, hasAutoPromptedBiometric, isUnlocked, isLockedByBruteForce, handleBiometrics]);

  // Submit unlock PIN
  const handleUnlock = useCallback(
    async (pinToSubmit: string) => {
      if (pinToSubmit.length !== 6 || isLoading || isLockedByBruteForce) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const res = await unlockWallet(pinToSubmit);
        if (res.success) {
          toast.success("Wallet unlocked successfully.");
          router.replace("/");
        } else {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 600);
          setPin("");
          setErrorMessage(res.error || "Incorrect PIN.");
          toast.error(res.error || "Incorrect PIN.");
        }
      } catch (err: any) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 600);
        setPin("");
        const msg = err.message || "Failed to unlock wallet.";
        setErrorMessage(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isLockedByBruteForce, unlockWallet, router],
  );

  // Keypad press handler
  const handleNumClick = useCallback(
    (num: string) => {
      if (isLockedByBruteForce || isLoading) return;
      if (pin.length < 6) {
        const nextPin = pin + num;
        setPin(nextPin);
        setErrorMessage(null);
        if (nextPin.length === 6) {
          handleUnlock(nextPin);
        }
      }
    },
    [isLockedByBruteForce, isLoading, pin, handleUnlock],
  );

  const handleDelete = useCallback(() => {
    if (isLockedByBruteForce || isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  }, [isLockedByBruteForce, isLoading]);

  const handleClearAll = useCallback(() => {
    if (isLockedByBruteForce || isLoading) return;
    setPin("");
    setErrorMessage(null);
  }, [isLockedByBruteForce, isLoading]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLockedByBruteForce || isLoading) return;
      if (e.key >= "0" && e.key <= "9") {
        handleNumClick(e.key);
      } else if (e.key === "Backspace") {
        handleDelete();
      } else if (e.key === "Escape") {
        handleClearAll();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    pin,
    isLockedByBruteForce,
    isLoading,
    handleNumClick,
    handleDelete,
    handleClearAll,
  ]);

  // Format remaining lock countdown timer
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
    }
    return `${secs}s`;
  };

  const shortenedAddress = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : "0x71C...39A2";

  const walletName = wallet?.name || profile?.display_name || "Primary Wallet";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between bg-background px-4 py-8 select-none overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-12 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-purple-600/10 blur-[100px]" />

      {/* Top Header / Brand */}
      <header className="relative z-10 flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-sm font-semibold tracking-wider text-foreground">
            GoFlazz
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/5 px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
            title="Log out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Switch Account</span>
          </button>
        </div>
      </header>

      {/* Main Unlock Card Container */}
      <main className="relative z-10 my-auto flex w-full max-w-md flex-col items-center justify-center">
        {/* Wallet Avatar & Details */}
        <div className="flex flex-col items-center text-center">
          {/* Avatar Ring */}
          <div className="relative mb-3 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/30 via-purple-500/20 to-blue-500/30 p-[1.5px] shadow-lg shadow-primary/10">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-xl">
              {isLockedByBruteForce ? (
                <Lock className="h-9 w-9 text-rose-400 animate-pulse" />
              ) : (
                <Shield className="h-9 w-9 text-primary" />
              )}
            </div>
            {/* Status Indicator Badge */}
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 border border-foreground/20">
              <KeyRound className="h-3.5 w-3.5 text-primary" />
            </div>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {walletName}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {shortenedAddress}
          </p>
        </div>

        {/* Locked Countdown Alert Banner */}

        {isLockedByBruteForce ? (
          <div className="mt-6 flex w-full flex-col items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-center backdrop-blur-md">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="h-5 w-5 animate-bounce" />
              <span className="font-semibold text-sm">
                Wallet Temporarily Locked
              </span>
            </div>
            <p className="text-xs text-rose-200/80">
              Too many failed PIN attempts. Try again in{" "}
              <span className="font-mono font-bold text-foreground">
                {formatCountdown(remainingLockSeconds)}
              </span>
              .
            </p>
          </div>
        ) : errorMessage ? (
          <div className="mt-4 flex items-center gap-1.5 rounded-full bg-rose-500/15 px-4 py-1.5 text-xs text-rose-400 border border-rose-500/20">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>{errorMessage}</span>
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Enter your 6-digit PIN to access your wallet
          </p>
        )}

        {/* PIN Dots Display */}
        <div className="mt-6 flex items-center gap-3.5">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}

                className={`h-4 w-4 rounded-full border transition-all duration-200 ${
                  isFilled
                    ? "border-primary bg-gradient-to-tr from-primary to-purple-500 shadow-md shadow-primary/30"
                    : "border-foreground/20 bg-foreground/5"
                }`}
              />
            );
          })}
        </div>

        {/* Failed Attempt Warning Counter */}
        {!isLockedByBruteForce && failedAttempts > 0 && (
          <p className="mt-3 text-[11px] font-medium text-amber-400/90">
            {5 - failedAttempts} attempt{5 - failedAttempts !== 1 ? "s" : ""}{" "}
            remaining before 15-minute lock
          </p>
        )}

        {/* Keypad Grid (3x4) */}
        <div className="mt-8 grid w-full max-w-[280px] grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleNumClick(num)}
              disabled={isLockedByBruteForce || isLoading}

              className="flex h-16 w-full items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03] text-xl font-semibold text-foreground transition-colors hover:bg-foreground/10 hover:border-foreground/20 disabled:opacity-30 disabled:pointer-events-none"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button or Clear All */}
          <button
            onClick={
              canUnlockWithBiometrics ? handleBiometrics : handleClearAll
            }
            disabled={isLockedByBruteForce || isLoading}
            title={
              canUnlockWithBiometrics ? "Unlock with Biometrics" : "Clear input"
            }

            className="flex h-16 w-full items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03] text-sm text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            {canUnlockWithBiometrics ? (
              <Fingerprint className="h-6 w-6 text-primary" />
            ) : (
              <span className="text-xs font-medium">Clear</span>
            )}
          </button>

          {/* Number 0 */}
          <button
            onClick={() => handleNumClick("0")}
            disabled={isLockedByBruteForce || isLoading}

            className="flex h-16 w-full items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03] text-xl font-semibold text-foreground transition-colors hover:bg-foreground/10 hover:border-foreground/20 disabled:opacity-30 disabled:pointer-events-none"
          >
            0
          </button>

          {/* Delete / Backspace */}
          <button
            onClick={handleDelete}
            disabled={isLockedByBruteForce || isLoading || pin.length === 0}
            title="Delete digit"

            className="flex h-16 w-full items-center justify-center rounded-2xl border border-foreground/10 bg-foreground/[0.03] text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          >
            <Delete className="h-6 w-6" />
          </button>
        </div>

        {/* Explicit Unlock CTA Button & Biometric Option */}
        <div className="mt-6 flex flex-col gap-2.5 w-full max-w-[280px]">
          {canUnlockWithBiometrics && (
            <button
              onClick={handleBiometrics}
              disabled={isLoading || isLockedByBruteForce}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-40"
            >
              <Fingerprint className="h-4 w-4" />
              <span>Unlock with {biometricTypeLabel}</span>
            </button>
          )}

          <button
            onClick={() => handleUnlock(pin)}
            disabled={pin.length !== 6 || isLoading || isLockedByBruteForce}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition active:scale-[0.98] hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                <span>Verifying...</span>
              </div>
            ) : (
              <>
                <span>Unlock Wallet</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer info */}
      <footer className="relative z-10 text-center text-[11px] text-muted-foreground/60">
        GoFlazz Self-Custodial Security • End-to-End Encrypted
      </footer>
    </div>
  );
}
