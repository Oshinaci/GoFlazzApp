"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Logo from "@/components/layout/Logo";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    let active = true;

    const processAuth = async () => {
      try {
        // Let Supabase parse the URL hash/query and fetch the session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback session error:", error);
          if (active) {
            toast.error("Could not establish a secure session: " + error.message);
            router.replace("/login");
          }
          return;
        }

        // Wait a short duration to ensure session listener updates and profile sync completes
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (!active) return;

        if (session) {
          toast.success("Security token successfully verified!");
          await refreshProfile(); // Force refresh profile state
          router.replace("/onboarding");
        } else {
          // If no session, wait another second just in case of slow connection
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (active) {
            if (retrySession) {
              toast.success("Security token verified!");
              await refreshProfile();
              router.replace("/onboarding");
            } else {
              toast.error("Email verification expired or invalid. Please request a new link.");
              router.replace("/login");
            }
          }
        }
      } catch (err: any) {
        console.error("Auth callback exception:", err);
        if (active) {
          toast.error("An unexpected error occurred during verification.");
          router.replace("/login");
        }
      }
    };

    processAuth();

    return () => {
      active = false;
    };
  }, [router, refreshProfile]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Animated pulsing outer ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/15" />
          {/* Dual spinning concentric rings */}
          <div className="absolute h-16 w-16 animate-spin rounded-full border-t-2 border-l-2 border-primary" />
          <div className="absolute h-20 w-20 animate-spin rounded-full border-b-2 border-r-2 border-primary/40 [animation-direction:reverse]" />
          <div className="absolute">
            <Logo size="sm" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">Verifying Identity</h2>
          <p className="text-xs text-muted-foreground animate-pulse max-w-xs">
            Connecting to secure enclave, validating email certificates, and establishing session keys...
          </p>
        </div>
      </div>
    </div>
  );
}
