import { AmountValidationResult } from "./transaction.types";

export class AmountValidator {
  static validate(amountStr: string, availableBalance: number, assetSymbol: string): AmountValidationResult {
    if (!amountStr || !amountStr.trim()) {
      return {
        isValid: false,
        error: "Amount is required.",
      };
    }

    const num = parseFloat(amountStr);

    if (isNaN(num)) {
      return {
        isValid: false,
        error: "Invalid number format for amount.",
      };
    }

    if (num < 0) {
      return {
        isValid: false,
        error: "Amount cannot be negative.",
      };
    }

    if (num === 0) {
      return {
        isValid: false,
        error: "Amount must be greater than zero.",
      };
    }

    if (num > availableBalance) {
      return {
        isValid: false,
        error: `Insufficient ${assetSymbol} balance. Available: ${availableBalance.toFixed(4)} ${assetSymbol}.`,
      };
    }

    const parts = amountStr.split(".");
    if (parts.length > 1 && parts[1].length > 18) {
      return {
        isValid: false,
        error: "Too many decimal places specified.",
      };
    }

    if (num === availableBalance) {
      return {
        isValid: true,
        warning: `You are sending your entire ${assetSymbol} balance. Ensure you leave enough ETH for network gas fees.`,
      };
    }

    return {
      isValid: true,
    };
  }
}
