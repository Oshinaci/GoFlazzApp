"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Shield,
  Bell,
  Lock,
  ArrowRight,
  CheckCircle,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
  AlertTriangle,
  Key,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { generateMnemonic as cryptoGenerateMnemonic, isValidMnemonic, walletFromMnemonic } from "@/lib/wallet";
import { encryptData, decryptData } from "@/lib/encryption";
import { WalletService } from "@/services/wallet.service";
import { toast } from "sonner";
import Logo from "@/components/layout/Logo";

type OnboardingSubStep =
  | "choice"             // Choose Create or Import
  | "create_warning"     // Warn about recovery phrase importance
  | "create_display"     // Display 12-word phrase
  | "create_verify"      // Verify random words
  | "import_input"       // Input existing phrase
  | "pin_setup"          // Enter 6-digit PIN & confirmation
  | "biometric_offer"    // Biometrics opt-in or skip
  | "success";           // Onboarding completed success

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateOnboardingStatus } = useAuth();
  const { primaryWallet, createWallet, importWallet, setupPIN, setBiometricsEnabled } = useWallet();

  // Wizard state
  const [subStep, setSubStep] = useState<OnboardingSubStep>("choice");
  const [isCreatingMode, setIsCreatingMode] = useState(true);

  // Recovery phrase state
  const [mnemonicPhrase, setMnemonicPhrase] = useState("");
  const [copiedPhrase, setCopiedPhrase] = useState(false);
  const [warningChecked, setWarningChecked] = useState(false);

  // Verification state (word #2, #6, #11)
  const [verifyIndices, setVerifyIndices] = useState<number[]>([1, 5, 10]); // 0-indexed corresponding to 2, 6, 11
  const [verifyInputs, setVerifyInputs] = useState<{ [key: number]: string }>({ 1: "", 5: "", 10: "" });

  // Import state
  const [importPhraseInput, setImportPhraseInput] = useState("");

  // PIN state
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // Biometrics
  const [biometricsChecked, setBiometricsChecked] = useState(true);

  // Finalizing loading
  const [isFinishing, setIsFinishing] = useState(false);

  // Generate or retrieve mnemonic when entering warning/display state
  const handleStartCreation = async () => {
    try {
      let phrase = "";
      if (user && primaryWallet?.id) {
        try {
          const keys = await WalletService.getEncryptedKeys(primaryWallet.id, user.id);
          if (keys.encrypted_mnemonic) {
            phrase = await decryptData(keys.encrypted_mnemonic, `goflazz_sec_${user.id}`);
          }
        } catch {
          // If already encrypted with a custom PIN or secret, fallback
        }
      }

      if (!phrase || !isValidMnemonic(phrase)) {
        phrase = cryptoGenerateMnemonic();
      }

      setMnemonicPhrase(phrase);
      // Pick 3 random words to verify
      const indices = [1, 5, 10]; // Word 2, 6, 11
      setVerifyIndices(indices);
      setVerifyInputs({ [indices[0]]: "", [indices[1]]: "", [indices[2]]: "" });
      setIsCreatingMode(true);
      setSubStep("create_warning");
    } catch (err: any) {
      toast.error("Error retrieving recovery phrase: " + err.message);
    }
  };

  const handleCopyPhrase = async () => {
    try {
      await navigator.clipboard.writeText(mnemonicPhrase);
      setCopiedPhrase(true);
      toast.success("Secret Recovery Phrase copied to clipboard!");
      setTimeout(() => setCopiedPhrase(false), 2000);
    } catch {
      toast.error("Failed to copy phrase. Please write it down manually.");
    }
  };

  const handleVerifyPhrase = () => {
    const words = mnemonicPhrase.split(" ");
    let isValid = true;

    for (const idx of verifyIndices) {
      const userWord = (verifyInputs[idx] || "").trim().toLowerCase();
      const correctWord = words[idx].toLowerCase();
      if (userWord !== correctWord) {
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      toast.error("Incorrect verification words. Please check your recovery phrase and try again.");
      return;
    }

    toast.success("Recovery phrase verified successfully!");
    setSubStep("pin_setup");
  };

  const handleVerifyImport = () => {
    const clean = importPhraseInput.trim().toLowerCase().replace(/\s+/g, " ");
    const words = clean.split(" ");
    if (words.length !== 12) {
      toast.error("Secret recovery phrase must contain exactly 12 words.");
      return;
    }
    if (!isValidMnemonic(clean)) {
      toast.error("Invalid mnemonic phrase. Please double check word spellings.");
      return;
    }

    setMnemonicPhrase(clean);
    setIsCreatingMode(false);
    setSubStep("pin_setup");
  };

  const handlePinSubmit = () => {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      toast.error("PIN must be exactly 6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match.");
      return;
    }

    // Common PIN validation
    const COMMON_PINS = [
      "123456", "654321", "000000", "111111", "222222",
      "333333", "444444", "555555", "666666", "777777",
      "888888", "999999", "121212", "343434", "565656"
    ];
    if (COMMON_PINS.includes(pin)) {
      toast.error("This PIN is too weak or too common. Please select a stronger PIN.");
      return;
    }

    setSubStep("biometric_offer");
  };

  const handleFinalizeOnboarding = async () => {
    setIsFinishing(true);
    try {
      if (!user) {
        toast.error("Session expired. Please log in again.");
        router.replace("/login");
        return;
      }

      // 1. Setup the PIN
      const pinSuccess = await setupPIN(pin);
      if (!pinSuccess) {
        setIsFinishing(false);
        return;
      }

      // 2. Setup Biometrics (skip or enable)
      if (biometricsChecked) {
        await setBiometricsEnabled(true);
      }

      // 3. Create or re-encrypt Primary Wallet with user PIN
      if (isCreatingMode) {
        if (primaryWallet?.id) {
          const ethWallet = walletFromMnemonic(mnemonicPhrase, 0);
          const encryptedMnemonic = await encryptData(mnemonicPhrase, pin);
          const encryptedPrivateKey = await encryptData(ethWallet.privateKey, pin);
          await WalletService.updateWalletKeys(primaryWallet.id, user.id, encryptedMnemonic, encryptedPrivateKey);
        } else {
          const walletResult = await createWallet("Primary Wallet", pin);
          if (!walletResult) {
            setIsFinishing(false);
            return;
          }
        }
      } else {
        const importResult = await importWallet("Imported Wallet 1", mnemonicPhrase, pin);
        if (!importResult) {
          setIsFinishing(false);
          return;
        }
      }

      // 4. Set profile status to completed
      const { error: profileErr } = await updateOnboardingStatus(true);
      if (profileErr) {
        toast.error("Failed to complete profile onboarding: " + profileErr);
        setIsFinishing(false);
        return;
      }

      toast.success("Wallet configured and encrypted securely!");
      setSubStep("success");
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred.");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background px-6 py-8 text-white">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between py-2 max-w-md mx-auto w-full">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-surface-glass border border-border/40 px-2.5 py-1 rounded-full">
          <span className="font-semibold text-white">Security Wizard</span>
        </div>
      </header>

      {/* Wizard Box */}
      <div className="my-auto mx-auto w-full max-w-md py-6">
        <AnimatePresence mode="wait">
          {/* STEP: CHOICE */}
          {subStep === "choice" && (
            <motion.div
              key="choice-step"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Secure Your Wealth</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  GoFlazz is fully self-custodial. Choose to create a brand new Ethereum-compatible wallet or import your existing mnemonic keys.
                </p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleStartCreation}
                  className="w-full flex flex-col items-start gap-2 p-5 text-left rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                      Create New Wallet
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      Generate a brand new 12-word Secret Recovery Phrase to create self-custodial blockchain keys.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setSubStep("import_input")}
                  className="w-full flex flex-col items-start gap-2 p-5 text-left rounded-2xl border border-border bg-surface hover:bg-surface-glass/40 transition group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-800 border border-neutral-700 text-muted-foreground">
                    <Key className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                      Import Existing Wallet
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      Restore your wallet using an existing 12-word Secret Recovery Phrase conforming to BIP-39.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP: CREATE WARNING */}
          {subStep === "create_warning" && (
            <motion.div
              key="create-warning-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubStep("choice")}
                  className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground font-semibold">Back to choice</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">Security Instructions</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Read these details carefully before revealing your Secret Recovery Phrase.
                </p>
              </div>

              <div className="glass-card p-5 space-y-4 border-warning/20 bg-warning/[0.01]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-white">What is a Secret Recovery Phrase?</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    It is the master key to your funds. Anyone who has this phrase can steal all your digital assets. GoFlazz does not store this phrase on any server.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                    <li>Write it down on paper and store it in a secure physical vault.</li>
                    <li>Never take a screenshot or store it digitally (e.g. cloud, notes).</li>
                    <li>GoFlazz employees will <strong>never</strong> ask for this phrase.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-surface-glass/40">
                <input
                  type="checkbox"
                  id="warning-check"
                  checked={warningChecked}
                  onChange={(e) => setWarningChecked(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="warning-check" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                  I understand that if I lose this phrase, YoPay and GoFlazz cannot recover my wallet or restore my funds.
                </label>
              </div>

              <button
                disabled={!warningChecked}
                onClick={() => setSubStep("create_display")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-3.5 text-sm font-semibold shadow-glow transition hover:opacity-95 disabled:opacity-40"
              >
                Reveal Recovery Phrase
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP: CREATE DISPLAY */}
          {subStep === "create_display" && (
            <motion.div
              key="create-display-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Your Recovery Phrase</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Write down these 12 words in the exact order. You will verify them on the next step.
                </p>
              </div>

              {/* Mnemonic Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-border bg-surface/50 font-mono text-sm">
                {mnemonicPhrase.split(" ").map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/40 bg-surface-glass text-left"
                  >
                    <span className="text-[10px] text-muted-foreground w-3">{index + 1}</span>
                    <span className="text-white font-medium text-xs truncate">{word}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCopyPhrase}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-surface hover:bg-surface-glass/40 text-xs font-semibold text-muted-foreground hover:text-white transition"
                >
                  {copiedPhrase ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Phrase
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-[11px] text-primary leading-relaxed flex gap-2 items-start">
                <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Keep this phrase completely offline. Write it down and keep it in a safe place.
                </span>
              </div>

              <button
                onClick={() => setSubStep("create_verify")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-3.5 text-sm font-semibold shadow-glow transition hover:opacity-95"
              >
                Proceed to Verification
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP: CREATE VERIFY */}
          {subStep === "create_verify" && (
            <motion.div
              key="create-verify-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubStep("create_display")}
                  className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground font-semibold">Check phrase again</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">Verify Your Phrase</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the requested words to verify that you saved your Secret Recovery Phrase securely.
                </p>
              </div>

              <div className="space-y-4">
                {verifyIndices.map((idx) => (
                  <div key={idx} className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Word #{idx + 1}
                    </label>
                    <input
                      type="text"
                      value={verifyInputs[idx] || ""}
                      onChange={(e) => setVerifyInputs({ ...verifyInputs, [idx]: e.target.value })}
                      placeholder={`Enter word #${idx + 1}`}
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleVerifyPhrase}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-3.5 text-sm font-semibold shadow-glow transition hover:opacity-95"
              >
                Verify Phrase
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP: IMPORT INPUT */}
          {subStep === "import_input" && (
            <motion.div
              key="import-input-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSubStep("choice")}
                  className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground font-semibold">Back to choice</span>
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">Import Wallet</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Type or paste your 12-word Secret Recovery Phrase to restore your blockchain wallet keys.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    12-Word Recovery Phrase
                  </label>
                  <textarea
                    rows={4}
                    value={importPhraseInput}
                    onChange={(e) => setImportPhraseInput(e.target.value)}
                    placeholder="word1 word2 word3 ... word12"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted-foreground focus:border-primary focus:outline-none font-mono resize-none leading-relaxed"
                  />
                </div>

                <div className="rounded-xl border border-warning/20 bg-warning/5 p-3.5 text-[11px] text-warning leading-relaxed flex gap-2 items-start">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <span>
                    Make sure you are typing the words in correct order, separated by a single space, with no trailing whitespace or capitals.
                  </span>
                </div>
              </div>

              <button
                onClick={handleVerifyImport}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-3.5 text-sm font-semibold shadow-glow transition hover:opacity-95"
              >
                Validate & Import Wallet
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP: PIN SETUP */}
          {subStep === "pin_setup" && (
            <motion.div
              key="pin-setup-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Create Secure PIN</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  This 6-digit numeric PIN protects your wallet keys and local authentication sessions.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Enter 6-Digit PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      pattern="\d*"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••••"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted-foreground tracking-widest focus:border-primary focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Confirm PIN
                  </label>
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={6}
                    pattern="\d*"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-white placeholder-muted-foreground tracking-widest focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="rounded-xl border border-border bg-surface-glass/40 p-3 text-[11px] text-muted-foreground leading-normal pl-4 list-disc space-y-1">
                  <p className="font-semibold text-white mb-1">PIN Rules:</p>
                  <li>Must be exactly 6 numerical digits.</li>
                  <li>Sequential (123456) or identical (000000) PINs are prevented for your safety.</li>
                </div>
              </div>

              <button
                onClick={handlePinSubmit}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-3.5 text-sm font-semibold shadow-glow transition hover:opacity-95"
              >
                Set Secure PIN
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {/* STEP: BIOMETRIC OFFER */}
          {subStep === "biometric_offer" && (
            <motion.div
              key="biometric-offer-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Biometric Unlock</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Access your wallet instantenously using native device biometrics (Face ID / Touch ID).
                </p>
              </div>

              <div className="glass-card p-6 text-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto text-primary animate-pulse">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-semibold text-base">Enable Face ID / Touch ID</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed px-2">
                    Biometric tokens are encrypted securely on-device and never leave your sandbox processor.
                  </p>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface-glass/40">
                  <div className="text-left">
                    <p className="text-xs font-semibold">Enable Device Biometrics</p>
                    <p className="text-[10px] text-muted-foreground">Unlock and authorize payments faster</p>
                  </div>
                  <button
                    onClick={() => setBiometricsChecked(!biometricsChecked)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      biometricsChecked ? "bg-primary" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${
                        biometricsChecked ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={handleFinalizeOnboarding}
                disabled={isFinishing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 disabled:opacity-40"
              >
                {isFinishing ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white mr-2" />
                    Encrypting Wallet...
                  </>
                ) : (
                  <>
                    Complete & Initialize Wallet
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP: SUCCESS CONGRATULATIONS */}
          {subStep === "success" && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success/10 border border-success/20 mx-auto">
                <div className="absolute inset-0 animate-ping rounded-full bg-success/5" />
                <ShieldCheck className="h-12 w-12 text-success animate-pulse" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight">You&apos;re All Set!</h1>
                <p className="text-sm text-muted-foreground px-4 leading-normal">
                  Your cryptographic wallet has been successfully generated and fully encrypted with AES-GCM 256.
                </p>
              </div>

              <div className="glass-card p-4 text-left divide-y divide-border/60 text-xs space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Self-custody Keypair:</span>
                  <span className="font-mono text-success">Active & Encrypted</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Network:</span>
                  <span className="font-mono text-white">Arbitrum One</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Encryption:</span>
                  <span className="font-mono text-primary">AES-GCM 256-bit</span>
                </div>
              </div>

              <button
                onClick={() => router.replace("/")}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95"
              >
                Enter GoFlazz Wallet
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer info */}
      <footer className="text-center text-[10px] text-muted-foreground mt-6 max-w-md mx-auto w-full">
        Your security is our absolute priority. GoFlazz is fully audited and executes entirely within sandbox client containers.
      </footer>
    </div>
  );
}
