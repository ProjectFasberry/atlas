import { action, atom, reatomAsync, withDataAtom, withErrorAtom, withStatusesAtom, type Ctx } from "@reatom/framework"
import { toast } from "solid-sonner"
import {
  discardSiteDraft, fetchEditorDraft, publishSiteDraft, saveSiteDraft,
  type BlockContent, type SiteAdminPayload, type SiteEditorDraft, type SiteLocale,
} from "@/shared/api/site"
import { translate } from "@/shared/locales/helpers"

/**
 * Live editing on the site itself.
 *
 * The state starts as a full copy of the effective page (defaults merged with
 * the published overrides), so every visible text can be edited in place. Saving
 * stores that copy as the next draft; publishing promotes it.
 */

export type EditPage = "home" | "servers" | "start" | "support" | "modpack"

export type EditSlide = { imageKey: string; alt: string }
export type EditFeature = { iconKey: string; title: string; description: string }
export type EditSection = { id: string; title: string; body: string; hidden: boolean }
export type EditBlock = BlockContent

export type EditServer = {
  id: string
  name: string
  tagline: string
  description: string
  imageKey: string
  features: EditFeature[]
}

export type EditContent =
  | { kind: "home"; slides: EditSlide[]; sections: EditSection[]; blocks: Record<string, EditBlock> }
  | { kind: "servers"; title: string; description: string; servers: EditServer[]; sections: EditSection[]; blocks: Record<string, EditBlock> }
  | { kind: "sections"; sections: EditSection[]; blocks: Record<string, EditBlock> }

export type EditInit = {
  page: EditPage
  locale: SiteLocale
  version: number
  canPublish: boolean
  content: EditContent
}

const activeAtom = atom(false, "siteEdit.active")
const pageAtom = atom<EditPage>("home", "siteEdit.page")
const localeAtom = atom<SiteLocale>("ru", "siteEdit.locale")
const versionAtom = atom(0, "siteEdit.version")
const canPublishAtom = atom(false, "siteEdit.canPublish")
const contentAtom = atom<EditContent | null>(null, "siteEdit.content")
const dirtyAtom = atom(false, "siteEdit.dirty")
/** Published overrides, used by the built-in sections outside edit mode. */
const publishedBlocksAtom = atom<Record<string, EditBlock>>({}, "siteEdit.publishedBlocks")

const init = action((ctx, input: EditInit) => {
  const initialized = ctx.get(activeAtom)
    && ctx.get(pageAtom) === input.page
    && ctx.get(localeAtom) === input.locale

  if (initialized) return

  activeAtom(ctx, true)
  pageAtom(ctx, input.page)
  localeAtom(ctx, input.locale)
  versionAtom(ctx, input.version)
  canPublishAtom(ctx, input.canPublish)
  contentAtom(ctx, input.content)
  dirtyAtom(ctx, false)
}, "siteEdit.init")

/**
 * Edit mode lives in the browser: the page renders published content, and the
 * draft is fetched here once an editor enables it.
 */
const loadDraft = reatomAsync(
  async (_ctx, params: { page: EditPage; locale: SiteLocale }) =>
    fetchEditorDraft(params.page, params.locale),
  "siteEdit.loadDraft",
).pipe(
  withDataAtom(null as SiteEditorDraft | null),
  withStatusesAtom(),
  withErrorAtom(),
)

const close = action((ctx) => {
  activeAtom(ctx, false)
  contentAtom(ctx, null)
  dirtyAtom(ctx, false)
}, "siteEdit.close")

const patch = (ctx: Parameters<typeof init>[0], content: EditContent) => {
  contentAtom(ctx, content)
  dirtyAtom(ctx, true)
}

const setPublishedBlocks = action((ctx, blocks: Record<string, EditBlock>) => {
  publishedBlocksAtom(ctx, blocks)
}, "siteEdit.setPublishedBlocks")

const setBlock = action((ctx, id: string, value: Partial<EditBlock>) => {
  const content = ctx.get(contentAtom)
  if (!content) return

  patch(ctx, { ...content, blocks: { ...content.blocks, [id]: { ...content.blocks[id], ...value } } })
}, "siteEdit.setBlock")

const toggleBlock = action((ctx, id: string) => {
  const content = ctx.get(contentAtom)
  if (!content) return

  const hidden = Boolean(content.blocks[id]?.hidden)
  patch(ctx, { ...content, blocks: { ...content.blocks, [id]: { ...content.blocks[id], hidden: !hidden } } })
}, "siteEdit.toggleBlock")

