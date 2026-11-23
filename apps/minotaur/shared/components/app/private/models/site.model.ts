import {
  action, atom, reatomAsync,
  withDataAtom, withErrorAtom, withStatusesAtom,
  type Ctx,
} from "@reatom/framework"
import { toast } from "sonner"
import { client } from "@/shared/lib/client-wrapper"
import { logError } from "@/shared/lib/log"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import {
  discardSiteContentDraft,
  getSiteContentAdmin,
  publishSiteContent,
  saveSiteContentDraft,
  type SiteAdminPayload,
  type SiteLocale,
  type SitePageId,
} from "@/shared/api/site"
import { translate } from "@/shared/locales/helpers"
import { BLOCK_DEFAULTS } from "./site-defaults"

export type SiteTarget = { page: SitePageId; locale: SiteLocale }
export type { SiteLocale, SitePageId }

export type SlideDraft = { image: string; alt: string }
export type FeatureDraft = { icon: string; title: string; description: string }
export type SectionDraft = { id: string; title: string; body: string; hidden: boolean }
export type BlockDraft = { title?: string; description?: string; hidden: boolean }

export type ServerDraft = {
  name: string
  tagline: string
  description: string
  /** The site hides the description panel when this is on. */
  hideDescription: boolean
  image: string
  features: FeatureDraft[]
  /** True once the editor changed the list, so an empty list clears the defaults. */
  featuresTouched: boolean
}

export type SiteDraft =
  | { kind: "home"; carousel: SlideDraft[]; sections: SectionDraft[]; blocks: Record<string, BlockDraft> }
  | { kind: "servers"; title: string; description: string; items: Record<string, ServerDraft>; sections: SectionDraft[]; blocks: Record<string, BlockDraft> }
  | { kind: "sections"; sections: SectionDraft[]; blocks: Record<string, BlockDraft> }

/** Built-in sections available on each page; ids match the site's block ids. */
export const PAGE_BLOCKS: Record<SitePageId, { id: string, label: () => string }[]> = {
  home: [
    { id: "hero", label: translate["panel.block-hero"] },
    { id: "join", label: translate["panel.block-join"] },
    { id: "features", label: translate["panel.block-features"] },
    { id: "news", label: translate["panel.block-news"] },
    { id: "spawn", label: translate["panel.block-spawn"] },
    { id: "community", label: translate["panel.block-community"] },
    { id: "faq", label: translate["panel.block-faq"] },
    { id: "share", label: translate["panel.block-share"] },
  ],
  servers: [],
  start: [{ id: "start-hero", label: translate["panel.block-start-hero"] }],
  support: [
    { id: "support-hero", label: translate["panel.block-support-hero"] },
    { id: "support-help", label: translate["panel.block-support-help"] },
    { id: "support-where", label: translate["panel.block-support-where"] },
    { id: "support-thanks", label: translate["panel.block-support-thanks"] },
    { id: "support-faq", label: translate["panel.block-support-faq"] },
    { id: "support-cta", label: translate["panel.block-support-cta"] },
  ],
  modpack: [
    { id: "modpack-hero", label: translate["panel.block-modpack-hero"] },
    { id: "modpack-manual", label: translate["panel.block-modpack-manual"] },
    { id: "modpack-faq", label: translate["panel.block-modpack-faq"] },
  ],
}

export const createSectionId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export type ServerOption = { origin: string; fullname: string }

export type ImageTarget =
  | { kind: "slide"; index: number }
  | { kind: "server"; id: string }
  | { kind: "feature"; id: string; index: number }

const EMPTY_SERVER: ServerDraft = {
  name: "",
  tagline: "",
  description: "",
  hideDescription: false,
  image: "",
  features: [],
  featuresTouched: false,
}

const targetKey = ({ page, locale }: SiteTarget) => `${page}:${locale}`

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

const asString = (value: unknown) => typeof value === "string" ? value : ""

