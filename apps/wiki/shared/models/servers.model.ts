import { atom } from '@reatom/framework';
import type { Server } from '@/lib/content/default-server';

/** Server list from the api, seeded by the layout through `ReatomProvider`. */
export const $servers = atom<Server[]>([], 'servers');

/** Page slugs per server: the switcher keeps the article when the target has it. */
export const $serverSlugs = atom<Record<string, string[]>>({}, 'serverSlugs');
