import { getServerLabel } from "@/shared/components/app/ratings/labels"

/**
 * Display name of a server key.
 *
 * The key is the lowercase catalog origin (`lobby`) and never the Velocity
 * display name (`Lobby`). Known servers get a translated name, a server that
 * is not in the catalog yet falls back to the provided name or the key.
 */
export function serverName(key: string | null | undefined, fallback?: string | null): string {
  if (!key) return fallback || ""

  return getServerLabel(key, fallback || key)
}