/** Turn a stored document into the editable shape; unknown fields are dropped. */
export function normalizeDraft(page: SitePageId, content: unknown): SiteDraft {
  const doc = asRecord(content)
  const sections = normalizeSections(doc.sections)
  const blocks = normalizeBlocks(doc.blocks)

  if (page === "home") {
    const carousel = Array.isArray(doc.carousel) ? doc.carousel : []

    return {
      kind: "home",
      carousel: carousel.flatMap((item) => {
        const slide = asRecord(item)
        const image = asString(slide.image)
        if (!image) return []

        return [{ image, alt: asString(slide.alt) }]
      }),
      sections,
      blocks,
    }
  }

  if (page !== "servers") return { kind: "sections", sections, blocks }

  const items = asRecord(doc.items)
  const normalized: Record<string, ServerDraft> = {}

  for (const [id, value] of Object.entries(items)) {
    normalized[id] = normalizeServer(value)
  }

  return {
    kind: "servers",
    title: asString(doc.title),
    description: asString(doc.description),
    items: normalized,
    sections,
    blocks,
  }
}

function normalizeBlocks(value: unknown): Record<string, BlockDraft> {
  const source = asRecord(value)
  const result: Record<string, BlockDraft> = {}

  for (const [id, item] of Object.entries(source)) {
    const entry = asRecord(item)
    result[id] = {
      title: typeof entry.title === "string" ? entry.title : undefined,
      description: typeof entry.description === "string" ? entry.description : undefined,
      hidden: entry.hidden === true,
    }
  }

  return result
}

function normalizeSections(value: unknown): SectionDraft[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((item) => {
    const entry = asRecord(item)
    const title = asString(entry.title)
    if (!title) return []

    return [{
      id: asString(entry.id) || createSectionId(),
      title,
      body: asString(entry.body),
      hidden: entry.hidden === true,
    }]
  })
}

function normalizeServer(value: unknown): ServerDraft {
  const item = asRecord(value)
  const features = Array.isArray(item.features) ? item.features : []

  return {
    name: asString(item.name),
    tagline: asString(item.tagline),
    description: asString(item.description),
    // An empty stored description is the explicit "hide the panel" value.
    hideDescription: item.description === "",
    image: asString(item.image),
    featuresTouched: Array.isArray(item.features),
    features: features.flatMap((feature) => {
      const entry = asRecord(feature)
      const icon = asString(entry.icon)
      const title = asString(entry.title)
      const description = asString(entry.description)
      if (!icon || !title || !description) return []

      return [{ icon, title, description }]
    }),
  }
}

/** Only overrides leave the panel; an empty field keeps the site default. */
export function serializeDraft(page: SitePageId, draft: SiteDraft, locale: SiteLocale): unknown {
  if (draft.kind === "home") {
    const carousel = draft.carousel
      .filter((slide) => slide.image.trim())
      .map((slide) => {
        const alt = slide.alt.trim()
        return alt ? { image: slide.image.trim(), alt } : { image: slide.image.trim() }
      })

    const result: Record<string, unknown> = {}

    if (carousel.length) result.carousel = carousel

    const sections = serializeSections(draft.sections)
    if (sections.length) result.sections = sections

    const blocks = serializeBlocks(page, locale, draft.blocks)
    if (Object.keys(blocks).length) result.blocks = blocks

    return result
  }

  if (draft.kind === "sections") {
    const result: Record<string, unknown> = { sections: serializeSections(draft.sections) }
    const blocks = serializeBlocks(page, locale, draft.blocks)
    if (Object.keys(blocks).length) result.blocks = blocks

    return result
  }

  const result: Record<string, unknown> = {}
  const title = draft.title.trim()
  const description = draft.description.trim()

  if (title) result.title = title
  if (description) result.description = description

  const items: Record<string, unknown> = {}
  for (const [id, item] of Object.entries(draft.items)) {
    const serialized = serializeServer(item)
    if (Object.keys(serialized).length) items[id] = serialized
  }

  if (Object.keys(items).length) result.items = items

  const sections = serializeSections(draft.sections)
  if (sections.length) result.sections = sections

  const blocks = serializeBlocks(page, locale, draft.blocks)
  if (Object.keys(blocks).length) result.blocks = blocks

  return result
}

