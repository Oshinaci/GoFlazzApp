import { supabase } from "@/lib/supabaseClient";

export interface ProfileRecord {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  onboarding_status: string;
  created_at?: string;
  updated_at?: string;
}

export class ProfileService {
  /**
   * Fetch profile by user_id
   */
  static async getProfile(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("[ProfileService.getProfile]", error);
      return null;
    }

    return data as ProfileRecord | null;
  }

  /**
   * Create an on-demand profile
   */
  static async createProfile(userId: string, email: string, displayName: string): Promise<ProfileRecord | null> {
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        user_id: userId,
        display_name: displayName,
        email: email,
        onboarding_status: "incomplete",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[ProfileService.createProfile]", insertError);
      return null;
    }

    // Also populate wallet_profiles
    await supabase.from("wallet_profiles").insert({
      user_id: userId,
      display_name: displayName,
      email: email,
      onboarding_status: "incomplete",
    });

    return newProfile as ProfileRecord;
  }

  /**
   * Update onboarding status
   */
  static async updateOnboardingStatus(userId: string, status: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_status: status })
      .eq("user_id", userId);

    if (error) {
      console.error("[ProfileService.updateOnboardingStatus]", error);
      return { error: error.message };
    }

    await supabase.from("wallet_profiles").update({ onboarding_status: status }).eq("user_id", userId);

    return { error: null };
  }
}
