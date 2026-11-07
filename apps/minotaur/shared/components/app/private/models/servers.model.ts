import { mainFetch } from "@/shared/api/client"
import { parseWrappedJson } from "@/shared/lib/client-wrapper"
import {
  action, atom, reatomAsync, withAssign, withDataAtom, withErrorAtom, withStatusesAtom,
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
  | "thumbnail"
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

export type ServerForm = {
  fullname: string
  description: string
  thumbnail: string
  client_version: string
  loader: string
  loader_version: string
  java_major: string
  resource_pack: string
  client_mod: string
}

const emptyForm: ServerForm = {
  fullname: "",
  description: "",
  thumbnail: "",
  client_version: "",
  loader: "fabric",
  loader_version: "",
  java_major: "21",
  resource_pack: "",
  client_mod: "required",
}

function formOf(server: ServerPayload): ServerForm {
  return {
    fullname: server.fullname,
    description: server.description ?? "",
    thumbnail: server.thumbnail,
    client_version: server.client_version,
    loader: server.loader,
    loader_version: server.loader_version ?? "",
    java_major: String(server.java_major),
    resource_pack: server.resource_pack ?? "",
    client_mod: server.client_mod,
  }
}

export function patchOf(form: ServerForm): ServerPatch {
  return {
    fullname: form.fullname.trim(),
    description: form.description.trim() || null,
    thumbnail: form.thumbnail.trim(),
    client_version: form.client_version.trim(),
    loader: form.loader,
    loader_version: form.loader_version.trim() || null,
    java_major: Number(form.java_major),
    resource_pack: form.resource_pack.trim() || null,
    client_mod: form.client_mod as "required" | "optional",
  }
}

/** Editor dialog state; no React hooks, the page is Reatom-driven. */
export const serverEditor = atom<ServerForm | null>(null, "serverEditor").pipe(
  withAssign((_, name) => ({
    target: atom<ServerPayload | null>(null, `${name}.target`),
    form: atom<ServerForm>(emptyForm, `${name}.form`),
    open: action((ctx, server: ServerPayload) => {
      serverEditor.target(ctx, server)
      serverEditor.form(ctx, formOf(server))
    }, `${name}.open`),
    close: action((ctx) => {
      serverEditor.target(ctx, null)
      serverEditor.form(ctx, emptyForm)
    }, `${name}.close`),
    set: action((ctx, key: keyof ServerForm, value: string) => {
      serverEditor.form(ctx, { ...ctx.get(serverEditor.form), [key]: value })
    }, `${name}.set`),
  }))
)

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
