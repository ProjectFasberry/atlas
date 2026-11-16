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

export const cookieName = "PARAGLIDE_LOCALE";

export const isLocale = (value: unknown): value is Locale =>
	locales.includes(value as Locale);

export const toLocale = (value: unknown): Locale | undefined => {
	if (typeof value !== "string") return undefined;

	return locales.find((locale) => locale.toLowerCase() === value.toLowerCase());
};

export const extractLocaleFromNavigator = (): Locale | undefined => undefined;
