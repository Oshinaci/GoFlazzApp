"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Logo from "@/components/layout/Logo";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorText(null);

    const { error } = await resetPassword(email);

    if (error) {
      setErrorText(error);
      toast.error(error);
      setIsLoading(false);
    } else {
      toast.success("Password reset link sent to your email!");
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground text-center">
        <div className="glass-card max-w-md p-8 space-y-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Please click the link in the email to securely choose a new passcode.
          </p>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-gradient py-3.5 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background px-6 py-8 text-foreground">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Back button */}
      <header className="flex items-center justify-between py-2 max-w-md mx-auto w-full">
        <Link
          href="/login"
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>
        <Logo size="sm" />
      </header>

      {/* Form Content */}
      <div className="my-auto mx-auto w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Enter your email and we&apos;ll send you a secure link to restore access.
          </p>
        </div>

        {errorText && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Request Failed</p>
              <p className="mt-0.5 opacity-90">{errorText}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleResetRequest} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-4 text-sm text-foreground placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-white" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>
      </div>

      {/* Footer footer */}
      <footer className="text-center text-[10px] text-muted-foreground mt-6 max-w-md mx-auto w-full">
        Self-custodial design ensures your private key is never transmitted or stored on our servers.
      </footer>
    </div>
  );
}
