import { supabase, safeStringify } from "@/lib/supabaseClient";

export interface ContactRecord {
  id: string;
  user_id: string;
  name: string;
  address: string;
  label?: string | null;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_CONTACTS: ContactRecord[] = [
  { id: "c1", user_id: "default", name: "Alice Ether", address: "0x8f2a7219bc82d0291938bc1982b1892837bc19bC", label: "Friend" },
  { id: "c2", user_id: "default", name: "Bob Arbitrum", address: "0x1a3F7cE22938127381273912837bc19bC84a8893", label: "Colleague" },
  { id: "c3", user_id: "default", name: "Warung Kopi Senja", address: "0x5c1D88Fe2938127381273912837bc19bC84a8893", label: "Merchant" },
];

function getLocalContacts(userId: string): ContactRecord[] {
  if (typeof window === "undefined") return DEFAULT_CONTACTS;
  const key = `contacts_${userId}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (_) {}
  }
  localStorage.setItem(key, safeStringify(DEFAULT_CONTACTS));
  return DEFAULT_CONTACTS;
}

function saveLocalContacts(userId: string, contacts: ContactRecord[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`contacts_${userId}`, safeStringify(contacts));
  }
}

export class ContactsService {
  /**
   * Get all address book contacts for a user
   */
  static async getContacts(userId: string): Promise<ContactRecord[]> {
    try {
      const { data, error } = await supabase
        .from("wallet_contacts")
        .select("*")
        .eq("user_id", userId)
        .order("name", { ascending: true });

      if (error || !data || data.length === 0) {
        return getLocalContacts(userId);
      }

      return data as ContactRecord[];
    } catch (_) {
      return getLocalContacts(userId);
    }
  }

  /**
   * Add a new contact to address book
   */
  static async addContact(userId: string, contact: { name: string; address: string; label?: string }): Promise<ContactRecord> {
    const newContact: ContactRecord = {
      id: "cnt_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      user_id: userId,
      name: contact.name.trim(),
      address: contact.address.trim(),
      label: contact.label?.trim() || "Personal",
      created_at: new Date().toISOString(),
    };

    const localList = getLocalContacts(userId);
    saveLocalContacts(userId, [newContact, ...localList]);

    try {
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

      if (!error && data) {
        return data as ContactRecord;
      }
    } catch (_) {}

    return newContact;
  }

  /**
   * Update an existing contact
   */
  static async updateContact(userId: string, id: string, contact: { name: string; address: string; label?: string }): Promise<void> {
    const localList = getLocalContacts(userId);
    const updated = localList.map((c) =>
      c.id === id
        ? { ...c, name: contact.name.trim(), address: contact.address.trim(), label: contact.label?.trim() || "Personal" }
        : c
    );
    saveLocalContacts(userId, updated);

    try {
      await supabase
        .from("wallet_contacts")
        .update({
          name: contact.name.trim(),
          address: contact.address.trim(),
          label: contact.label?.trim() || "Personal",
        })
        .eq("id", id)
        .eq("user_id", userId);
    } catch (_) {}
  }

  /**
   * Delete a contact from address book
   */
  static async deleteContact(userId: string, id: string): Promise<void> {
    const localList = getLocalContacts(userId);
    const remaining = localList.filter((c) => c.id !== id);
    saveLocalContacts(userId, remaining);

    try {
      await supabase
        .from("wallet_contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
    } catch (_) {}
  }
}
