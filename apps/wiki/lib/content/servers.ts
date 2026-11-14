import { z } from 'zod';
import { DEFAULT_SERVER, pageUrl, resolveRoute, type Server } from '@/lib/content/default-server';
import { getServerEnv } from '@/lib/env/server';
import { http } from '@/lib/utils/http';

export { DEFAULT_SERVER, pageUrl, resolveRoute, type Server };

const payloadSchema = z.object({
  data: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      href: z.string().optional(),
      img: z.string().optional(),
    }),
  ),
});

const FALLBACK: Server[] = [{ id: DEFAULT_SERVER, name: 'Bisquite', mapUrl: null, image: null }];
const CACHE_TTL = 5 * 60 * 1000;

type Cache = { at: number; servers: Server[] };
const globalCache = globalThis as { __fasberryWikiServers?: Cache };

/**
 * Servers the wiki can show, from the public `/servers-with-map` endpoint. The api
 * is the source of truth, the list is cached for five minutes and a failed call
 * falls back to the default server so the wiki never goes down with the api.
 */
export async function getServers(): Promise<Server[]> {
  const cached = globalCache.__fasberryWikiServers;
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.servers;

  let servers: Server[] = [];

  try {
    const payload = await http
      .get(`${getServerEnv().apiUrl}/servers-with-map`, {
        timeout: 2000,
        cache: 'no-store',
      })
      .json()
      .then((value) => payloadSchema.parse(value));

    const seen = new Set<string>();
    for (const item of payload.data) {
      if (!item.value || seen.has(item.value)) continue;
      seen.add(item.value);
      servers.push({
        id: item.value,
        name: item.name || item.value,
        mapUrl: item.href || null,
        image: item.img || null,
      });
    }
  } catch {
    servers = [];
  }

  if (servers.length === 0) servers = FALLBACK;
  if (!servers.some((server) => server.id === DEFAULT_SERVER)) {
    servers.unshift(FALLBACK[0]);
  }

  // the default server comes first: it owns the unprefixed URLs
  servers.sort((a, b) => Number(b.id === DEFAULT_SERVER) - Number(a.id === DEFAULT_SERVER));

  globalCache.__fasberryWikiServers = { at: Date.now(), servers };
  return servers;
}
