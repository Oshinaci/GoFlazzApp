"use client";

import Link from "next/link";
import { ArrowRight, Chrome, ShieldAlert, KeyRound, Twitter, MessageCircle, Gamepad2, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "@/components/layout/Logo";

const AppPreview = () => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="relative mx-auto mt-12 mb-20 w-full max-w-[280px] sm:max-w-[320px] aspect-[9/19] rounded-[2.5rem] border-[8px] border-slate-900 bg-black shadow-2xl overflow-hidden ring-1 ring-white/10"
  >
    {/* Dynamic Island Notch Mock */}
    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
    
    {/* Inner App Content Fake Layout */}
    <div className="absolute inset-0 bg-background flex flex-col pt-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/20" />
        <div className="w-20 h-3 rounded-full bg-muted" />
        <div className="w-8 h-8 rounded-full bg-surface" />
      </div>
      <div className="space-y-3">
        <div className="h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 border border-primary/20" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-12 rounded-xl bg-surface" />)}
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 w-24 bg-muted rounded-full mb-4" />
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl bg-surface" />)}
        </div>
      </div>
    </div>
    
    {/* Ambient Glow behind the phone */}
    <div className="absolute -inset-10 bg-primary/20 blur-[60px] -z-10 rounded-full" />
  </motion.div>
);

export default function WelcomePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground overflow-hidden">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
        <div className="h-[600px] w-[800px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Top Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between px-6 py-6 max-w-5xl mx-auto w-full"
      >
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition">
            Log In
          </Link>
          <Link href="/register" className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-xl hover:opacity-90 transition">
            Get Started
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-24 text-center max-w-5xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center text-left">
          <div className="space-y-8 max-w-lg mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Welcome to Web3
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                Crypto, as easy as <span className="text-gradient">using GoPay</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                The simplicity of a modern digital wallet combined with the ultimate security of self-custody. Send, receive, and trade in seconds.
              </p>
            </motion.div>

            {/* Action Buttons Block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              <Link
                href="/register"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-blue-gradient px-8 py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 hover:-translate-y-0.5"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-border bg-surface-glass px-8 py-4 text-sm font-semibold text-foreground transition hover:bg-foreground/5"
              >
                Sign In
              </Link>
            </motion.div>
          </div>
          
          {/* Right side App Preview */}
          <div className="w-full flex justify-center lg:justify-end">
            <AppPreview />
          </div>
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-border/50 bg-surface/30">
        <div className="max-w-5xl mx-auto px-6 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="text-sm text-muted-foreground ml-2">© 2026 GoFlazz. All rights reserved.</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition">Terms of Service</Link>
            <Link href="#" className="hover:text-foreground transition">Privacy Policy</Link>
            <Link href="#" className="hover:text-foreground transition">Help Center</Link>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="p-2 rounded-full bg-surface border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition group">
              <Twitter className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a href="#" className="p-2 rounded-full bg-surface border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition group">
              <MessageCircle className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a href="#" className="p-2 rounded-full bg-surface border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition group">
              {/* Discord-like icon since lucide discord is not standard, Gamepad2 is a good alternative for gaming/community */}
              <Gamepad2 className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
