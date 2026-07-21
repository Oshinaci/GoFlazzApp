"use client";

import Link from "next/link";
import { ArrowRight, Chrome, ShieldAlert, KeyRound } from "lucide-react";
import { motion } from "motion/react";
import Logo from "@/components/layout/Logo";

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background px-6 py-12 text-white">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Top Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center py-4"
      >
        <Logo size="md" />
      </motion.header>

      {/* Hero Visual Block */}
      <div className="my-auto flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/10 bg-surface-glass shadow-glow"
        >
          {/* Decorative floating orbits */}
          <div className="absolute -top-1 -right-1 h-3 w-3 animate-ping rounded-full bg-success" />
          <KeyRound className="h-14 w-14 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-glass px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className="h-1 w-1 rounded-full bg-success" /> Self-Custodial · Arbitrum
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Crypto, as easy as <span className="text-gradient">using GoPay</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            The simplicity of a modern digital wallet combined with the ultimate security of self-custody.
          </p>
        </motion.div>
      </div>

      {/* Action Buttons Block */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mx-auto w-full max-w-md space-y-4"
      >
        {/* Create Account */}
        <Link
          href="/register"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 active:scale-[0.98]"
        >
          Create Account
          <ArrowRight className="h-4 w-4" />
        </Link>

        {/* Login */}
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-2xl border border-border bg-surface-glass py-4 text-sm font-semibold text-white transition hover:bg-white/5 active:scale-[0.98]"
        >
          Log In
        </Link>

        {/* Continue with Google placeholder */}
        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-background px-3 text-xs text-muted-foreground">or</span>
        </div>

        <button
          disabled
          className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-2xl border border-border/40 bg-surface-glass/40 py-4 text-sm font-medium text-muted-foreground opacity-60"
        >
          <Chrome className="h-4 w-4" />
          Continue with Google
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[9px] text-muted-foreground">SOON</span>
        </button>

        {/* Bottom Terms & Privacy Policy */}
        <div className="pt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="#" className="underline hover:text-white transition">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline hover:text-white transition">
            Privacy Policy
          </Link>
          .
        </div>
      </motion.div>
    </div>
  );
}
