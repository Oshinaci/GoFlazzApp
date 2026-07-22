"use client";

import { useEffect, useState, createContext, useContext, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { ProfileService, ProfileRecord } from "@/services/profile.service";
import { ActivityService } from "@/services/activity.service";
import { WalletService } from "@/services/wallet.service";

export interface Profile {
  id: string;
  display_name: string | null;
  username?: string | null;
  email: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateOnboardingStatus: (status: string | boolean) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch or create profile for authenticated user via ProfileService
  const fetchProfile = async (userId: string, userEmail: string, fullName?: string): Promise<Profile | null> => {
    try {
      // Ensure the user has an auto-created primary EVM wallet asynchronously
      WalletService.ensureDefaultWallet(userId).catch((err) => {
        console.error("[useAuth.fetchProfile.ensureDefaultWallet]", err);
      });

      const existing = await ProfileService.getProfile(userId);
      if (existing) {
        return existing as Profile;
      }

      // If no profile found, create one on-demand via service
      const defaultDisplayName = fullName || userEmail.split("@")[0] || "User";
      const created = await ProfileService.createProfile(userId, userEmail, defaultDisplayName);
      return created as Profile | null;
    } catch (e) {
      console.error("[useAuth.fetchProfile]", e);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      const updated = await fetchProfile(session.user.id, session.user.email ?? "");
      setProfile(updated);
    }
  };

  useEffect(() => {
    let active = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }: any) => {
      if (!active) return;
      setSession(initialSession);
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id, initialSession.user.email ?? "").then((prof) => {
          if (active) {
            setProfile(prof);
            setLoading(false);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event: any, currentSession: any) => {
      if (!active) return;
      setSession(currentSession);

      if (currentSession?.user) {
        if (event === "SIGNED_IN") {
          await ActivityService.logActivity(currentSession.user.id, "login", {
            user_agent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
          });
        }

        const prof = await fetchProfile(currentSession.user.id, currentSession.user.email ?? "");
        if (active) {
          setProfile(prof);
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [session?.user?.id]);

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        await fetchProfile(data.user.id, email, fullName);
      }

      setLoading(false);
      return { error: null };
    } catch (e: any) {
      setLoading(false);
      return { error: e.message || "An unexpected error occurred" };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setLoading(false);
        return { error: error.message };
      }
      setLoading(false);
      return { error: null };
    } catch (e: any) {
      setLoading(false);
      return { error: e.message || "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    setLoading(true);
    if (session?.user) {
      await ActivityService.logActivity(session.user.id, "logout");
    }
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });
      return { error: error?.message ?? null };
    } catch (e: any) {
      return { error: e.message || "An unexpected error occurred" };
    }
  };

  const updateOnboardingStatus = async (status: string | boolean) => {
    if (!session?.user) return { error: "No authenticated user session found" };
    try {
      const result = await ProfileService.updateOnboardingStatus(session.user.id, status);
      if (result.error) return result;

      const isCompleted = typeof status === "boolean" ? status : status === "completed";
      setProfile((prev) => (prev ? { ...prev, onboarding_completed: isCompleted } : null));

      await ActivityService.logActivity(session.user.id, `onboarding_${isCompleted ? "completed" : "incomplete"}`);

      return { error: null };
    } catch (e: any) {
      return { error: e.message || "An unexpected error occurred" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateOnboardingStatus,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
