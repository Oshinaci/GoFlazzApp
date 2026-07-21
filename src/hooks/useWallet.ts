"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, HDNodeWallet, Mnemonic } from "ethers";
import { generateMnemonic, isValidMnemonic, walletFromMnemonic, isValidAddress } from "@/lib/wallet";
import { encryptData, decryptData, hashPin, generateSalt } from "@/lib/encryption";
import { toast } from "sonner";

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  is_primary: boolean;
  network: string;
  created_at?: string;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  label?: string;
  created_at?: string;
}

export interface WalletSecurityState {
  pin_hash: string;
  pin_attempts: number;
  locked_until: string | null;
  biometrics_enabled: boolean;
}

export const SUPPORTED_NETWORKS = [
  { id: "arbitrum", name: "Arbitrum One", isPrimary: true, icon: "⚡" },
  { id: "ethereum", name: "Ethereum", isPrimary: false, icon: "⟠" },
  { id: "base", name: "Base", isPrimary: false, icon: "🔵" },
  { id: "optimism", name: "Optimism", isPrimary: false, icon: "🔴" },
  { id: "polygon", name: "Polygon", isPrimary: false, icon: "💜" },
  { id: "bnb", name: "BNB Chain", isPrimary: false, icon: "🟡" },
];

const COMMON_PINS = [
  "123456", "654321", "000000", "111111", "222222", 
  "333333", "444444", "555555", "666666", "777777", 
  "888888", "999999", "121212", "343434", "565656"
];

