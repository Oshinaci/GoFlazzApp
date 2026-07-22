"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Mail, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Logo from "@/components/layout/Logo";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorText(null);

    const { error } = await signIn(email, password);

    if (error) {
      let friendlyError = error;
      
      // Parse common Supabase error patterns to offer premium fintech-grade feedback
      if (error.includes("Invalid login credentials")) {
        friendlyError = "The email or password you entered is incorrect.";
      } else if (error.includes("Email not confirmed")) {
        friendlyError = "Your email has not been verified yet. Please click the link in your verification email.";
      } else if (error.includes("rate limit")) {
        friendlyError = "Too many failed attempts. Please wait a few minutes before trying again.";
      } else if (error.includes("Failed to fetch")) {
        friendlyError = "Network error. Please check your internet connection.";
      }

      setErrorText(friendlyError);
      toast.error(friendlyError);
      setIsLoading(false);
    } else {
      toast.success("Successfully logged in!");
      
      if (rememberMe) {
        localStorage.setItem("goflazz_remember_email", email);
      } else {
        localStorage.removeItem("goflazz_remember_email");
      }

      router.replace("/");
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background px-6 py-8 text-foreground">
      {/* Background ambient light */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-10 flex justify-center overflow-hidden">
        <div className="h-[400px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      {/* Back button */}
      <header className="flex items-center justify-between py-2 max-w-md mx-auto w-full">
        <Link
          href="/welcome"
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </Link>
        <Logo size="sm" />
      </header>

      {/* Form Content */}
      <div className="my-auto mx-auto w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log in to manage and monitor your digital assets.
          </p>
        </div>

        {/* Diagnostic error box */}
        {errorText && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive leading-relaxed">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Login Failed</p>
              <p className="mt-0.5 opacity-90">{errorText}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
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
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border bg-surface-glass text-primary focus:ring-primary/60 outline-none"
              />
              <span className="text-xs text-muted-foreground">Remember Me</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-gradient py-4 text-sm font-semibold shadow-glow transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
          >
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-foreground/20 border-t-white" />
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Footer footer */}
      <footer className="text-center text-[10px] text-muted-foreground mt-6 max-w-md mx-auto w-full">
        Self-custody means you are in total control of your keys. Please store them securely.
      </footer>
    </div>
  );
}