function serializeBlocks(
  page: SitePageId,
  locale: SiteLocale,
  blocks: Record<string, BlockDraft>,
) {
  const result: Record<string, { title?: string, description?: string, hidden?: boolean }> = {}

  for (const [id, block] of Object.entries(blocks)) {
    const defaults = BLOCK_DEFAULTS[page]?.[id]?.[locale] ?? {}
    const value: { title?: string, description?: string, hidden?: boolean } = {}

    // Only fields that differ from the site copy are stored; the panel shows the
    // defaults, so an untouched field must not freeze them in the document.
    if (block.title !== undefined && block.title !== (defaults.title ?? "")) value.title = block.title
    if (block.description !== undefined && block.description !== (defaults.description ?? "")) {
      value.description = block.description
    }
    if (block.hidden) value.hidden = true

    if (Object.keys(value).length) result[id] = value
  }

  return result
}

function serializeSections(sections: SectionDraft[]) {
  return sections
    .filter((section) => section.title.trim())
    .map((section) => ({
      id: section.id,
      title: section.title.trim(),
      body: section.body,
      ...(section.hidden ? { hidden: true } : {}),
    }))
}

function serializeServer(item: ServerDraft): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const name = item.name.trim()
  const tagline = item.tagline.trim()
  const image = item.image.trim()

  if (name) result.name = name
  if (tagline) result.tagline = tagline
  if (item.hideDescription) result.description = ""
  else if (item.description.trim()) result.description = item.description

  if (image) result.image = image

  const features = item.features
    .map((feature) => ({
      icon: feature.icon.trim(),
      title: feature.title.trim(),
      description: feature.description.trim(),
    }))
    .filter((feature) => feature.icon && feature.title && feature.description)

  if (features.length || item.featuresTouched) result.features = features

  return result
}

export function serverDraftOf(draft: SiteDraft | null, id: string): ServerDraft {
  if (draft?.kind !== "servers") return EMPTY_SERVER

  return draft.items[id] ?? EMPTY_SERVER
}

const pageAtom = atom<SitePageId>("home", "siteEditor.page")
const localeAtom = atom<SiteLocale>("ru", "siteEditor.locale")
const docsAtom = atom<Record<string, SiteAdminPayload>>({}, "siteEditor.docs")
const draftsAtom = atom<Record<string, SiteDraft>>({}, "siteEditor.drafts")
const dirtyAtom = atom<Record<string, boolean>>({}, "siteEditor.dirty")
const imageTargetAtom = atom<ImageTarget | null>(null, "siteEditor.imageTarget")

const currentAtom = atom((ctx): SiteTarget => ({
  page: ctx.get(pageAtom),
  locale: ctx.get(localeAtom),
}), "siteEditor.current")

const patchDraft = (ctx: Ctx, draft: SiteDraft, update: (current: SiteDraft) => SiteDraft) => {
  const key = targetKey(ctx.get(currentAtom))

  draftsAtom(ctx, { ...ctx.get(draftsAtom), [key]: update(draft) })
  dirtyAtom(ctx, { ...ctx.get(dirtyAtom), [key]: true })
}

const load = reatomAsync(async (ctx, target: SiteTarget) => {
  const payload = await ctx.schedule(() => getSiteContentAdmin(target.page, target.locale))

  return { target, payload }
}, {
  name: "siteEditor.load",
  onFulfill: (ctx, { target, payload }) => {
    const key = targetKey(target)

    docsAtom(ctx, { ...ctx.get(docsAtom), [key]: payload })

    // Keep unsaved edits when the same document is fetched again.
    if (!ctx.get(dirtyAtom)[key]) {
      draftsAtom(ctx, { ...ctx.get(draftsAtom), [key]: normalizeDraft(target.page, payload.draft ?? payload.published) })
    }
  },
  onReject: (_, error) => logError(error, { type: "combined" }),
}).pipe(withStatusesAtom(), withErrorAtom())

const ensure = action((ctx) => {
  const target = ctx.get(currentAtom)

  if (!ctx.get(docsAtom)[targetKey(target)]) load(ctx, target)
}, "siteEditor.ensure")

