import { m } from "@/paraglide/messages.js";
import type { PageContext } from "vike/types";
import { type Locale, baseLocale } from "@/paraglide/runtime";

/**
 * Alias for the translate function from paraglide
 */
export const translate = m;

/**
 * Helper for the prerendered pages
 */
const getBaseLocale = (isPrerendering: boolean) =>
  isPrerendering ? "ru" : baseLocale

export const getLocaleByRuntime = (pageCtx: PageContext): Locale => {
  // Locale from the derive payload
  // @ts-expect-error
  return pageCtx?.["runtime"]?.["elysia"]?.["locale"] as Maybe<Locale>
    ?? getBaseLocale(pageCtx.isPrerendering);
}
