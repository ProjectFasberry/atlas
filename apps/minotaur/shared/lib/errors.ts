import { translate } from "@/shared/locales/helpers";

/** Machine codes the API returns instead of human messages. */
const KNOWN_CODES: Record<string, () => string> = {
  ORDERS_LIMIT: () => translate["shared.errors.orders-limit"](),
  INCORRECT_PAYMENT_METHOD: () => translate["shared.errors.payment-method"](),
  INTERNAL_ERROR: () => translate["shared.errors.generic"](),
  "items-not-found": () => translate["store.errors.items-not-found"](),
  insufficient: () => translate["store.errors.insufficient"](),
};

/**
 * Text for an error block: Russian messages pass through, known machine codes are
 * translated, everything else (raw English validation, unknown codes) becomes a
 * short generic phrase instead of a stack-trace-like string.
 */
export function friendlyError(message?: string | null): string {
  if (!message) return translate["shared.errors.generic"]();

  const known = KNOWN_CODES[message.trim()];
  if (known) return known();

  if (/[а-яА-ЯёЁ]/.test(message)) return message;

  return translate["shared.errors.generic"]();
}