const setHomeSlide = action((ctx, index: number, value: Partial<EditSlide>) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "home") return

  patch(ctx, {
    ...content,
    slides: content.slides.map((slide, idx) => idx === index ? { ...slide, ...value } : slide),
  })
}, "siteEdit.setHomeSlide")

const addSlide = action((ctx) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "home") return

  patch(ctx, { ...content, slides: [...content.slides, { imageKey: "", alt: "" }] })
}, "siteEdit.addSlide")

const removeSlide = action((ctx, index: number) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "home") return

  patch(ctx, { ...content, slides: content.slides.filter((_, idx) => idx !== index) })
}, "siteEdit.removeSlide")

const setServersPage = action((ctx, value: { title?: string; description?: string }) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "servers") return

  patch(ctx, { ...content, ...value })
}, "siteEdit.setServersPage")

const setServer = action((ctx, id: string, value: Partial<EditServer>) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "servers") return

  patch(ctx, {
    ...content,
    servers: content.servers.map((server) => server.id === id ? { ...server, ...value } : server),
  })
}, "siteEdit.setServer")

const addFeature = action((ctx, id: string) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "servers") return

  const server = content.servers.find((item) => item.id === id)
  if (!server) return

  setServer(ctx, id, { features: [...server.features, { iconKey: "", title: "", description: "" }] })
}, "siteEdit.addFeature")

const setFeature = action((ctx, id: string, index: number, value: Partial<EditFeature>) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "servers") return

  const server = content.servers.find((item) => item.id === id)
  if (!server) return

  setServer(ctx, id, {
    features: server.features.map((feature, idx) => idx === index ? { ...feature, ...value } : feature),
  })
}, "siteEdit.setFeature")

const removeFeature = action((ctx, id: string, index: number) => {
  const content = ctx.get(contentAtom)
  if (content?.kind !== "servers") return

  const server = content.servers.find((item) => item.id === id)
  if (!server) return

  setServer(ctx, id, { features: server.features.filter((_, idx) => idx !== index) })
}, "siteEdit.removeFeature")

const patchSections = (ctx: Ctx, update: (sections: EditSection[]) => EditSection[]) => {
  const content = ctx.get(contentAtom)
  if (!content) return

  patch(ctx, { ...content, sections: update(content.sections) })
}