const refresh = action((ctx) => {
  const target = ctx.get(currentAtom)
  const key = targetKey(target)
  const docs = { ...ctx.get(docsAtom) }
  const drafts = { ...ctx.get(draftsAtom) }

  delete docs[key]
  delete drafts[key]

  docsAtom(ctx, docs)
  draftsAtom(ctx, drafts)
  dirtyAtom(ctx, { ...ctx.get(dirtyAtom), [key]: false })
  load(ctx, target)
}, "siteEditor.refresh")

const selectPage = action((ctx, page: SitePageId) => {
  pageAtom(ctx, page)
  ensure(ctx)
}, "siteEditor.selectPage")

const selectLocale = action((ctx, locale: SiteLocale) => {
  localeAtom(ctx, locale)
  ensure(ctx)
}, "siteEditor.selectLocale")

const catalog = reatomAsync(async (ctx) => {
  const list = await ctx.schedule(() => client.get("/privated/servers/"))

  return list.map((server): ServerOption => ({
    origin: server.origin.toLowerCase(),
    fullname: server.fullname,
  }))
}, {
  name: "siteEditor.catalog",
  onReject: (_, error) => logError(error, { type: "combined" }),
}).pipe(withDataAtom(null), withStatusesAtom(), withErrorAtom())

const currentDraft = (ctx: Ctx) => ctx.get(draftsAtom)[targetKey(ctx.get(currentAtom))]

const setSlide = action((ctx, index: number, patch: Partial<SlideDraft>) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "home") return

  patchDraft(ctx, draft, (current) => {
    if (current.kind !== "home") return current

    return {
      ...current,
      carousel: current.carousel.map((slide, idx) => idx === index ? { ...slide, ...patch } : slide),
    }
  })
}, "siteEditor.setSlide")

const addSlide = action((ctx) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "home") return

  patchDraft(ctx, draft, (current) => {
    if (current.kind !== "home") return current

    return { ...current, carousel: [...current.carousel, { image: "", alt: "" }] }
  })
}, "siteEditor.addSlide")

const removeSlide = action((ctx, index: number) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "home") return

  patchDraft(ctx, draft, (current) => {
    if (current.kind !== "home") return current

    return { ...current, carousel: current.carousel.filter((_, idx) => idx !== index) }
  })
}, "siteEditor.removeSlide")

const moveSlide = action((ctx, index: number, delta: -1 | 1) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "home") return

  const next = index + delta
  if (next < 0 || next >= draft.carousel.length) return

  patchDraft(ctx, draft, (current) => {
    if (current.kind !== "home") return current

    const carousel = [...current.carousel]
    const [slide] = carousel.splice(index, 1)
    carousel.splice(next, 0, slide)

    return { ...current, carousel }
  })
}, "siteEditor.moveSlide")

const setServersPage = action((ctx, patch: { title?: string; description?: string }) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "servers") return

  patchDraft(ctx, draft, (current) => current.kind === "servers" ? { ...current, ...patch } : current)
}, "siteEditor.setServersPage")

const setServer = action((ctx, id: string, patch: Partial<ServerDraft>) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "servers") return

  patchDraft(ctx, draft, (current) => {
    if (current.kind !== "servers") return current

    return { ...current, items: { ...current.items, [id]: { ...serverDraftOf(current, id), ...patch } } }
  })
}, "siteEditor.setServer")

const addFeature = action((ctx, id: string) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "servers") return

  setServer(ctx, id, {
    featuresTouched: true,
    features: [...serverDraftOf(draft, id).features, { icon: "", title: "", description: "" }],
  })
}, "siteEditor.addFeature")

const setFeature = action((ctx, id: string, index: number, patch: Partial<FeatureDraft>) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "servers") return

  setServer(ctx, id, {
    featuresTouched: true,
    features: serverDraftOf(draft, id).features.map((feature, idx) => idx === index ? { ...feature, ...patch } : feature),
  })
}, "siteEditor.setFeature")

