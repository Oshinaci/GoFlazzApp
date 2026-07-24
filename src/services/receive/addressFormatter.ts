import { AddressValidationState } from "./receive.types";

export class AddressFormatter {
  static shorten(address: string, startLength: number = 6, endLength: number = 4): string {
    if (!address || address.length < startLength + endLength + 2) {
      return address || "";
    }
    return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
  }

  static formatEnsReady(address: string, ensName?: string): { display: string; full: string } {
    return {
      display: ensName ? ensName : AddressFormatter.shorten(address, 6, 4),
      full: address,
    };
  }

  static validateReceiveAddress(address: string, networkId: string = "arbitrum"): AddressValidationState {
    if (!address || !address.trim()) {
      return {
        isValid: false,
        error: "Missing wallet address.",
      };
    }

    const trimmed = address.trim();
    const evmRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!evmRegex.test(trimmed)) {
      return {
        isValid: false,
        error: "Invalid EVM address format. Must be a 42-character hex string starting with 0x.",
      };
    }

    if (networkId !== "arbitrum" && networkId !== "ethereum" && networkId !== "base") {
      return {
        isValid: false,
        warning: `Network '${networkId}' may not be fully active for instant settlement.`,
      };
    }

    return {
      isValid: true,
    };
  }
}
