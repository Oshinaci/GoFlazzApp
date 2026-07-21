/**
 * Wallet key management.
 *
 * SECURITY NOTES (read before shipping past internal alpha):
 * - Private keys/mnemonics must NEVER be sent to Supabase or any server in
 *   plaintext. Only the encrypted JSON keystore (output of `encryptWallet`)
 *   is persisted, in `user_wallets.encrypted_private_key`.
 * - The encryption password should be derived from the user's PIN/passcode,
 *   never stored anywhere, and never logged.
 * - This alpha implementation is a correct baseline (ethers' scrypt-based
 *   keystore, same format used by geth/MetaMask), not a substitute for a
 *   professional security audit before handling real user funds.
 * - Consider a device secure-enclave / biometric-gated keystore for Phase 2
 *   instead of password-based encryption alone.
 */
import { HDNodeWallet, Wallet, Mnemonic } from "ethers";

export function generateMnemonic(): string {
  const wallet = Wallet.createRandom();
  const phrase = wallet.mnemonic?.phrase;
  if (!phrase) throw new Error("Failed to generate recovery phrase");
  return phrase;
}

export function isValidMnemonic(phrase: string): boolean {
  try {
    Mnemonic.fromPhrase(phrase.trim());
    return true;
  } catch {
    return false;
  }
}

export function walletFromMnemonic(phrase: string, accountIndex = 0): HDNodeWallet {
  const path = `m/44'/60'/0'/0/${accountIndex}`;
  return HDNodeWallet.fromPhrase(phrase.trim(), undefined, path);
}

/** Encrypts a wallet into a JSON keystore string, safe to persist. */
export async function encryptWallet(wallet: HDNodeWallet, password: string): Promise<string> {
  return (wallet as any).encrypt(password);
}

/** Decrypts a persisted keystore back into a usable wallet, client-side only. */
export async function decryptWallet(encryptedJson: string, password: string): Promise<HDNodeWallet> {
  const wallet = await (Wallet as any).fromEncryptedJson(encryptedJson, password);
  return wallet as unknown as HDNodeWallet;
}

export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}
