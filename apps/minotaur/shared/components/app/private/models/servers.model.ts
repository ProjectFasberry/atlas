import { client } from "@/shared/lib/client-wrapper"
import {
  action, atom, reatomAsync,
  withAssign, withDataAtom, withErrorAtom, withStatusesAtom
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

function formOf(s: ServerPayload): ServerForm {
  return {
    fullname: s.fullname,
    description: s.description ?? "",
    thumbnail: s.thumbnail,
    client_version: s.client_version,
    loader: s.loader,
    loader_version: s.loader_version ?? "",
    java_major: String(s.java_major),
    resource_pack: s.resource_pack ?? "",
    client_mod: s.client_mod,
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
    isOpen: atom(false, `${name}.isOpen`),
    open: action((ctx, s: ServerPayload) => {
      serverEditor.isOpen(ctx, true)
      serverEditor.target(ctx, s)
      serverEditor.form(ctx, formOf(s))
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
serverEditor.isOpen.onChange((ctx, state) => {
  if (!state) {
    serverEditor.close(ctx)
  }
})

export const servers = atom(null, "servers").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/privated/servers/")
      )
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom(),
    ),
    save: reatomAsync(async (ctx, input: { id: number; patch: ServerPatch }) => {
      return await ctx.schedule(() =>
        client.raw.patch<ServerPayload>("/privated/servers/{id}", { json: input.patch, params: { path: { id: input.id } } })
      )
    }, {
      name: `${name}.save`,
      onFulfill: (ctx, updated) => {
        // Keep the table in sync without a second round trip.
        const current = ctx.get(servers.fetch.dataAtom) ?? []
        servers.fetch.dataAtom(ctx, current.map((s) => s.id === updated.id ? updated : s))
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
  }))
)
