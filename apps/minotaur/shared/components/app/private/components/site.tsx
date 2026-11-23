import { reatomComponent, useUpdate } from "@reatom/npm-react"
import type { Ctx } from "@reatom/framework"
import type { ReactNode } from "react"
import { clsx } from "cnfast"
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Typography } from "@/shared/ui/typography"
import { ErrorBlock } from "@/shared/ui/error-block"
import { PageLoader } from "@/shared/ui/page-loader"
import { SectionWrapper, WithHeader } from "./ui"
import { storageModel } from "./storage"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { CONTENT_PUBLISH_PERMISSION, CONTENT_UPDATE_PERMISSION } from "@/shared/consts/permissions"
import { dayjs } from "@/shared/lib/dayjs"
import { env } from "@/shared/env"
import { getStaticImage } from "@/shared/lib/helpers"
import {
  serverDraftOf, siteEditor,
  type ImageTarget, type ServerDraft, type SiteDraft, type SiteLocale,
  type SitePageId, type SiteTarget,
} from "../models/site.model"
import { translate } from "@/shared/locales/helpers"

const { Storage, storageState } = storageModel({
  name: "site-content",
  as: "drawer",
  Slot: <span className="hidden" />,
  onSelectFile(ctx, fileName) {
    siteEditor.applyImage(ctx, fileName)
  },
})

const STATIC_BUCKET = "static"

const openImagePicker = (ctx: Ctx, target: ImageTarget) => {
  siteEditor.setImageTarget(ctx, target)
  storageState.bucket(ctx, STATIC_BUCKET)
  storageState.folder(ctx, "")
  storageState.section(ctx, "bucket-list")
  storageState.isOpen(ctx, true)
}

/** Built per render: the module scope would freeze the locale of the first request. */
const createPages = (): { value: SitePageId, title: string, path: string }[] => [
  { value: "home", title: translate["panel.site-home"](), path: "/" },
  { value: "servers", title: translate["panel.site-servers"](), path: "/servers" },
  { value: "start", title: translate["panel.site-start"](), path: "/start" },
  { value: "support", title: translate["panel.site-support"](), path: "/support" },
  { value: "modpack", title: translate["panel.site-modpack"](), path: "/modpack" },
]

const editVariant = (active: boolean) => active
  ? "bg-neutral-50! text-neutral-950!"
  : "bg-neutral-800"

const Field = ({ label, children }: { label: string, children: ReactNode }) => (
  <label className="flex w-full flex-col gap-1">
    <span className="text-xs font-medium text-neutral-400">{label}</span>
    {children}
  </label>
)

const TextField = ({ label, value, disabled, onChange }: {
  label: string, value: string, disabled?: boolean, onChange: (value: string) => void
}) => (
  <Field label={label}>
    <Input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
  </Field>
)

const TextArea = ({ label, value, rows = 3, disabled, onChange }: {
  label: string, value: string, rows?: number, disabled?: boolean, onChange: (value: string) => void
}) => (
  <Field label={label}>
    <textarea
      value={value}
      rows={rows}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="w-full resize-y rounded-xl bg-neutral-800 px-4 py-2 text-sm outline-none
        focus:ring-2 focus:ring-inset focus:ring-green-500 disabled:opacity-70"
    />
  </Field>
)

const IconButton = ({ icon, label, disabled, onClick }: {
  icon: "sprite:arrow-up" | "sprite:arrow-down" | "sprite:trash" | "sprite:plus",
  label: string, disabled?: boolean, onClick: () => void
}) => (
  <Button
    background="default"
    className="size-8 shrink-0 p-0"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
  >
    <Icon name={icon} className="size-4" />
  </Button>
)

const ImageField = ({ value, disabled, onPick, onChange }: {
  value: string, disabled?: boolean, onPick: () => void, onChange: (value: string) => void
}) => (
  <div className="flex w-full items-start gap-2">
    <Input
      value={value}
      disabled={disabled}
      placeholder={translate["panel.site-image-hint"]()}
      onChange={(event) => onChange(event.target.value)}
    />
    <Button background="default" className="h-10 shrink-0 text-sm" disabled={disabled} onClick={onPick}>
      {translate["panel.select"]()}
    </Button>
    {value && (
      <img
        src={getStaticImage(value)}
        alt=""
        className="h-10 w-16 shrink-0 rounded-lg bg-neutral-800 object-cover"
      />
    )}
  </div>
)

