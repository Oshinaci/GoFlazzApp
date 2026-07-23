"use client";

import { useState, useEffect, useCallback } from "react";
import { WalletManagerService } from "@/services/wallet-manager.service";
import { EnterpriseWalletRecord } from "@/types/wallet-engine";

export function useWalletManager(userId?: string) {
  const [wallets, setWallets] = useState<EnterpriseWalletRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeWallet, setActiveWallet] = useState<EnterpriseWalletRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await WalletManagerService.getWallets(userId);
      setWallets(list);
      if (list.length > 0 && !activeWallet) {
        const primary = list.find((w) => w.is_primary) || list[0];
        setActiveWallet(primary);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }, [userId, activeWallet]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const createWallet = async (name: string, pin: string) => {
    if (!userId) throw new Error("User not authenticated");
    const newW = await WalletManagerService.createWallet(userId, name, pin, wallets.length);
    await fetchWallets();
    setActiveWallet(newW);
    return newW;
  };

  const importMnemonic = async (name: string, mnemonic: string, pin: string) => {
    if (!userId) throw new Error("User not authenticated");
    const newW = await WalletManagerService.importWalletFromMnemonic(userId, name, mnemonic, pin);
    await fetchWallets();
    setActiveWallet(newW);
    return newW;
  };

  const importPrivateKey = async (name: string, privateKey: string, pin: string) => {
    if (!userId) throw new Error("User not authenticated");
    const newW = await WalletManagerService.importWalletFromPrivateKey(userId, name, privateKey, pin);
    await fetchWallets();
    setActiveWallet(newW);
    return newW;
  };

  const addWatchOnly = async (name: string, address: string) => {
    if (!userId) throw new Error("User not authenticated");
    const newW = await WalletManagerService.createWatchOnlyWallet(userId, name, address);
    await fetchWallets();
    return newW;
  };

  const renameWallet = async (walletId: string, newName: string) => {
    if (!userId) return;
    await WalletManagerService.renameWallet(walletId, userId, newName);
    await fetchWallets();
  };

  const archiveWallet = async (walletId: string) => {
    if (!userId) return;
    await WalletManagerService.archiveWallet(walletId, userId);
    await fetchWallets();
  };

  const restoreWallet = async (walletId: string) => {
    if (!userId) return;
    await WalletManagerService.restoreWallet(walletId, userId);
    await fetchWallets();
  };

  const deleteWallet = async (walletId: string, pin: string) => {
    if (!userId) return;
    await WalletManagerService.deleteWallet(walletId, userId, pin);
    await fetchWallets();
  };

  return {
    wallets,
    loading,
    activeWallet,
    setActiveWallet,
    error,
    refreshWallets: fetchWallets,
    createWallet,
    importMnemonic,
    importPrivateKey,
    addWatchOnly,
    renameWallet,
    archiveWallet,
    restoreWallet,
    deleteWallet,
  };
}
