import { mainFetch } from "@/shared/api/client"
import { parseWrappedJson } from "@/shared/lib/client-wrapper"
import {
  atom, reatomAsync, withAssign, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework"

export type ServerPayload = {
  id: number
  fullname: string
  description: string | null
  thumbnail: string
  origin: string
  available: boolean
  excluded: boolean
  is_default: boolean
  client_version: string
  client_mod: string
  java_major: number
  loader: string
  loader_version: string | null
  resource_pack: string | null
}

export type ServerPatch = Partial<Pick<
  ServerPayload,
  | "fullname"
  | "description"
  | "available"
  | "excluded"
  | "is_default"
  | "client_version"
  | "client_mod"
  | "java_major"
  | "loader"
  | "loader_version"
  | "resource_pack"
>>

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await mainFetch(path, init)

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: unknown } | null
    const error = typeof body?.error === "string" ? body.error : `HTTP ${response.status}`
    throw new Error(error)
  }

  return parseWrappedJson<T>(response)
}

export const servers = atom(null, "servers").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => request<ServerPayload[]>("privated/servers"))
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom(),
    ),
    save: reatomAsync(async (ctx, input: { id: number; patch: ServerPatch }) => {
      const updated = await ctx.schedule(() =>
        request<ServerPayload>(`privated/servers/${input.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.patch),
        })
      )

      // Keep the table in sync without a second round trip.
      const current = ctx.get(servers.fetch.dataAtom) ?? []
      servers.fetch.dataAtom(ctx, current.map((server) => server.id === updated.id ? updated : server))

      return updated
    }, `${name}.save`).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
  }))
)
