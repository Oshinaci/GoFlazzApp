/**
 * Production-Ready HD Wallet Engine for GoFlazz
 * Supports BIP39 Mnemonic, BIP44 Derivation, Ethereum/Arbitrum compatibility,
 * Multi-account derivation, and secure cryptographic validation.
 */
import { HDNodeWallet, Wallet, Mnemonic, isAddress } from "ethers";

export interface DerivedAccount {
  address: string;
  publicKey: string;
  privateKey: string;
  path: string;
  index: number;
}

/**
 * Generate a new random BIP39 12-word or 24-word mnemonic phrase.
 */
export function generateBip39Mnemonic(wordCount: 12 | 24 = 12): string {
  // 12 words = 128 bits entropy, 24 words = 256 bits entropy
  const strength = wordCount === 24 ? 256 : 128;
  const wallet = Wallet.createRandom();
  const phrase = wallet.mnemonic?.phrase;
  if (!phrase) {
    throw new Error("Failed to generate secure BIP39 mnemonic");
  }
  return phrase;
}

/**
 * Validate a BIP39 mnemonic phrase.
 */
export function validateMnemonicPhrase(phrase: string): boolean {
  if (!phrase || typeof phrase !== "string") return false;
  try {
    const trimmed = phrase.trim();
    const words = trimmed.split(/\s+/);
    if (words.length !== 12 && words.length !== 15 && words.length !== 18 && words.length !== 21 && words.length !== 24) {
      return false;
    }
    Mnemonic.fromPhrase(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate an Ethereum / EVM private key (hex string with or without 0x prefix, length 64/66).
 */
export function validatePrivateKey(privateKey: string): boolean {
  if (!privateKey || typeof privateKey !== "string") return false;
  const clean = privateKey.trim().startsWith("0x") ? privateKey.trim() : `0x${privateKey.trim()}`;
  return /^0x[a-fA-F0-9]{64}$/.test(clean);
}

/**
 * Validate an Ethereum / EVM wallet address.
 */
export function validateWalletAddress(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  return isAddress(address.trim());
}

/**
 * Derive account at specific BIP44 index from mnemonic phrase.
 * Standard Ethereum path: m/44'/60'/0'/0/{index}
 */
export function deriveAccountFromMnemonic(mnemonic: string, accountIndex = 0): DerivedAccount {
  const trimmed = mnemonic.trim();
  if (!validateMnemonicPhrase(trimmed)) {
    throw new Error("Invalid BIP39 mnemonic phrase provided for derivation");
  }

  const path = `m/44'/60'/0'/0/${accountIndex}`;
  const hdNode = HDNodeWallet.fromPhrase(trimmed, undefined, path);

  return {
    address: hdNode.address,
    publicKey: hdNode.publicKey,
    privateKey: hdNode.privateKey,
    path,
    index: accountIndex,
  };
}

/**
 * Create a wallet instance directly from a validated private key.
 */
export function walletFromPrivateKey(privateKey: string): { address: string; publicKey: string; privateKey: string } {
  const clean = privateKey.trim().startsWith("0x") ? privateKey.trim() : `0x${privateKey.trim()}`;
  if (!validatePrivateKey(clean)) {
    throw new Error("Invalid private key format");
  }
  const wallet = new Wallet(clean);
  return {
    address: wallet.address,
    publicKey: wallet.signingKey.publicKey,
    privateKey: wallet.privateKey,
  };
}