const removeFeature = action((ctx, id: string, index: number) => {
  const draft = currentDraft(ctx)
  if (draft?.kind !== "servers") return

  setServer(ctx, id, {
    featuresTouched: true,
    features: serverDraftOf(draft, id).features.filter((_, idx) => idx !== index),
  })
}, "siteEditor.removeFeature")

const setBlock = action((ctx, id: string, patch: Partial<Omit<BlockDraft, never>>) => {
  const draft = currentDraft(ctx)
  if (!draft) return

  const current = draft.blocks[id] ?? { hidden: false }
  patchDraft(ctx, draft, (value) => ({
    ...value,
    blocks: { ...value.blocks, [id]: { ...current, ...patch } },
  }))
}, "siteEditor.setBlock")

const toggleBlock = action((ctx, id: string) => {
  const draft = currentDraft(ctx)
  if (!draft) return

  const current = draft.blocks[id] ?? { hidden: false }
  patchDraft(ctx, draft, (value) => ({
    ...value,
    blocks: { ...value.blocks, [id]: { ...current, hidden: !current.hidden } },
  }))
}, "siteEditor.toggleBlock")

const resetBlock = action((ctx, id: string) => {
  const draft = currentDraft(ctx)
  if (!draft) return

  const blocks = { ...draft.blocks }
  delete blocks[id]

  patchDraft(ctx, draft, (current) => ({ ...current, blocks }))
}, "siteEditor.resetBlock")

const patchSections = action((ctx, update: (sections: SectionDraft[]) => SectionDraft[]) => {
  const draft = currentDraft(ctx)
  if (!draft) return

  patchDraft(ctx, draft, (current) => ({ ...current, sections: update(current.sections) }))
}, "siteEditor.patchSections")

const addSection = action((ctx) => {
  patchSections(ctx, (sections) => [
    ...sections,
    { id: createSectionId(), title: "", body: "", hidden: false },
  ])
}, "siteEditor.addSection")

const setSection = action((ctx, index: number, patch: Partial<Omit<SectionDraft, "id">>) => {
  patchSections(ctx, (sections) => sections.map((section, idx) => idx === index ? { ...section, ...patch } : section))
}, "siteEditor.setSection")

const removeSection = action((ctx, index: number) => {
  patchSections(ctx, (sections) => sections.filter((_, idx) => idx !== index))
}, "siteEditor.removeSection")

const moveSection = action((ctx, index: number, delta: -1 | 1) => {
  const next = index + delta

  patchSections(ctx, (sections) => {
    if (next < 0 || next >= sections.length) return sections

    const result = [...sections]
    const [section] = result.splice(index, 1)
    result.splice(next, 0, section)

    return result
  })
}, "siteEditor.moveSection")

const toggleSection = action((ctx, index: number) => {
  patchSections(ctx, (sections) => sections.map((section, idx) => idx === index
    ? { ...section, hidden: !section.hidden }
    : section))
}, "siteEditor.toggleSection")

const setImageTarget = action((ctx, target: ImageTarget) => {
  imageTargetAtom(ctx, target)
}, "siteEditor.setImageTarget")

const applyImage = action((ctx, key: string) => {
  const target = ctx.get(imageTargetAtom)
  imageTargetAtom(ctx, null)
  if (!target) return

  if (target.kind === "slide") {
    setSlide(ctx, target.index, { image: key })
    return
  }

  if (target.kind === "server") {
    setServer(ctx, target.id, { image: key })
    return
  }

  setFeature(ctx, target.id, target.index, { icon: key })
}, "siteEditor.applyImage")

