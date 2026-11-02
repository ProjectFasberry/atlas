import type { BrowserContext } from '@playwright/test';

export type Role = 'editor' | 'viewer' | 'anon';

/** The mock backend picks the user from this cookie, see `e2e/mock-backend.mjs`. */
export const E2E_ORIGIN = `http://127.0.0.1:${process.env.E2E_PORT ?? '3100'}`;

export async function actAs(context: BrowserContext, role: Role) {
  await context.addCookies([{ name: 'e2e-role', value: role, url: E2E_ORIGIN }]);
}
