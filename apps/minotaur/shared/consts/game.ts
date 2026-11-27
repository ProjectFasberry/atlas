/** Game servers that expose the CHARISM wallet, kept in one place for the web UI. */
export const GAME_SERVERS = ["bisquite", "muffin"] as const
export type GameServer = (typeof GAME_SERVERS)[number]
