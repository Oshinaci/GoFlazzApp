"use client";

import React, { useState, useEffect } from "react";
import ActionPageHeader from "@/components/layout/ActionPageHeader";
import {
  UserPlus,
  Search,
  Trash2,
  Edit2,
  Send,
  Copy,
  Star,
  CheckCircle2,
  X,
  User,
  ExternalLink,
} from "lucide-react";
import { ContactsService, ContactRecord } from "@/services/contacts.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_FAVORITE_CONTACTS: Partial<ContactRecord>[] = [
  { id: "c1", name: "Alice Ether", address: "0x8f2a7219bc82d0291938bc1982b1892837bc19bC", label: "Friend" },
  { id: "c2", name: "Bob Arbitrum", address: "0x1a3F7cE22938127381273912837bc19bC84a8893", label: "Colleague" },
  { id: "c3", name: "Warung Kopi Senja", address: "0x5c1D88Fe2938127381273912837bc19bC84a8893", label: "Merchant" },
];

export default function AddressBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [label, setLabel] = useState<string>("Personal");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    async function loadContacts() {
      if (user?.id) {
        try {
          const list = await ContactsService.getContacts(user.id);
          if (list.length > 0) {
            setContacts(list);
            return;
          }
        } catch (err) {
          console.warn("Failed to load contacts from DB, fallback to default", err);
        }
      }
      setContacts(DEFAULT_FAVORITE_CONTACTS as ContactRecord[]);
    }
    loadContacts();
  }, [user]);

  const handleSaveContact = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error("Please fill in both Name and Wallet Address.");
      return;
    }
    if (!address.startsWith("0x") || address.length < 10) {
      toast.error("Please enter a valid EVM address.");
      return;
    }

    setIsSaving(true);
    try {
      if (user?.id) {
        const created = await ContactsService.addContact(user.id, { name, address, label });
        setContacts((prev) => [created, ...prev]);
      } else {
        const newContact: ContactRecord = {
          id: `local-${Date.now()}`,
          user_id: "local",
          name,
          address,
          label,
        };
        setContacts((prev) => [newContact, ...prev]);
      }
      toast.success("Contact saved to Favorite Addresses!");
      setShowAddModal(false);
      setName("");
      setAddress("");
      setLabel("Personal");
    } catch (err: any) {
      toast.error(err.message || "Failed to save contact.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    try {
      if (user?.id && !id.startsWith("local-") && !id.startsWith("c")) {
        await ContactsService.deleteContact(user.id, id);
      }
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success("Contact removed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete contact.");
    }
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied to clipboard!");
  };

  const handleQuickSend = (addr: string) => {
    router.push(`/send?recipient=${encodeURIComponent(addr)}`);
  };

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-background pb-24">
      <ActionPageHeader title="Favorite Addresses" backHref="/" />

      <div className="container mt-4 max-w-md space-y-5 px-4">
        {/* TOP BAR ACTIONS */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search address or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card py-2.5 pl-10 pr-4 text-xs text-foreground outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-2xl bg-primary px-3.5 py-2.5 text-xs font-bold text-black shadow-md hover:bg-primary/90"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>

        {/* ADDRESS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Saved Contacts ({filtered.length})</span>
          </div>

          <div className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden">
            {filtered.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-3.5 hover:bg-foreground/5 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
                    {contact.name[0].toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                      <span>{contact.name}</span>
                      {contact.label && (
                        <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-[10px] text-muted-foreground font-normal">
                          {contact.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono mt-0.5">
                      <span>{contact.address.slice(0, 8)}...{contact.address.slice(-6)}</span>
                      <Copy
                        onClick={() => handleCopyAddress(contact.address)}
                        className="h-3 w-3 hover:text-foreground cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleQuickSend(contact.address)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-black transition"
                    title="Send to contact"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-400 hover:bg-rose-500/10 transition"
                    title="Delete contact"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD CONTACT MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 text-foreground shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">Add New Favorite Address</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-foreground/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted-foreground font-medium">Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Satoshi Nakamoto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground font-medium">Wallet EVM Address</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-foreground font-mono outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground font-medium">Label Tag</label>
                  <select
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-border bg-background p-3 text-foreground outline-none focus:border-primary"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Friend">Friend</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Work">Work</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSaveContact}
                disabled={isSaving}
                className="w-full rounded-2xl bg-primary py-3 text-xs font-bold text-black disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Address"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
