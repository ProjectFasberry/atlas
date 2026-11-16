/**
 * Paraglide output is generated at build time and is not in the repository.
 * Tests only need the few runtime helpers the models import.
 */
export type Locale = "ru" | "en";

export const baseLocale: Locale = "ru";
export const locales: Locale[] = ["ru", "en"];

export const getLocale = (): Locale => baseLocale;

export const setLocale = (_locale: Locale): void => {};

export const localizeHref = (href: string): string => href;

export const deLocalizeHref = (href: string): string => href;

export const localizeUrl = (url: URL): URL => url;

export const deLocalizeUrl = (url: URL): URL => url;
