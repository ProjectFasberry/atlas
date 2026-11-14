/**
 * The server the wiki belongs to by default. Its pages keep the short URLs
 * (`/armor`), every other server lives under a prefix (`/muffin/armor`).
 *
 * Kept in its own module: the schema, the client switcher and the scripts import
 * it, and they must not pull the api client or the server environment with it.
 */
export const DEFAULT_SERVER = 'bisquite';

export type Server = {
  /** key used in URLs and in the `server` column */
  id: string;
  /** human readable name from the api */
  name: string;
  /** link to the server map, when the api knows one */
  mapUrl: string | null;
  image: string | null;
};

/**
 * Splits route segments into the server and the page slug. `/muffin/armor` is
 * armor on muffin, `/armor` is armor on the default server.
 */
export function resolveRoute(
  segments: string[],
  servers: readonly Pick<Server, 'id'>[],
): { server: string; slug: string } {
  const [first, ...rest] = segments;
  if (first && first !== DEFAULT_SERVER && servers.some((server) => server.id === first)) {
    return { server: first, slug: rest.join('/') };
  }

  return { server: DEFAULT_SERVER, slug: segments.join('/') };
}

/** Public URL of a page: the default server has no prefix. */
export function pageUrl(server: string, slug: string): string {
  const path = slug ? `/${slug}` : '';
  return server === DEFAULT_SERVER ? path || '/' : `/${server}${path}`;
}

/** Public URL segments, for markdown and image routes. */
export function pagePath(server: string, slug: string): string[] {
  const parts = slug ? slug.split('/') : [];
  return server === DEFAULT_SERVER ? parts : [server, ...parts];
}
