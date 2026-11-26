import { client } from "@/shared/lib/client-wrapper"
import {
  action, atom, reatomAsync,
  withAssign, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework"
import { notifyAboutRestrictRole } from "./actions.model"

/** One uploaded pack version; `is_current` is the published one. */
export type ResourcePack = ExtractApiData<"getPrivatedResourcepack">["data"]["items"][number]

export type UploadForm = {
  minecraft: string
  notes: string
}

export const uploadForm = atom<UploadForm>({ minecraft: "1.20.1,1.20.4", notes: "" }, "uploadForm").pipe(
  withAssign((_, name) => ({
    set: action((ctx, key: keyof UploadForm, value: string) => {
      uploadForm(ctx, { ...ctx.get(uploadForm), [key]: value })
    }, `${name}.set`),
  }))
)

export const uploadFile = atom<File | null>(null, "uploadFile")
export const uploadWarnings = atom<string[]>([])

export const resourcePacks = atom(null, "resourcePacks").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client.get("/privated/resourcepack/"))
    }, {
      name: `${name}.fetch`,
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(
      withDataAtom(null),
      withStatusesAtom(),
      withErrorAtom(),
    ),
    upload: reatomAsync(async (ctx, input: { file: File; minecraft: string; notes: string }) => {
      const form = new FormData()
      form.append("file", input.file)
      form.append("minecraft", input.minecraft)
      if (input.notes.trim()) form.append("notes", input.notes.trim())

      return await ctx.schedule(() => client.post("/privated/resourcepack/", { body: form }))
    }, {
      name: `${name}.upload`,
      onFulfill: (ctx, result) => {
        uploadWarnings(ctx, result.warnings)
        uploadFile(ctx, null)
        resourcePacks.fetch(ctx)
      },
      onReject: (ctx, error) => notifyAboutRestrictRole(error),
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
    publish: reatomAsync(async (ctx, id: number) => {
      return await ctx.schedule(() =>
        client.post("/privated/resourcepack/{id}/current", { params: { path: { id } } })
      )
    }, {
      name: `${name}.publish`,
      onFulfill: (ctx) => {
        uploadWarnings(ctx, [])
        resourcePacks.fetch(ctx)
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
    adopt: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client.post("/privated/resourcepack/adopt"))
    }, {
      name: `${name}.adopt`,
      onFulfill: (ctx) => {
        uploadWarnings(ctx, [])
        resourcePacks.fetch(ctx)
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
  }))
)