const CarouselSlide = reatomComponent<{ index: number, slide: { image: string, alt: string }, count: number, canEdit: boolean }>(
  ({ ctx, index, slide, count, canEdit }) => {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-2">
        <div className="flex items-center justify-between gap-2">
          <Typography className="text-sm font-semibold">
            {translate["panel.site-slide"]({ index: index + 1 })}
          </Typography>
          <div className="flex items-center gap-1">
            <IconButton
              icon="sprite:arrow-up"
              label={translate["panel.move-up"]()}
              disabled={!canEdit || index === 0}
              onClick={() => siteEditor.moveSlide(ctx, index, -1)}
            />
            <IconButton
              icon="sprite:arrow-down"
              label={translate["panel.move-down"]()}
              disabled={!canEdit || index === count - 1}
              onClick={() => siteEditor.moveSlide(ctx, index, 1)}
            />
            <IconButton
              icon="sprite:trash"
              label={translate["panel.delete"]()}
              disabled={!canEdit}
              onClick={() => siteEditor.removeSlide(ctx, index)}
            />
          </div>
        </div>
        <ImageField
          value={slide.image}
          disabled={!canEdit}
          onPick={() => openImagePicker(ctx, { kind: "slide", index })}
          onChange={(value) => siteEditor.setSlide(ctx, index, { image: value })}
        />
        <TextField
          label={translate["panel.site-alt"]()}
          value={slide.alt}
          disabled={!canEdit}
          onChange={(value) => siteEditor.setSlide(ctx, index, { alt: value })}
        />
      </div>
    )
  },
  "SiteCarouselSlide",
)

const CarouselEditor = reatomComponent<{ draft: Extract<SiteDraft, { kind: "home" }>, canEdit: boolean }>(
  ({ ctx, draft, canEdit }) => (
    <div className="flex flex-col gap-2">
      <Typography color="gray" className="text-xs">
        {translate["panel.site-carousel-hint"]()}
      </Typography>
      {draft.carousel.map((slide, index) => (
        <CarouselSlide
          key={index}
          index={index}
          slide={slide}
          count={draft.carousel.length}
          canEdit={canEdit}
        />
      ))}
      <Button
        background="default"
        className="h-8 w-fit text-sm"
        disabled={!canEdit}
        onClick={() => siteEditor.addSlide(ctx)}
      >
        <Icon name="sprite:plus" className="size-4" />
        {translate["panel.site-add-slide"]()}
      </Button>
    </div>
  ),
  "SiteCarouselEditor",
)

const FeatureRow = reatomComponent<{
  serverId: string, index: number, feature: { icon: string, title: string, description: string }, canEdit: boolean
}>(({ ctx, serverId, index, feature, canEdit }) => (
  <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 p-2">
    <div className="flex items-center justify-between gap-2">
      <Typography className="text-xs font-semibold text-neutral-400">
        {translate["panel.site-feature"]({ index: index + 1 })}
      </Typography>
      <IconButton
        icon="sprite:trash"
        label={translate["panel.delete"]()}
        disabled={!canEdit}
        onClick={() => siteEditor.removeFeature(ctx, serverId, index)}
      />
    </div>
    <ImageField
      value={feature.icon}
      disabled={!canEdit}
      onPick={() => openImagePicker(ctx, { kind: "feature", id: serverId, index })}
      onChange={(value) => siteEditor.setFeature(ctx, serverId, index, { icon: value })}
    />
    <TextField
      label={translate["panel.title"]()}
      value={feature.title}
      disabled={!canEdit}
      onChange={(value) => siteEditor.setFeature(ctx, serverId, index, { title: value })}
    />
    <TextArea
      label={translate["panel.description"]()}
      value={feature.description}
      rows={2}
      disabled={!canEdit}
      onChange={(value) => siteEditor.setFeature(ctx, serverId, index, { description: value })}
    />
  </div>
), "SiteFeatureRow")

const ServerCard = reatomComponent<{ id: string, title: string, canEdit: boolean }>(
  ({ ctx, id, title, canEdit }) => {
    const key = `${ctx.spy(siteEditor.page)}:${ctx.spy(siteEditor.locale)}`
    const draft = ctx.spy(siteEditor.drafts)[key]
    const server: ServerDraft = serverDraftOf(draft, id)
    const set = (patch: Partial<ServerDraft>) => siteEditor.setServer(ctx, id, patch)

    return (
      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-2">
        <div className="flex items-center justify-between gap-2">
          <Typography className="text-sm font-semibold">{title}</Typography>
          <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
            {id}
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <TextField
            label={translate["panel.title-2"]()}
            value={server.name}
            disabled={!canEdit}
            onChange={(value) => set({ name: value })}
          />
          <TextField
            label={translate["panel.site-tagline"]()}
            value={server.tagline}
            disabled={!canEdit}
            onChange={(value) => set({ tagline: value })}
          />
        </div>
        <ImageField
          value={server.image}
          disabled={!canEdit}
          onPick={() => openImagePicker(ctx, { kind: "server", id })}
          onChange={(value) => set({ image: value })}
        />
        <TextArea
          label={translate["panel.description"]()}
          value={server.description}
          disabled={!canEdit || server.hideDescription}
          onChange={(value) => set({ description: value })}
        />
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={server.hideDescription}
            disabled={!canEdit}
            onChange={(event) => set({ hideDescription: event.target.checked })}
          />
          {translate["panel.site-hide-description"]()}
        </label>
        <div className="flex flex-col gap-2">
          {server.features.map((feature, index) => (
            <FeatureRow
              key={index}
              serverId={id}
              index={index}
              feature={feature}
              canEdit={canEdit}
            />
          ))}
          <Button
            background="default"
            className="h-8 w-fit text-sm"
            disabled={!canEdit}
            onClick={() => siteEditor.addFeature(ctx, id)}
          >
            <Icon name="sprite:plus" className="size-4" />
            {translate["panel.site-add-feature"]()}
          </Button>
        </div>
      </div>
    )
  },
  "SiteServerCard",
)

