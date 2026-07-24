import { TransactionValidationResult, TransactionIntent } from "./transaction.types";
import { AddressValidator } from "./addressValidator";
import { AmountValidator } from "./amountValidator";

export class TransactionValidator {
  static validate(intent: TransactionIntent, availableBalance: number): TransactionValidationResult {
    const addressValidation = AddressValidator.validate(intent.recipientAddress, intent.walletAddress);
    const amountValidation = AmountValidator.validate(intent.amount.toString(), availableBalance, intent.assetSymbol);

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!addressValidation.isValid && addressValidation.error) {
      errors.push(addressValidation.error);
    }
    if (addressValidation.warning) {
      warnings.push(addressValidation.warning);
    }

    if (!amountValidation.isValid && amountValidation.error) {
      errors.push(amountValidation.error);
    }
    if (amountValidation.warning) {
      warnings.push(amountValidation.warning);
    }

    return {
      isValid: errors.length === 0,
      addressValidation,
      amountValidation,
      errors,
      warnings,
    };
  }
}
