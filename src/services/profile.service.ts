import { supabase } from "@/lib/supabaseClient";

export interface ProfileRecord {
  id: string;
  display_name: string | null;
  username?: string | null;
  email: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ProfileService {
  /**
   * Fetch profile by id (auth.users.id)
   */
  static async getProfile(userId: string): Promise<ProfileRecord | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
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
        id: userId,
        display_name: displayName,
        email: email,
        onboarding_completed: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[ProfileService.createProfile]", insertError);
      return null;
    }

    return newProfile as ProfileRecord;
  }

  /**
   * Update onboarding_completed status
   */
  static async updateOnboardingStatus(userId: string, status: string | boolean): Promise<{ error: string | null }> {
    const isCompleted = typeof status === "boolean" ? status : status === "completed";
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: isCompleted })
      .eq("id", userId);

    if (error) {
      console.error("[ProfileService.updateOnboardingStatus]", error);
      return { error: error.message };
    }

    return { error: null };
  }
}
