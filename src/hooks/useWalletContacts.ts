"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ContactsService, ContactRecord } from "@/services/contacts.service";
import { isValidAddress } from "@/lib/wallet";
import { toast } from "sonner";

export interface Contact {
  id: string;
  name: string;
  address: string;
  label?: string;
  created_at?: string;
}

export function useWalletContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const fetchContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      return;
    }
    const data = await ContactsService.getContacts(user.id);
    setContacts(data.map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      label: c.label || undefined,
      created_at: c.created_at,
    })));
  }, [user]);

  const addContact = async (name: string, address: string, label?: string): Promise<boolean> => {
    if (!user) return false;
    if (!name.trim()) {
      toast.error("Contact name cannot be empty.");
      return false;
    }
    if (!isValidAddress(address)) {
      toast.error("Invalid Ethereum address format.");
      return false;
    }

    try {
      await ContactsService.addContact(user.id, { name, address, label });
      await fetchContacts();
      toast.success("Contact added successfully!");
      return true;
    } catch (err: any) {
      toast.error("Failed to add contact: " + err.message);
      return false;
    }
  };

  const updateContact = async (id: string, name: string, address: string, label?: string): Promise<boolean> => {
    if (!user) return false;
    if (!name.trim()) {
      toast.error("Contact name cannot be empty.");
      return false;
    }
    if (!isValidAddress(address)) {
      toast.error("Invalid Ethereum address format.");
      return false;
    }

    try {
      await ContactsService.updateContact(user.id, id, { name, address, label });
      await fetchContacts();
      toast.success("Contact updated successfully!");
      return true;
    } catch (err: any) {
      toast.error("Failed to update contact: " + err.message);
      return false;
    }
  };

  const deleteContact = async (id: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await ContactsService.deleteContact(user.id, id);
      await fetchContacts();
      toast.success("Contact deleted.");
      return true;
    } catch (err: any) {
      toast.error("Failed to delete contact: " + err.message);
      return false;
    }
  };

  return {
    contacts,
    fetchContacts,
    addContact,
    updateContact,
    deleteContact,
  };
}
