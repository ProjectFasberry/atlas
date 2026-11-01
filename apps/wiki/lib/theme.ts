import { cookies } from 'next/headers';

export type Theme = 'light' | 'dark';

export const THEME_COOKIE = 'theme';
export const DEFAULT_THEME: Theme = 'dark';

/**
 * The theme is stored in a cookie, so the server renders the right class on `<html>`
 * and there is no flash before a script could run. Default is dark.
 */
export async function getServerTheme(): Promise<Theme> {
  const value = (await cookies()).get(THEME_COOKIE)?.value;
  return value === 'light' || value === 'dark' ? value : DEFAULT_THEME;
}