const ServersEditor = reatomComponent<{ draft: Extract<SiteDraft, { kind: "servers" }>, canEdit: boolean }>(
  ({ ctx, draft, canEdit }) => {
    const catalog = ctx.spy(siteEditor.catalog.dataAtom) ?? []

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-2">
          <Typography className="text-sm font-semibold">
            {translate["panel.site-page-copy"]()}
          </Typography>
          <TextField
            label={translate["panel.title"]()}
            value={draft.title}
            disabled={!canEdit}
            onChange={(value) => siteEditor.setServersPage(ctx, { title: value })}
          />
          <TextArea
            label={translate["panel.description"]()}
            value={draft.description}
            disabled={!canEdit}
            onChange={(value) => siteEditor.setServersPage(ctx, { description: value })}
          />
        </div>
        {catalog.map((server) => (
          <ServerCard
            key={server.origin}
            id={server.origin}
            title={server.fullname}
            canEdit={canEdit}
          />
        ))}
        {!catalog.length && (
          <Typography color="gray" className="text-sm">
            {translate["panel.site-empty-item"]()}
          </Typography>
        )}
      </div>
    )
  },
  "SiteServersEditor",
)

const SectionsEditor = reatomComponent<{ draft: SiteDraft, canEdit: boolean }>(({ ctx, draft, canEdit }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-2">
    <Typography className="text-sm font-semibold">
      {translate["panel.site-sections"]()}
    </Typography>
    <Typography color="gray" className="text-xs">
      {translate["panel.site-sections-hint"]()}
    </Typography>
    {draft.sections.map((section, index) => (
      <div key={section.id} className="flex flex-col gap-2 rounded-lg border border-neutral-800 p-2">
        <div className="flex items-center justify-between gap-2">
          <Typography className="text-xs font-semibold text-neutral-400">
            {translate["panel.site-section"]({ index: index + 1 })}
            {section.hidden && ` · ${translate["panel.site-section-hidden"]()}`}
          </Typography>
          <div className="flex items-center gap-1">
            <IconButton
              icon="sprite:arrow-up"
              label={translate["panel.move-up"]()}
              disabled={!canEdit || index === 0}
              onClick={() => siteEditor.moveSection(ctx, index, -1)}
            />
            <IconButton
              icon="sprite:arrow-down"
              label={translate["panel.move-down"]()}
              disabled={!canEdit || index === draft.sections.length - 1}
              onClick={() => siteEditor.moveSection(ctx, index, 1)}
            />
            <IconButton
              icon="sprite:trash"
              label={translate["panel.delete"]()}
              disabled={!canEdit}
              onClick={() => siteEditor.removeSection(ctx, index)}
            />
          </div>
        </div>
        <TextField
          label={translate["panel.title"]()}
          value={section.title}
          disabled={!canEdit}
          onChange={(value) => siteEditor.setSection(ctx, index, { title: value })}
        />
        <TextArea
          label={translate["panel.description"]()}
          value={section.body}
          disabled={!canEdit}
          onChange={(value) => siteEditor.setSection(ctx, index, { body: value })}
        />
        <label className="flex items-center gap-2 text-xs text-neutral-400">
          <input
            type="checkbox"
            checked={section.hidden}
            disabled={!canEdit}
            onChange={() => siteEditor.toggleSection(ctx, index)}
          />
          {translate["panel.site-hide-section"]()}
        </label>
      </div>
    ))}
    <Button
      background="default"
      className="h-8 w-fit text-sm"
      disabled={!canEdit}
      onClick={() => siteEditor.addSection(ctx)}
    >
      <Icon name="sprite:plus" className="size-4" />
      {translate["panel.site-add-section"]()}
    </Button>
  </div>
), "SiteSectionsEditor")