const save = reatomAsync(async (ctx, target: SiteTarget) => {
  const key = targetKey(target)
  const doc = ctx.get(docsAtom)[key]
  const draft = ctx.get(draftsAtom)[key]

  if (!doc || !draft) throw new Error("SITE_DOCUMENT_NOT_LOADED")

  const payload = await ctx.schedule(() =>
    saveSiteContentDraft(target.page, target.locale, {
      version: doc.version,
      content: serializeDraft(target.page, draft, target.locale),
    }),
  )

  return { target, payload }
}, {
  name: "siteEditor.save",
  onFulfill: (ctx, { target, payload }) => {
    const key = targetKey(target)

    docsAtom(ctx, { ...ctx.get(docsAtom), [key]: payload })
    draftsAtom(ctx, { ...ctx.get(draftsAtom), [key]: normalizeDraft(target.page, payload.draft ?? payload.published) })
    dirtyAtom(ctx, { ...ctx.get(dirtyAtom), [key]: false })
    toast.success(translate["panel.site-draft-saved"]())
  },
  onReject: (_, error) => {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") {
      toast.error(translate["panel.site-conflict"]())
      return
    }

    logError(error, { type: "combined" })
    toast.error(translate["panel.site-save-error"]())
  },
}).pipe(withStatusesAtom())

const publish = reatomAsync(async (ctx, target: SiteTarget) => {
  const doc = ctx.get(docsAtom)[targetKey(target)]

  if (!doc) throw new Error("SITE_DOCUMENT_NOT_LOADED")

  const payload = await ctx.schedule(() => publishSiteContent(target.page, target.locale, doc.version))

  return { target, payload }
}, {
  name: "siteEditor.publish",
  onFulfill: (ctx, { target, payload }) => {
    const key = targetKey(target)

    docsAtom(ctx, { ...ctx.get(docsAtom), [key]: payload })
    draftsAtom(ctx, { ...ctx.get(draftsAtom), [key]: normalizeDraft(target.page, payload.draft ?? payload.published) })
    dirtyAtom(ctx, { ...ctx.get(dirtyAtom), [key]: false })
    toast.success(translate["panel.site-published"]())
  },
  onReject: (_, error) => {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") {
      toast.error(translate["panel.site-conflict"]())
      return
    }

    logError(error, { type: "combined" })
    toast.error(translate["panel.site-publish-error"]())
  },
}).pipe(withStatusesAtom())

const discardDraft = reatomAsync(async (ctx, target: SiteTarget) => {
  const doc = ctx.get(docsAtom)[targetKey(target)]

  if (!doc) throw new Error("SITE_DOCUMENT_NOT_LOADED")

  const payload = await ctx.schedule(() => discardSiteContentDraft(target.page, target.locale, doc.version))

  return { target, payload }
}, {
  name: "siteEditor.discardDraft",
  onFulfill: (ctx, { target, payload }) => {
    const key = targetKey(target)

    docsAtom(ctx, { ...ctx.get(docsAtom), [key]: payload })
    draftsAtom(ctx, { ...ctx.get(draftsAtom), [key]: normalizeDraft(target.page, payload.draft ?? payload.published) })
    dirtyAtom(ctx, { ...ctx.get(dirtyAtom), [key]: false })
    toast.success(translate["panel.site-draft-discarded"]())
  },
  onReject: (_, error) => {
    if (error instanceof Error && error.message === "VERSION_CONFLICT") {
      toast.error(translate["panel.site-conflict"]())
      return
    }

    logError(error, { type: "combined" })
    toast.error(translate["panel.site-save-error"]())
  },
}).pipe(withStatusesAtom())

const discard = action((ctx) => {
  const target = ctx.get(currentAtom)

  alertDialog.open(ctx, {
    title: translate["panel.site-discard-confirm"](),
    onConfirm: () => discardDraft(ctx, target),
  })
}, "siteEditor.discard")

/** The panel-facing surface: atoms for rendering, actions for changes. */
export const siteEditor = {
  page: pageAtom,
  locale: localeAtom,
  docs: docsAtom,
  drafts: draftsAtom,
  dirty: dirtyAtom,
  imageTarget: imageTargetAtom,
  current: currentAtom,
  load,
  ensure,
  refresh,
  selectPage,
  selectLocale,
  catalog,
  setSlide,
  addSlide,
  removeSlide,
  moveSlide,
  setServersPage,
  setServer,
  addFeature,
  setFeature,
  removeFeature,
  setBlock,
  toggleBlock,
  resetBlock,
  addSection,
  setSection,
  removeSection,
  moveSection,
  toggleSection,
  setImageTarget,
  applyImage,
  save,
  publish,
  discardDraft,
  discard,
}
