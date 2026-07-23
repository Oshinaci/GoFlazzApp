export type WalletType = 'generated' | 'imported' | 'watch_only' | 'hardware' | 'mpc';

export type ChainType = 'evm' | 'solana' | 'bitcoin';

export interface WalletMetadata {
  hardwareVendor?: 'ledger' | 'trezor' | 'lattice';
  hardwarePath?: string;
  mpcThreshold?: number;
  mpcParticipants?: number;
  isArchived?: boolean;
  isPrimary?: boolean;
  derivationPath?: string;
  accountIndex?: number;
}

export interface EnterpriseWalletRecord {
  id: string;
  user_id: string;
  name: string;
  address: string;
  encrypted_mnemonic: string | null;
  encrypted_private_key: string | null;
  wallet_type: WalletType;
  chain_type: ChainType;
  network: string;
  derivation_path: string | null;
  metadata: WalletMetadata;
  is_primary: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type WalletAuditAction =
  | 'wallet_created'
  | 'wallet_imported'
  | 'wallet_deleted'
  | 'wallet_exported'
  | 'mnemonic_viewed'
  | 'private_key_viewed'
  | 'wallet_renamed'
  | 'wallet_archived'
  | 'wallet_restored'
  | 'wallet_switched';
