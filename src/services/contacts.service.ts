import { supabase } from "@/lib/supabaseClient";

export interface ContactRecord {
  id: string;
  user_id: string;
  name: string;
  address: string;
  label?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class ContactsService {
  /**
   * Get all address book contacts for a user
   */
  static async getContacts(userId: string): Promise<ContactRecord[]> {
    const { data, error } = await supabase
      .from("wallet_contacts")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (error) {
      console.error("[ContactsService.getContacts]", error);
      return [];
    }

    return (data || []) as ContactRecord[];
  }

  /**
   * Add a new contact to address book
   */
  static async addContact(userId: string, contact: { name: string; address: string; label?: string }): Promise<ContactRecord> {
    const { data, error } = await supabase
      .from("wallet_contacts")
      .insert({
        user_id: userId,
        name: contact.name.trim(),
        address: contact.address.trim(),
        label: contact.label?.trim() || "Personal",
      })
      .select()
      .single();

    if (error) {
      console.error("[ContactsService.addContact]", error);
      throw error;
    }

    return data as ContactRecord;
  }

  /**
   * Update an existing contact
   */
  static async updateContact(userId: string, id: string, contact: { name: string; address: string; label?: string }): Promise<void> {
    const { error } = await supabase
      .from("wallet_contacts")
      .update({
        name: contact.name.trim(),
        address: contact.address.trim(),
        label: contact.label?.trim() || "Personal",
      })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[ContactsService.updateContact]", error);
      throw error;
    }
  }

  /**
   * Delete a contact from address book
   */
  static async deleteContact(userId: string, id: string): Promise<void> {
    const { error } = await supabase
      .from("wallet_contacts")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("[ContactsService.deleteContact]", error);
      throw error;
    }
  }
}