const addSection = action((ctx) => {
  patchSections(ctx, (sections) => [
    ...sections,
    {
      id: `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      title: "",
      body: "",
      hidden: false,
    },
  ])
}, "siteEdit.addSection")

const setSection = action((ctx, index: number, value: Partial<Omit<EditSection, "id">>) => {
  patchSections(ctx, (sections) => sections.map((section, idx) => idx === index ? { ...section, ...value } : section))
}, "siteEdit.setSection")

const removeSection = action((ctx, index: number) => {
  patchSections(ctx, (sections) => sections.filter((_, idx) => idx !== index))
}, "siteEdit.removeSection")

const moveSection = action((ctx, index: number, delta: -1 | 1) => {
  patchSections(ctx, (sections) => {
    const next = index + delta
    if (next < 0 || next >= sections.length) return sections

    const result = [...sections]
    const [section] = result.splice(index, 1)
    result.splice(next, 0, section)

    return result
  })
}, "siteEdit.moveSection")

const toggleSection = action((ctx, index: number) => {
  patchSections(ctx, (sections) => sections.map((section, idx) => idx === index
    ? { ...section, hidden: !section.hidden }
    : section))
}, "siteEdit.toggleSection")

/** Only complete rows reach the API; the server validates the same shape. */
function serialize(content: EditContent): unknown {
  if (content.kind === "home") {
    const carousel = content.slides
      .filter((slide) => slide.imageKey.trim())
      .map((slide) => {
        const alt = slide.alt.trim()
        return alt
          ? { image: slide.imageKey.trim(), alt }
          : { image: slide.imageKey.trim() }
      })

    return { carousel, sections: serializeSections(content.sections), blocks: serializeBlocks(content.blocks) }
  }

  if (content.kind === "sections") {
    return { sections: serializeSections(content.sections), blocks: serializeBlocks(content.blocks) }
  }

  const items: Record<string, unknown> = {}

  for (const server of content.servers) {
    const item: Record<string, unknown> = {}
    const name = server.name.trim()
    const tagline = server.tagline.trim()
    const image = server.imageKey.trim()

    if (name) item.name = name
    item.tagline = tagline
    item.description = server.description

    if (image) item.image = image

    const features = server.features
      .map((feature) => ({
        icon: feature.iconKey.trim(),
        title: feature.title.trim(),
        description: feature.description.trim(),
      }))
      .filter((feature) => feature.icon && feature.title && feature.description)

    // An empty array must reach the document: omitting the key restores the
    // shipped defaults on the next page load.
    item.features = features

    items[server.id] = item
  }

  const result: Record<string, unknown> = { items }
  const title = content.title.trim()
  const description = content.description.trim()

  if (title) result.title = title
  if (description) result.description = description

  result.sections = serializeSections(content.sections)
  result.blocks = serializeBlocks(content.blocks)

  return result
}

function serializeBlocks(blocks: Record<string, EditBlock>) {
  const result: Record<string, EditBlock> = {}

  for (const [id, block] of Object.entries(blocks)) {
    const value: EditBlock = {}
    if (typeof block.title === "string") value.title = block.title
    if (typeof block.description === "string") value.description = block.description
    if (block.hidden) value.hidden = true

    if (Object.keys(value).length) result[id] = value
  }

  return result
}

function serializeSections(sections: EditSection[]) {
  return sections
    .filter((section) => section.title.trim())
    .map((section) => ({
      id: section.id,
      title: section.title.trim(),
      body: section.body,
      ...(section.hidden ? { hidden: true } : {}),
    }))
}

const errorCode = (error: unknown) => {
  if (typeof error === "object" && error !== null && "error" in error) {
    return String((error as { error?: unknown }).error ?? "")
  }

  return ""
}

const save = reatomAsync(async (ctx) => {
  const content = ctx.get(contentAtom)

  if (!content) return null

  const result = await saveSiteDraft(
    ctx.get(pageAtom),
    ctx.get(localeAtom),
    ctx.get(versionAtom),
    serialize(content),
  )

  if (result.error || !result.data?.data) {
    if (errorCode(result.error) === "VERSION_CONFLICT") {
      toast.error(translate["edit.conflict"]())
    } else {
      toast.error(translate["edit.save-error"]())
    }

    return null
  }

  return result.data.data
}, {
  name: "siteEdit.save",
  onFulfill: (ctx, payload: SiteAdminPayload | null) => {
    if (!payload) return

    versionAtom(ctx, payload.version)
    dirtyAtom(ctx, false)
    toast.success(translate["edit.saved"]())
  },
}).pipe(withStatusesAtom())

const publish = reatomAsync(async (ctx) => {
  const result = await publishSiteDraft(ctx.get(pageAtom), ctx.get(localeAtom), ctx.get(versionAtom))

  if (result.error || !result.data?.data) {
    if (errorCode(result.error) === "VERSION_CONFLICT") {
      toast.error(translate["edit.conflict"]())
    } else {
      toast.error(translate["edit.publish-error"]())
    }

    return null
  }

  return result.data.data
}, {
  name: "siteEdit.publish",
  onFulfill: (ctx, payload: SiteAdminPayload | null) => {
    if (!payload) return

    versionAtom(ctx, payload.version)
    dirtyAtom(ctx, false)
    toast.success(translate["edit.published"]())

    if (typeof window !== "undefined") window.location.reload()
  },
}).pipe(withStatusesAtom())

const discard = reatomAsync(async (ctx) => {
  const result = await discardSiteDraft(ctx.get(pageAtom), ctx.get(localeAtom), ctx.get(versionAtom))

  if (result.error || !result.data?.data) {
    if (errorCode(result.error) === "VERSION_CONFLICT") {
      toast.error(translate["edit.conflict"]())
    } else {
      toast.error(translate["edit.save-error"]())
    }

    return null
  }

  return result.data.data
}, {
  name: "siteEdit.discard",
  onFulfill: (ctx, payload: SiteAdminPayload | null) => {
    if (!payload) return

    versionAtom(ctx, payload.version)
    dirtyAtom(ctx, false)
    toast.success(translate["edit.discarded"]())

    if (typeof window !== "undefined") window.location.reload()
  },
}).pipe(withStatusesAtom())

export const siteEdit = {
  active: activeAtom,
  page: pageAtom,
  locale: localeAtom,
  version: versionAtom,
  canPublish: canPublishAtom,
  content: contentAtom,
  dirty: dirtyAtom,
  init,
  close,
  loadDraft,
  setHomeSlide,
  addSlide,
  removeSlide,
  setServersPage,
  setServer,
  addFeature,
  setFeature,
  removeFeature,
  setPublishedBlocks,
  setBlock,
  toggleBlock,
  publishedBlocks: publishedBlocksAtom,
  addSection,
  setSection,
  removeSection,
  moveSection,
  toggleSection,
  save,
  publish,
  discard,
}
