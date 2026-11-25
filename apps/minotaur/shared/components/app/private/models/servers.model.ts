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
  origin: string
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

/** Java major used by the current client versions; other versions keep the field as is. */
const JAVA_BY_VERSION: Record<string, string> = {
  "1.20.1": "17",
  "1.20.4": "21",
}

const emptyForm: ServerForm = {
  origin: "",
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
    origin: s.origin,
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

/** Body of `POST /privated/servers`: the origin is only settable on create. */
export function createOf(form: ServerForm) {
  return {
    origin: form.origin.trim().toLowerCase(),
    fullname: form.fullname.trim(),
    description: form.description.trim() || null,
    thumbnail: form.thumbnail.trim(),
    client_version: form.client_version.trim(),
    loader: form.loader as "fabric" | "quilt" | "neoforge" | "forge" | "vanilla",
    loader_version: form.loader_version.trim() || null,
    java_major: Number(form.java_major),
    resource_pack: form.resource_pack.trim() || null,
    client_mod: form.client_mod as "required" | "optional",
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
    mode: atom<"edit" | "create">("edit", `${name}.mode`),
    isOpen: atom(false, `${name}.isOpen`),
    open: action((ctx, s: ServerPayload) => {
      servers.save.errorAtom.reset(ctx)
      servers.create.errorAtom.reset(ctx)
      serverEditor.isOpen(ctx, true)
      serverEditor.mode(ctx, "edit")
      serverEditor.target(ctx, s)
      serverEditor.form(ctx, formOf(s))
    }, `${name}.open`),
    openCreate: action((ctx) => {
      servers.save.errorAtom.reset(ctx)
      servers.create.errorAtom.reset(ctx)
      serverEditor.isOpen(ctx, true)
      serverEditor.mode(ctx, "create")
      serverEditor.target(ctx, null)
      serverEditor.form(ctx, emptyForm)
    }, `${name}.openCreate`),
    close: action((ctx) => {
      serverEditor.target(ctx, null)
      serverEditor.form(ctx, emptyForm)
    }, `${name}.close`),
    set: action((ctx, key: keyof ServerForm, value: string) => {
      const next = { ...ctx.get(serverEditor.form), [key]: value }

      // Picking a Minecraft version fills the Java major the stack uses for it;
      // staff can still override the value afterwards.
      if (key === "client_version") {
        const suggested = JAVA_BY_VERSION[value]
        if (suggested) next.java_major = suggested
      }

      serverEditor.form(ctx, next)
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
        client.patch("/privated/servers/{id}", {
          json: input.patch as ExtractApiBody<"patchPrivatedServersById">["content"]["application/json"],
          params: { path: { id: input.id } },
        })
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
    remove: reatomAsync(async (ctx, id: number) => {
      return await ctx.schedule(() =>
        client.delete("/privated/servers/{id}", { params: { path: { id } } })
      )
    }, { name: `${name}.remove` }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
    create: reatomAsync(async (ctx, body: ExtractApiBody<"postPrivatedServers">["content"]["application/json"]) => {
      return await ctx.schedule(() =>
        client.post("/privated/servers/", { json: body })
      )
    }, {
      name: `${name}.create`,
      onFulfill: (ctx, created) => {
        const current = ctx.get(servers.fetch.dataAtom) ?? []
        servers.fetch.dataAtom(ctx, [...current, created])
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
  }))
)

/** Client versions with published content; the form must not offer anything else. */
export const clientVersions = atom(null, "clientVersions").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/privated/servers/client-versions")
      )
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, versions) => {
        if (!ctx.get(serverEditor.isOpen) || ctx.get(serverEditor.mode) !== "create") return;

        const form = ctx.get(serverEditor.form)
        if (form.client_version || versions.length === 0) return;

        // A fresh server starts on a version that exists, with its Java major.
        const preferred = versions.includes("1.20.1") ? "1.20.1" : versions[versions.length - 1]!
        serverEditor.set(ctx, "client_version", preferred)
      }
    }).pipe(
      withDataAtom([] as string[]),
      withStatusesAtom(),
      withErrorAtom(),
    ),
  }))
)
