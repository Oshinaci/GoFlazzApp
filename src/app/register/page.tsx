"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Mail, User, ShieldCheck, Check, X, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Logo from "@/components/layout/Logo";

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password validation rules
  const hasMinLen = password.length >= 8;
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumberSymbol = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
  const isPasswordStrong = hasMinLen && hasUpperLower && hasNumberSymbol;

  // Email validation rule
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!isEmailValid) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!isPasswordStrong) {
      toast.error("Please choose a stronger password");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error);
      setIsLoading(false);
    } else {
      toast.success("Account created successfully!");
      setIsSuccess(true);
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-white text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass-card max-w-md p-8 space-y-6 flex flex-col items-center"
        >
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
            <Mail className="h-10 w-10 text-primary animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Verify your email</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a secure verification link to <span className="font-semibold text-white">{email}</span>.
            </p>
          </div>

          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4 text-xs text-warning leading-relaxed">
            Please check your spam or promotions folder if you don&apos;t see the email within a couple of minutes. Once verified, you will be redirected automatically to complete onboarding.
          </div>

          <Link
            href="/login"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-800 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-700"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background px-6 py-8 text-white">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Back button */}
      <header className="flex items-center justify-between py-2 max-w-md mx-auto w-full">
        <Link
          href="/welcome"
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Link>
        <Logo size="sm" />
      </header>

      {/* Form Content */}
      <div className="my-auto mx-auto w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get started with your self-custodial wallet in seconds.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-4 text-sm text-white placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
            </div>
          </div>

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
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-4 text-sm text-white placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-12 text-sm text-white placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-muted-foreground hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password strength dynamic checklist */}
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
            <label className="text-xs font-medium text-muted-foreground">Confirm Password</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-surface-glass py-3.5 pl-11 pr-4 text-sm text-white placeholder-muted-foreground outline-none transition focus:border-primary focus:bg-surface/50"
              />
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-[11px] text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isPasswordStrong || password !== confirmPassword || !fullName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Log In
          </Link>
        </div>
      </div>

      {/* Footer footer */}
      <footer className="text-center text-[10px] text-muted-foreground mt-6 max-w-md mx-auto w-full">
        Your data is secured client-side using industry standard end-to-end cryptographic measures.
      </footer>
    </div>
  );
}
