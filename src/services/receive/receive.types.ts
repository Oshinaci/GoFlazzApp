export interface NetworkOption {
  id: string;
  name: string;
  symbol: string;
  chainId: number;
  isActive: boolean;
  iconName: string;
  nativeCurrency: string;
}

export interface ReceiveState {
  walletId: string;
  walletName: string;
  address: string;
  networkId: string;
  amount?: string;
  assetSymbol?: string;
}

export interface AddressValidationState {
  isValid: boolean;
  error?: string;
  warning?: string;
  isEns?: boolean;
}
