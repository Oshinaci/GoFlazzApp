import { AddressValidationResult } from "./transaction.types";

export class AddressValidator {
  static validate(address: string, currentWalletAddress?: string): AddressValidationResult {
    if (!address || !address.trim()) {
      return {
        isValid: false,
        error: "Recipient address is required.",
      };
    }

    const trimmed = address.trim();

    // Check EIP-681 URI or ethereum: prefix
    let cleanAddress = trimmed;
    if (trimmed.startsWith("ethereum:")) {
      cleanAddress = trimmed.replace("ethereum:", "").split("?")[0];
    }

    // Check if ENS name (ends with .eth)
    if (cleanAddress.endsWith(".eth")) {
      return {
        isValid: true,
        isEns: true,
        warning: "ENS name detected. Resolved to simulated address for review.",
      };
    }

    // Check EVM address regex (0x followed by 40 hex characters)
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmRegex.test(cleanAddress)) {
      return {
        isValid: false,
        error: "Invalid EVM address format. Must start with 0x and be 42 characters.",
      };
    }

    // Check self-transfer
    if (currentWalletAddress && cleanAddress.toLowerCase() === currentWalletAddress.toLowerCase()) {
      return {
        isValid: true,
        warning: "You are sending funds to your own connected wallet address.",
      };
    }

    return {
      isValid: true,
    };
  }

  static parseEip681(uri: string): { address: string; amount?: string; symbol?: string } {
    if (!uri.startsWith("ethereum:")) {
      return { address: uri };
    }
    const withoutPrefix = uri.replace("ethereum:", "");
    const [addressPart, queryPart] = withoutPrefix.split("?");
    let amount: string | undefined;
    let symbol: string | undefined;

    if (queryPart) {
      const params = new URLSearchParams(queryPart);
      amount = params.get("value") || params.get("amount") || undefined;
      symbol = params.get("symbol") || undefined;
    }

    return { address: addressPart, amount, symbol };
  }
}
