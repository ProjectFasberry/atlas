import { z } from 'zod';

/**
 * Variables that reach the browser. `process.env.NEXT_PUBLIC_*` has to be read
 * literally, otherwise Next.js cannot inline it at build time.
 */
export const publicEnv = {
  siteUrl: z.url().default('https://wiki.fasberry.fun').parse(process.env.NEXT_PUBLIC_SITE_URL),
} as const;
