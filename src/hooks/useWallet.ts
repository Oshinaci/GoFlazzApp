"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { WalletService } from "@/services/wallet.service";
import { useWalletSecurity } from "@/hooks/useWalletSecurity";
import { useWalletContacts, Contact } from "@/hooks/useWalletContacts";
import { useWalletPreferences } from "@/hooks/useWalletPreferences";
import { generateMnemonic, isValidMnemonic, walletFromMnemonic } from "@/lib/wallet";
import { encryptData, decryptData } from "@/lib/encryption";
import { toast } from "sonner";

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  is_primary: boolean;
  network: string;
  created_at?: string;
}

export type { Contact };

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

export function useWallet() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [activeWallet, setActiveWallet] = useState<WalletAccount | null>(null);
  const [activeNetwork, setActiveNetwork] = useState<string>("arbitrum");
  const [loading, setLoading] = useState(true);

  // Modular Sub-Hooks
  const { securityState, fetchSecurityState, setupPIN, verifyPIN, changePIN, setBiometricsEnabled } = useWalletSecurity();
  const { contacts, fetchContacts, addContact, updateContact, deleteContact } = useWalletContacts();
  const { walletPrefs, fetchPreferences, updateWalletPref } = useWalletPreferences();

  // Sync / refresh wallets
  const refreshWallets = useCallback(async () => {
    if (!user) {
      setWallets([]);
      setActiveWallet(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // 1. Fetch Wallets via Service Layer
      let rawWallets = await WalletService.getWallets(user.id);
      if (rawWallets.length === 0) {
        const defaultWallet = await WalletService.ensureDefaultWallet(user.id);
        if (defaultWallet) {
          rawWallets = [defaultWallet];
        }
      }

      const formattedWallets: WalletAccount[] = rawWallets.map((w) => ({
        id: w.id,
        name: w.name,
        address: w.address,
        is_primary: w.is_primary,
        network: w.network,
        created_at: w.created_at,
      }));

      setWallets(formattedWallets);

      // 2. Fetch Sub-Hook States
      await Promise.all([
        fetchPreferences(),
        fetchContacts(),
        fetchSecurityState(),
      ]);

      // 3. Determine active wallet & network from preferences
      const storedNetwork = walletPrefs?.active_network || "arbitrum";
      setActiveNetwork(storedNetwork);

      if (formattedWallets.length > 0) {
        const found = formattedWallets.find((w) => w.id === walletPrefs?.active_wallet_id);
        const primary = formattedWallets.find((w) => w.is_primary) || formattedWallets[0];
        setActiveWallet(found || primary);
      } else {
        setActiveWallet(null);
      }
    } catch (err: any) {
      console.error("[useWallet.refreshWallets]", err);
    } finally {
      setLoading(false);
    }
  }, [user, fetchPreferences, fetchContacts, fetchSecurityState, walletPrefs?.active_wallet_id, walletPrefs?.active_network]);

  useEffect(() => {
    refreshWallets();
  }, [refreshWallets]);

  const primaryWallet = wallets.find((w) => w.is_primary) ?? wallets[0] ?? null;

  /**
   * Create self-custodial wallet
   */
  const createWallet = async (name: string, pin: string): Promise<{ address: string; mnemonic: string } | null> => {
    if (!user) return null;

    try {
      const isPinValid = await verifyPIN(pin);
      if (!isPinValid) return null;

      const mnemonicPhrase = generateMnemonic();
      const ethWallet = walletFromMnemonic(mnemonicPhrase, wallets.length);
      const privateKey = ethWallet.privateKey;
      const address = ethWallet.address;

      const tempId = `temp_${Date.now()}`;
      const encryptedMnemonic = await WalletService.encryptWallet(mnemonicPhrase, pin, user.id, tempId);
      const encryptedPrivateKey = await WalletService.encryptWallet(privateKey, pin, user.id, tempId);
      const isFirst = wallets.length === 0;

      const newW = await WalletService.createWallet({
        user_id: user.id,
        name: name || `Wallet ${wallets.length + 1}`,
        address,
        encrypted_mnemonic: encryptedMnemonic,
        encrypted_private_key: encryptedPrivateKey,
        is_primary: isFirst,
        network: activeNetwork,
      });

      if (newW) {
        const finalEncMnemonic = await WalletService.encryptWallet(mnemonicPhrase, pin, user.id, newW.id);
        const finalEncPrivateKey = await WalletService.encryptWallet(privateKey, pin, user.id, newW.id);
        await WalletService.updateWalletKeys(newW.id, user.id, finalEncMnemonic, finalEncPrivateKey);
        await updateWalletPref(newW.id, activeNetwork);
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
   * Import wallet
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

      const isPinValid = await verifyPIN(pin);
      if (!isPinValid) return false;

      const ethWallet = walletFromMnemonic(cleanPhrase, 0);
      const address = ethWallet.address;
      const privateKey = ethWallet.privateKey;

      const isDuplicate = wallets.some((w) => w.address.toLowerCase() === address.toLowerCase());
      if (isDuplicate) {
        toast.error("This wallet is already imported.");
        return false;
      }

      const tempId = `temp_imp_${Date.now()}`;
      const encryptedMnemonic = await WalletService.encryptWallet(cleanPhrase, pin, user.id, tempId);
      const encryptedPrivateKey = await WalletService.encryptWallet(privateKey, pin, user.id, tempId);
      const isFirst = wallets.length === 0;

      const newW = await WalletService.createWallet({
        user_id: user.id,
        name: name || `Imported Wallet ${wallets.length + 1}`,
        address,
        encrypted_mnemonic: encryptedMnemonic,
        encrypted_private_key: encryptedPrivateKey,
        is_primary: isFirst,
        network: activeNetwork,
      });

      if (newW) {
        const finalEncMnemonic = await WalletService.encryptWallet(cleanPhrase, pin, user.id, newW.id);
        const finalEncPrivateKey = await WalletService.encryptWallet(privateKey, pin, user.id, newW.id);
        await WalletService.updateWalletKeys(newW.id, user.id, finalEncMnemonic, finalEncPrivateKey);
        await updateWalletPref(newW.id, activeNetwork);
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
   * Rename wallet
   */
  const renameWallet = async (walletId: string, newName: string): Promise<boolean> => {
    if (!user) return false;
    try {
      await WalletService.renameWallet(walletId, user.id, newName);
      await refreshWallets();
      toast.success("Wallet renamed successfully.");
      return true;
    } catch (err: any) {
      toast.error("Failed to rename wallet: " + err.message);
      return false;
    }
  };

  /**
   * Select active wallet
   */
  const selectWallet = async (walletId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const target = wallets.find((w) => w.id === walletId);
      if (!target) return false;

      await updateWalletPref(walletId, activeNetwork);
      setActiveWallet(target);
      toast.success(`Switched to wallet: ${target.name}`);
      return true;
    } catch (err: any) {
      toast.error("Failed to switch wallet: " + err.message);
      return false;
    }
  };

  /**
   * Select active network
   */
  const selectNetwork = async (networkId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const exists = SUPPORTED_NETWORKS.some((n) => n.id === networkId);
      if (!exists) return false;

      if (activeWallet) {
        await updateWalletPref(activeWallet.id, networkId);
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
   * Remove wallet
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
      await WalletService.removeWallet(walletId, user.id);

      if (activeWallet?.id === walletId) {
        const prim = wallets.find((w) => w.is_primary && w.id !== walletId) || wallets.find((w) => w.id !== walletId);
        if (prim) {
          await updateWalletPref(prim.id, activeNetwork);
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
   * Export Private Key
   */
  const exportPrivateKey = async (walletId: string, pin: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const unlocked = await WalletService.unlockWallet(user.id, pin, walletId);
      return unlocked.privateKey;
    } catch (err: any) {
      toast.error(err.message || "Export failed.");
      return null;
    }
  };

  /**
   * Export Mnemonic
   */
  const exportMnemonic = async (walletId: string, pin: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const unlocked = await WalletService.unlockWallet(user.id, pin, walletId);
      if (!unlocked.mnemonic) {
        toast.error("This wallet does not have a recovery phrase saved.");
        return null;
      }
      return unlocked.mnemonic;
    } catch (err: any) {
      toast.error(err.message || "Export failed.");
      return null;
    }
  };

  /**
   * Unlock wallet
   */
  const unlockWallet = async (pin: string, walletId?: string) => {
    if (!user) return null;
    return WalletService.unlockWallet(user.id, pin, walletId);
  };

  /**
   * Lock wallet
   */
  const lockWallet = async () => {
    if (!user) return;
    return WalletService.lockWallet(user.id);
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
    changePIN,
    unlockWallet,
    lockWallet,
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
