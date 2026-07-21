"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Logo from "./Logo";

const PUBLIC_ROUTES = [
  "/welcome",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

const ONBOARDING_ROUTES = ["/onboarding"];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (loading || !mounted) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isOnboarding = ONBOARDING_ROUTES.includes(pathname);

    if (!session) {
      // User is NOT logged in
      if (!isPublic) {
        // Trying to access protected or onboarding pages -> Redirect to Welcome
        router.replace("/welcome");
      }
    } else {
      // User IS logged in
      const isCompleted = profile?.onboarding_completed ?? false;

      if (isCompleted) {
        // Onboarding complete: cannot access public or onboarding screens
        if (isPublic || isOnboarding) {
          router.replace("/");
        }
      } else {
        // Onboarding is incomplete
        if (!isOnboarding && !isPublic) {
          // Trying to access protected pages -> Redirect to Onboarding
          router.replace("/onboarding");
        }
      }
    }
  }, [session, profile, loading, pathname, router, mounted]);

  // Prevent flash of unauthenticated content during loading or redirection
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isOnboarding = ONBOARDING_ROUTES.includes(pathname);
  const isCompleted = profile?.onboarding_completed ?? false;

  const shouldShowContent = () => {
    if (!mounted || loading) return false;
    if (!session) return isPublic;
    if (isCompleted) return !isPublic && !isOnboarding;
    return isOnboarding || isPublic;
  };

  if (!mounted || loading || !shouldShowContent()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Pulsing glow ring */}
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            {/* Spinning gradient ring */}
            <div className="h-16 w-16 animate-spin rounded-full border-t-2 border-r-2 border-primary" />
            <div className="absolute">
              <Logo size="sm" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold tracking-tight text-white">GoFlazz</h2>
            <p className="text-xs text-muted-foreground mt-1">Securing connection...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
