/** Game servers that expose the CHARISM wallet; the store keeps one list for cart and catalog. */
export const GAME_SERVERS = ["bisquite", "muffin"] as const
export type GameServer = (typeof GAME_SERVERS)[number]
