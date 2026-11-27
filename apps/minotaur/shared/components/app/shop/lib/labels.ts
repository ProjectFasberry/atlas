import { translate } from "@/shared/locales/helpers"

/** Shared labels for the storefront, so cards and the item page never drift. */
export const storeItemTypeLabel = (type: string) => {
  if (type === "donate") return translate["store.filters.type.variants.donate"]()
  if (type === "event") return translate["store.filters.type.variants.event"]()
  return type
}

export const storeItemTypeTone = (type: string) => {
  if (type === "donate") return "bg-green-500/15 text-green-300"
  if (type === "event") return "bg-amber-400/15 text-amber-300"
  return "bg-neutral-800 text-neutral-300"
}

export const storeCurrencyLabel = (currency: string) => {
  if (currency === "CHARISM") return translate["store.filters.wallet.variants.charism"]()
  if (currency === "BELKOIN") return translate["store.filters.wallet.variants.belkoin"]()
  return currency
}