export function useWallet() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [activeWallet, setActiveWallet] = useState<WalletAccount | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<string>("arbitrum");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [securityState, setSecurityState] = useState<WalletSecurityState | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync / refresh wallets
  const refreshWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setActiveWallet(null);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch Wallets
      const { data: walletData, error: walletErr } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (walletErr) throw walletErr;

      const formattedWallets: WalletAccount[] = (walletData || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        address: w.address,
        is_primary: w.is_primary,
        network: w.network,
        created_at: w.created_at,
      }));

      setWallets(formattedWallets);

      // 2. Fetch User Wallet Preferences (active wallet, active network)
      const { data: prefData } = await supabase
        .from("wallet_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      const activeWalletId = prefData?.active_wallet_id;
      const storedNetwork = prefData?.active_network || "arbitrum";
      setActiveNetwork(storedNetwork);

      if (formattedWallets.length > 0) {
        const found = formattedWallets.find((w) => w.id === activeWalletId);
        const primary = formattedWallets.find((w) => w.is_primary) || formattedWallets[0];
        setActiveWallet(found || primary);
      } else {
        setActiveWallet(null);
      }

      // 3. Fetch Contacts / Address Book
      const { data: contactsData } = await supabase
        .from("wallet_contacts")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      setContacts((contactsData || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        address: c.address,
        label: c.label,
        created_at: c.created_at,
      })));

      // 4. Fetch Wallet Security Details
      const { data: secData } = await supabase
        .from("wallet_security")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (secData) {
        setSecurityState({
          pin_hash: secData.pin_hash,
          pin_attempts: secData.pin_attempts,
          locked_until: secData.locked_until,
          biometrics_enabled: secData.biometrics_enabled,
        });
      }
    } catch (err: any) {
      console.error("Error refreshing wallet state:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshWallets();
  }, [refreshWallets]);

  // Primary wallet shortcut
  const primaryWallet = wallets.find((w) => w.is_primary) ?? wallets[0] ?? null;

  /**
   * Helper: Update user preferences in DB
   */
  const updatePreferences = async (walletId: string, network: string) => {
    if (!user) return;
    await supabase
      .from("wallet_preferences")
      .upsert({
        user_id: user.id,
        active_wallet_id: walletId,
        active_network: network,
      }, { onConflict: "user_id" });
  };

  /**
   * PIN setup & validation rules
   */
  const setupPIN = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    if (pin.length < 6 || !/^\d+$/.test(pin)) {
      toast.error("PIN must be exactly 6 digits.");
      return false;
    }
    if (COMMON_PINS.includes(pin)) {
      toast.error("This PIN is too common. Please select a stronger PIN.");
      return false;
    }

    try {
      const pin_hash = await hashPin(pin, user.id);
      const { error } = await supabase
        .from("wallet_security")
        .upsert({
          user_id: user.id,
          pin_hash,
          pin_attempts: 0,
          locked_until: null,
          biometrics_supported: typeof window !== "undefined" && !!window.PublicKeyCredential,
          biometrics_enabled: false,
        }, { onConflict: "user_id" });

      if (error) throw error;
      await refreshWallets();
      return true;
    } catch (err: any) {
      toast.error("Failed to setup PIN: " + err.message);
      return false;
    }
  };

  /**
   * Verify PIN & enforce retry/locking constraints
   */
  const verifyPIN = async (pin: string): Promise<boolean> => {
    if (!user) return false;

    // Check existing lock status
    const { data: secData } = await supabase
      .from("wallet_security")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (secData?.locked_until) {
      const lockTime = new Date(secData.locked_until).getTime();
      const now = new Date().getTime();
      if (now < lockTime) {
        const remainingSecs = Math.ceil((lockTime - now) / 1000);
        toast.error(`Wallet is temporarily locked due to too many attempts. Try again in ${remainingSecs}s.`);
        return false;
      }
    }

    try {
      const inputHash = await hashPin(pin, user.id);
      const storedHash = secData?.pin_hash;

      if (!storedHash) {
        toast.error("No PIN is configured yet.");
        return false;
      }

      if (inputHash === storedHash) {
        // Reset pin attempts
        await supabase
          .from("wallet_security")
          .update({ pin_attempts: 0, locked_until: null })
          .eq("user_id", user.id);
        
        await refreshWallets();
        return true;
      } else {
        const nextAttempts = (secData?.pin_attempts || 0) + 1;
        let lockedUntil = null;

        if (nextAttempts >= 5) {
          // Lock for 5 minutes
          lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          toast.error("Too many failed attempts. Your wallet access is locked for 5 minutes.");
        } else {
          toast.error(`Incorrect PIN. ${5 - nextAttempts} attempts remaining.`);
        }

        await supabase
          .from("wallet_security")
          .update({ pin_attempts: nextAttempts, locked_until: lockedUntil })
          .eq("user_id", user.id);

        await refreshWallets();
        return false;
      }
    } catch (err: any) {
      toast.error("Failed to verify PIN: " + err.message);
      return false;
    }
  };

  /**
   * Enable/disable biometric lock
   */
  const setBiometricsEnabled = async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from("wallet_security")
        .update({ biometrics_enabled: enabled })
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshWallets();
      return true;
    } catch (err: any) {
      toast.error("Failed updating biometric status: " + err.message);
      return false;
    }
  };

  /**
   * Create fully-conforming BIP-39 / BIP-44 self-custodial wallet
   */
  const createWallet = async (name: string, pin: string): Promise<{ address: string; mnemonic: string } | null> => {
    if (!user) return null;

    try {
      // 1. Verify PIN before executing critical operations
      const isPinValid = await verifyPIN(pin);
      if (!isPinValid) return null;

      const mnemonicPhrase = generateMnemonic();
      const ethWallet = walletFromMnemonic(mnemonicPhrase, wallets.length); // auto-increment index for additional wallets
      
      const privateKey = ethWallet.privateKey;
      const address = ethWallet.address;

      // 2. Encrypt sensitive credentials with AES-GCM 256
      const encryptedMnemonic = await encryptData(mnemonicPhrase, pin);
      const encryptedPrivateKey = await encryptData(privateKey, pin);

      const isFirst = wallets.length === 0;

      // 3. Save to remote or local mock DB
      const { data: newW, error } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          name: name || `Wallet ${wallets.length + 1}`,
          address: address,
          encrypted_mnemonic: encryptedMnemonic,
          encrypted_private_key: encryptedPrivateKey,
          is_primary: isFirst,
          network: activeNetwork,
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
          throw new Error("This wallet address is already registered in our system.");
        }
        throw error;
      }

      if (newW) {
        await updatePreferences(newW.id, activeNetwork);
      }

      await refreshWallets();
      toast.success("New self-custodial wallet created successfully!");
      return { address, mnemonic: mnemonicPhrase };
    } catch (err: any) {
      toast.error(err.message || "Failed to create wallet.");
      return null;
    }
  };

  /**
   * Import wallet from 12-word recovery phrase
   */
  const importWallet = async (name: string, phrase: string, pin: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const cleanPhrase = phrase.trim().toLowerCase().replace(/\s+/g, " ");
      const words = cleanPhrase.split(" ");
      if (words.length !== 12) {
        toast.error("Recovery phrase must contain exactly 12 words.");
        return false;
      }

      if (!isValidMnemonic(cleanPhrase)) {
        toast.error("Invalid Secret Recovery Phrase. Please check spelling.");
        return false;
      }

      // Verify PIN before proceeding
      const isPinValid = await verifyPIN(pin);
      if (!isPinValid) return false;

      // Derive wallet credentials
      const ethWallet = walletFromMnemonic(cleanPhrase, 0);
      const address = ethWallet.address;
      const privateKey = ethWallet.privateKey;

      // Check if duplicate address in local state to prevent importing same wallet twice
      const isDuplicate = wallets.some((w) => w.address.toLowerCase() === address.toLowerCase());
      if (isDuplicate) {
        toast.error("This wallet is already imported.");
        return false;
      }

      // Encrypt sensitive elements
      const encryptedMnemonic = await encryptData(cleanPhrase, pin);
      const encryptedPrivateKey = await encryptData(privateKey, pin);

      const isFirst = wallets.length === 0;

      const { data: newW, error } = await supabase
        .from("wallets")
        .insert({
          user_id: user.id,
          name: name || `Imported Wallet ${wallets.length + 1}`,
          address: address,
          encrypted_mnemonic: encryptedMnemonic,
          encrypted_private_key: encryptedPrivateKey,
          is_primary: isFirst,
          network: activeNetwork,
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes("unique") || error.message?.includes("duplicate")) {
          toast.error("This wallet is already imported.");
          return false;
        }
        throw error;
      }

      if (newW) {
        await updatePreferences(newW.id, activeNetwork);
      }

      await refreshWallets();
      toast.success("Wallet imported successfully!");
      return true;
    } catch (err: any) {
      toast.error(err.message || "Failed to import wallet.");
      return false;
    }
  };

  /**
   * Rename an existing wallet
   */
  const renameWallet = async (walletId: string, newName: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from("wallets")
        .update({ name: newName })
        .eq("id", walletId)
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshWallets();
      toast.success("Wallet renamed successfully.");
      return true;
    } catch (err: any) {
      toast.error("Failed to rename wallet: " + err.message);
      return false;
    }
  };

  /**
   * Switch the current active wallet
   */
  const selectWallet = async (walletId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const target = wallets.find((w) => w.id === walletId);
      if (!target) return false;

      await updatePreferences(walletId, activeNetwork);
      setActiveWallet(target);
      toast.success(`Switched to wallet: ${target.name}`);
      return true;
    } catch (err: any) {
      toast.error("Failed to switch wallet: " + err.message);
      return false;
    }
  };

  /**
   * Switch active network
   */
  const selectNetwork = async (networkId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const exists = SUPPORTED_NETWORKS.some((n) => n.id === networkId);
      if (!exists) return false;

      if (activeWallet) {
        await updatePreferences(activeWallet.id, networkId);
      }
      setActiveNetwork(networkId);
      toast.success(`Network switched to: ${SUPPORTED_NETWORKS.find((n) => n.id === networkId)?.name}`);
      return true;
    } catch (err: any) {
      toast.error("Failed to switch network: " + err.message);
      return false;
    }
  };

  /**
   * Remove/delete an imported or created wallet (Primary cannot be deleted)
   */
  const removeWallet = async (walletId: string): Promise<boolean> => {
    if (!user) return false;
    const target = wallets.find((w) => w.id === walletId);
    if (!target) return false;

    if (target.is_primary) {
      toast.error("The primary wallet cannot be removed.");
      return false;
    }

    try {
      const { error } = await supabase
        .from("wallets")
        .delete()
        .eq("id", walletId)
        .eq("user_id", user.id);

      if (error) throw error;

      // If we removed the active wallet, switch to primary
      if (activeWallet?.id === walletId) {
        const prim = wallets.find((w) => w.is_primary && w.id !== walletId) || wallets.find((w) => w.id !== walletId);
        if (prim) {
          await updatePreferences(prim.id, activeNetwork);
        }
      }

      await refreshWallets();
      toast.success("Wallet removed successfully.");
      return true;
    } catch (err: any) {
      toast.error("Failed to remove wallet: " + err.message);
      return false;
    }
  };

  /**
   * Export address / private details (requires PIN verification)
   */
  const exportPrivateKey = async (walletId: string, pin: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const isPinValid = await verifyPIN(pin);
      if (!isPinValid) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_private_key")
        .eq("id", walletId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) throw error || new Error("Wallet not found.");

      const rawPriv = await decryptData(data.encrypted_private_key, pin);
      return rawPriv;
    } catch (err: any) {
      toast.error(err.message || "Export failed.");
      return null;
    }
  };

  const exportMnemonic = async (walletId: string, pin: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const isPinValid = await verifyPIN(pin);
      if (!isPinValid) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("encrypted_mnemonic")
        .eq("id", walletId)
        .eq("user_id", user.id)
        .single();

      if (error || !data) throw error || new Error("Wallet not found.");
      if (!data.encrypted_mnemonic) {
        toast.error("This wallet does not have a recovery phrase saved.");
        return null;
      }

      const rawMnemonic = await decryptData(data.encrypted_mnemonic, pin);
      return rawMnemonic;
    } catch (err: any) {
      toast.error(err.message || "Export failed.");
      return null;
    }
  };

  /**
   * ADDRESS BOOK / CONTACT MANAGEMENT
   */
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
      const { error } = await supabase
        .from("wallet_contacts")
        .insert({
          user_id: user.id,
          name: name.trim(),
          address: address.trim(),
          label: label?.trim() || "Personal",
        });

      if (error) throw error;
      await refreshWallets();
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
      const { error } = await supabase
        .from("wallet_contacts")
        .update({
          name: name.trim(),
          address: address.trim(),
          label: label?.trim() || "Personal",
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshWallets();
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
      const { error } = await supabase
        .from("wallet_contacts")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshWallets();
      toast.success("Contact deleted.");
      return true;
    } catch (err: any) {
      toast.error("Failed to delete contact: " + err.message);
      return false;
    }
  };

  return {
    wallets,
    activeWallet,
    activeNetwork,
    primaryWallet,
    contacts,
    securityState,
    loading,
    refresh: refreshWallets,
    setupPIN,
    verifyPIN,
    setBiometricsEnabled,
    createWallet,
    importWallet,
    renameWallet,
    selectWallet,
    selectNetwork,
    removeWallet,
    exportPrivateKey,
    exportMnemonic,
    addContact,
    updateContact,
    deleteContact,
    supportedNetworks: SUPPORTED_NETWORKS,
  };
}
