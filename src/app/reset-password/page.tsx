"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, ShieldCheck, Check, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Logo from "@/components/layout/Logo";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Password validation rules
  const hasMinLen = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumberSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLen && hasUpperLower && hasNumberSymbol;

  // Let's ensure the user actually came from a reset link / has a session or token
  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      if (!data?.session) {
        // Fallback or warning, though we can still try to let them update if Supabase has the recovery flow active in hash
        console.log("No active session on load, waiting for token handling");
      }
    });
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      toast.error("Please choose a stronger password");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setErrorText(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorText(error.message);
        toast.error(error.message);
        setIsLoading(false);
      } else {
        toast.success("Password updated successfully!");
        // Log user out so they can log in fresh with their new password
        await supabase.auth.signOut();
        setTimeout(() => {
          router.replace("/login");
        }, 1500);
      }
    } catch (e: any) {
      setErrorText(e.message || "An unexpected error occurred.");
      toast.error(e.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background px-6 py-8 text-foreground">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="flex justify-center py-2 max-w-md mx-auto w-full">
        <Logo size="sm" />
      </header>

      {/* Form Content */}
      <div className="my-auto mx-auto w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Choose a strong, unique password to secure your digital assets.
          </p>
        </div>

        {errorText && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset Failed</p>
              <p className="mt-0.5 opacity-90">{errorText}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-12 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength checklist */}
            {password.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-surface-glass/40 p-3 space-y-2 mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Password Requirements
                </p>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    {hasMinLen ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className={hasMinLen ? "text-success" : "text-muted-foreground"}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUpperLower ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className={hasUpperLower ? "text-success" : "text-muted-foreground"}>
                      Uppercase & lowercase letters
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNumberSymbol ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-destructive" />
                    )}
                    <span className={hasNumberSymbol ? "text-success" : "text-muted-foreground"}>
                      Number or special character
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Confirm New Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-[11px] text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isPasswordStrong || password !== confirmPassword}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-white" />
            ) : (
              "Save & Login"
            )}
          </button>
        </form>
      </div>

      {/* Footer footer */}
      <footer className="text-center text-[10px] text-muted-foreground mt-6 max-w-md mx-auto w-full">
        Once updated, you will need to re-login with your new passcode to restore active session.
      </footer>
    </div>
  );
}