export const SitePanel = reatomComponent(({ ctx }) => {
  useUpdate(siteEditor.ensure, [])
  useUpdate(siteEditor.catalog, [])

  const page = ctx.spy(siteEditor.page)
  const locale = ctx.spy(siteEditor.locale)
  const key = `${page}:${locale}`
  const doc = ctx.spy(siteEditor.docs)[key]
  const draft = ctx.spy(siteEditor.drafts)[key]
  const dirty = ctx.spy(siteEditor.dirty)[key] ?? false
  const loadStatus = ctx.spy(siteEditor.load.statusesAtom)
  const loadError = ctx.spy(siteEditor.load.errorAtom)
  const saving = ctx.spy(siteEditor.save.statusesAtom).isPending
  const publishing = ctx.spy(siteEditor.publish.statusesAtom).isPending
  const permissions = ctx.spy(currentUserState.perms)
  const canEdit = permissions.includes(CONTENT_UPDATE_PERMISSION)
  const canPublish = permissions.includes(CONTENT_PUBLISH_PERMISSION)

  const pages = createPages()
  const currentPage = pages.find((item) => item.value === page) ?? pages[0]
  const target: SiteTarget = { page, locale }

  const updated = doc?.updatedAt ? dayjs(doc.updatedAt).format("DD.MM.YYYY HH:mm") : null

  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title={translate["panel.site"]()}>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {pages.map((item) => (
            <Button
              key={item.value}
              background="default"
              className={clsx("h-7 rounded-lg px-3 text-xs", editVariant(page === item.value))}
              onClick={() => siteEditor.selectPage(ctx, item.value)}
            >
              {item.title}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-neutral-800" />
          {(["ru", "en"] as SiteLocale[]).map((value) => (
            <Button
              key={value}
              background="default"
              className={clsx("h-7 rounded-lg px-2 text-xs", editVariant(locale === value))}
              onClick={() => siteEditor.selectLocale(ctx, value)}
            >
              {value.toUpperCase()}
            </Button>
          ))}
          <Button
            background="default"
            className="h-7 rounded-lg px-2 text-xs"
            title={translate["panel.refresh"]()}
            disabled={loadStatus.isPending}
            onClick={() => siteEditor.refresh(ctx)}
          >
            <Icon name="sprite:refresh" className="size-4" />
          </Button>
          <a
            href={`${env.VITE_LANDING_URL}${currentPage.path}`}
            target="_blank"
            rel="noreferrer"
            className="flex h-7 items-center gap-1 rounded-lg bg-neutral-800 px-2 text-xs
              text-neutral-50 duration-150 hover:bg-neutral-700"
          >
            <Icon name="sprite:external-link" className="size-4" />
            {translate["panel.site-open-page"]()}
          </a>
        </div>
      </WithHeader>
      <Typography color="gray" className="text-xs">
        {translate["panel.site-description"]()}
      </Typography>
      {loadError && (
        <div className="flex flex-col items-start gap-2">
          <ErrorBlock title={translate["panel.site-load-error"]()} />
          <Button background="default" className="h-8 text-sm" onClick={() => siteEditor.refresh(ctx)}>
            {translate["panel.retry"]()}
          </Button>
        </div>
      )}
      {!doc && !loadError && <PageLoader />}
      {doc && draft && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
              {translate["panel.site-version"]({ version: doc.version })}
            </span>
            {updated && (
              <span className="text-[11px] text-neutral-500">
                {translate["panel.site-updated-at"]({ date: updated })}
              </span>
            )}
            {doc.updatedBy && (
              <span className="text-[11px] text-neutral-500">
                {translate["panel.site-updated-by"]({ name: doc.updatedBy })}
              </span>
            )}
            {dirty && (
              <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">
                {translate["panel.site-dirty"]()}
              </span>
            )}
            {!canEdit && (
              <span className="text-[11px] text-neutral-500">
                {translate["panel.no-access"]()}
              </span>
            )}
          </div>
          {draft.kind === "home" && <CarouselEditor draft={draft} canEdit={canEdit} />}
          {draft.kind === "servers" && <ServersEditor draft={draft} canEdit={canEdit} />}
          <SectionsEditor draft={draft} canEdit={canEdit} />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              background="default"
              className="h-9"
              disabled={!canEdit || !dirty || saving}
              onClick={() => siteEditor.save(ctx, target)}
            >
              {translate["panel.site-save-draft"]()}
            </Button>
            <Button
              background="positive"
              className="h-9"
              title={dirty ? translate["panel.site-save-first"]() : undefined}
              disabled={!canPublish || dirty || saving || publishing || !doc.draft}
              onClick={() => siteEditor.publish(ctx, target)}
            >
              {translate["panel.site-publish"]()}
            </Button>
            <Button
              variant="danger"
              className="h-9"
              disabled={!canPublish || !doc.draft || saving || publishing}
              onClick={() => siteEditor.discard(ctx)}
            >
              {translate["panel.site-discard"]()}
            </Button>
          </div>
        </>
      )}
      <Storage />
    </SectionWrapper>
  )
}, "SitePanel")
