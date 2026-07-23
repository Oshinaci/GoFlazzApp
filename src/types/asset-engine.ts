export interface AssetBalance {
  chainId: number;
  address: string;
  nativeBalance: {
    raw: string;
    formatted: string;
    fiatValue: number;
  };
  tokens: TokenAsset[];
  totalFiatValue: number;
  lastUpdated: string;
}

export interface TokenAsset {
  contractAddress: string;
  chainId: number;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  formattedBalance: string;
  logoUrl?: string;
  fiatPrice: number;
  fiatValue: number;
  isVerified: boolean;
  isSpam: boolean;
  isHidden: boolean;
  isPinned: boolean;
  isFavorite: boolean;
  metadata?: TokenMetadataInfo;
}

export interface TokenMetadataInfo {
  website?: string;
  description?: string;
  socials?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  ath?: number;
  atl?: number;
  marketCap?: number;
  volume24h?: number;
  rank?: number;
}

export interface TokenPriceData {
  coingeckoId: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  rank: number;
  ath: number;
  atl: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  totalValue: number;
  dailyChange: number;
  dailyChangePercentage: number;
  weeklyChangePercentage: number;
  monthlyChangePercentage: number;
  allocation: { symbol: string; percentage: number; value: number }[];
  pnlTotal: number;
}

export type TransactionCategory =
  | 'receive'
  | 'send'
  | 'swap'
  | 'approve'
  | 'bridge'
  | 'stake'
  | 'unstake'
  | 'nft'
  | 'internal';

export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface EnhancedTransactionRecord {
  hash: string;
  chainId: number;
  category: TransactionCategory;
  status: TransactionStatus;
  from: string;
  to: string;
  value: string;
  formattedValue: string;
  symbol: string;
  timestamp: string;
  blockNumber: number;
  gasUsed?: string;
  feePaid?: string;
  metadata?: any;
}

export interface NftItemRecord {
  id: string;
  chainId: number;
  contractAddress: string;
  tokenId: string;
  standard: 'ERC-721' | 'ERC-1155';
  name: string;
  collectionName: string;
  image: string;
  description?: string;
  attributes?: { trait_type: string; value: string }[];
  floorPrice?: number;
  ownerAddress: string;
}
