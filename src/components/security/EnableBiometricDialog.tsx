"use client";

import React, { useState } from "react";
import { Fingerprint, Scan, ShieldCheck, X } from "lucide-react";
import { BiometricType, BiometricService } from "@/services/biometric.service";
import { motion, AnimatePresence } from "framer-motion";

interface EnableBiometricDialogProps {
  isOpen: boolean;
  biometricType?: BiometricType;
  onEnable: () => Promise<void>;
  onSkip: () => void;
  isLoading?: boolean;
}

export default function EnableBiometricDialog({
  isOpen,
  biometricType = "fingerprint",
  onEnable,
  onSkip,
  isLoading = false,
}: EnableBiometricDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  if (!isOpen) return null;

  const handleEnableClick = async () => {
    setInternalLoading(true);
    try {
      await onEnable();
    } finally {
      setInternalLoading(false);
    }
  };

  const label = BiometricService.getBiometricTypeLabel(biometricType);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm rounded-3xl border border-foreground/15 bg-zinc-950/90 p-6 text-foreground shadow-2xl backdrop-blur-2xl"
        >
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon Glow Container */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-primary/30 via-purple-500/20 to-blue-500/30 p-[1.5px] shadow-xl shadow-primary/20">
              <div className="flex h-full w-full items-center justify-center rounded-3xl bg-zinc-900/90">
                {biometricType === "face" ? (
                  <Scan className="h-9 w-9 text-primary animate-pulse" />
                ) : (
                  <Fingerprint className="h-9 w-9 text-primary animate-pulse" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-black">
                <ShieldCheck className="h-3.5 w-3.5" />
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Enable {label} Unlock?
            </h2>

            <p className="mt-2 text-xs text-muted-foreground leading-relaxed px-2">
              Use {label} to quickly and securely unlock your GoFlazz Wallet without entering your 6-digit PIN every time.
            </p>

            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-left text-[11px] text-primary/90">
              <p className="font-semibold text-foreground">🔒 Zero Biometric Data Stored</p>
              <p className="mt-0.5 text-muted-foreground">
                Your face or fingerprint data stays strictly on your device&apos;s secure enclave and is managed by the OS.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex w-full flex-col gap-2.5">
              <button
                onClick={handleEnableClick}
                disabled={isLoading || internalLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition active:scale-[0.98] hover:opacity-95 disabled:opacity-50"
              >
                {isLoading || internalLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Verifying {label}...</span>
                  </div>
                ) : (
                  <span>Enable {label}</span>
                )}
              </button>

              <button
                onClick={onSkip}
                disabled={isLoading || internalLoading}
                className="w-full rounded-xl border border-foreground/10 bg-foreground/5 py-3 text-sm font-medium text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground disabled:opacity-50"
              >
                Not Now
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
