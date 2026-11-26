import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { clsx } from "cnfast"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Icon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { Noop } from "@/shared/ui/noop"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { currentUserState } from "@/shared/models/current-user/index.model"
import { RESOURCEPACK_PUBLISH_PERMISSION } from "@/shared/consts/permissions"
import { translate } from "@/shared/locales/helpers"
import {
  resourcePacks, uploadFile, uploadForm, uploadWarnings, type ResourcePack,
} from "../models/resourcepack.model"

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" })

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? translate["panel.date-unknown"]() : dateFormatter.format(date)
}

function formatSize(bytes: number) {
  if (!bytes) return "—"

  const mb = bytes / 1024 / 1024
  return translate["panel.size-mb"]({ size: mb.toFixed(mb >= 10 ? 0 : 1) })
}

const VersionChips = ({ versions }: { versions: string[] }) => (
  <div className="flex flex-wrap items-center gap-1">
    {versions.map((version) => (
      <span key={version} className="rounded-md bg-neutral-800 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-300">
        {version}
      </span>
    ))}
  </div>
)

const PackCard = reatomComponent<{ pack: ResourcePack, canPublish: boolean, publishing: boolean }>(
  ({ ctx, pack, canPublish, publishing }) => {
    const publish = () => resourcePacks.publish(ctx, pack.id)

    return (
      <div
        className={clsx(
          "flex flex-col gap-2 rounded-xl border p-3",
          pack.is_current ? "border-green-500/40 bg-green-500/5" : "border-neutral-800",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Typography className="text-base font-semibold">v{pack.id}</Typography>
            {pack.is_current && (
              <span className="rounded-lg bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-400">
                {translate["panel.resourcepack-current"]()}
              </span>
            )}
            <VersionChips versions={pack.minecraft} />
            {pack.pack_format !== null && (
              <span className="text-[11px] text-neutral-500">pack_format {pack.pack_format}</span>
            )}
          </div>
          <span className="text-xs text-neutral-400">{formatDate(pack.created_at)}</span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400">
          <span>{formatSize(pack.size)}</span>
          <span className="font-mono" title={pack.sha1}>sha1 {pack.sha1.slice(0, 12)}…</span>
          {pack.uploaded_by && (
            <span>{translate["panel.resourcepack-uploaded-by"]()}: {pack.uploaded_by}</span>
          )}
        </div>

        {pack.notes && (
          <Typography className="text-sm leading-5 whitespace-pre-line text-neutral-300">
            {pack.notes}
          </Typography>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <a
            href={pack.url}
            target="_blank"
            rel="noreferrer noopener"
            className="text-[11px] text-neutral-400 underline underline-offset-2 hover:text-neutral-200"
          >
            {translate["panel.download"]()}
          </a>
          {canPublish && !pack.is_current && (
            <Button
              background="default"
              className="h-8 gap-1 px-3 text-xs"
              disabled={publishing}
              isLoading={publishing}
              withSpinner
              onClick={publish}
            >
              {translate["panel.resourcepack-rollback"]()}
            </Button>
          )}
        </div>
      </div>
    )
  },
  "PackCard",
)

const UploadForm = reatomComponent(({ ctx }) => {
  const file = ctx.spy(uploadFile)
  const form = ctx.spy(uploadForm)
  const status = ctx.spy(resourcePacks.upload.statusesAtom)
  const error = ctx.spy(resourcePacks.upload.errorAtom)
  const warnings = ctx.spy(uploadWarnings)

  const submit = () => {
    if (!file) return

    resourcePacks.upload(ctx, { file, minecraft: form.minecraft, notes: form.notes })
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-3">
      <Typography className="text-sm font-semibold">{translate["panel.resourcepack-upload"]()}</Typography>
      <Typography className="text-xs text-neutral-400">{translate["panel.resourcepack-hint"]()}</Typography>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 w-full">
          <span className="text-xs font-medium text-neutral-400">{translate["panel.resourcepack-file"]()}</span>
          <input
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={(event) => uploadFile(ctx, event.target.files?.[0] ?? null)}
            className="h-10 w-full rounded-xl bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-700 file:px-2 file:py-1 file:text-xs file:text-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1 w-full">
          <span className="text-xs font-medium text-neutral-400">{translate["panel.resourcepack-minecraft"]()}</span>
          <Input
            value={form.minecraft}
            onChange={(event) => uploadForm.set(ctx, "minecraft", event.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 w-full">
        <span className="text-xs font-medium text-neutral-400">{translate["panel.resourcepack-notes"]()}</span>
        <Input
          value={form.notes}
          onChange={(event) => uploadForm.set(ctx, "notes", event.target.value)}
        />
      </label>

      {error && <ErrorBlock title={error.message} />}

      {warnings.map((warning) => (
        <div key={warning} className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          {warning}
        </div>
      ))}

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-500">
          {file ? `${file.name} · ${formatSize(file.size)}` : translate["panel.select-a-file"]()}
        </span>
        <Button
          className="h-8 gap-1 px-3 text-xs"
          disabled={!file || status.isPending}
          isLoading={status.isPending}
          withSpinner
          onClick={submit}
        >
          {translate["panel.resourcepack-upload"]()}
        </Button>
      </div>
    </div>
  )
}, "ResourcePackUpload")

export const ResourcePacks = reatomComponent(({ ctx }) => {
  useUpdate(resourcePacks.fetch, [])

  const status = ctx.spy(resourcePacks.fetch.statusesAtom)
  const error = ctx.spy(resourcePacks.fetch.errorAtom)
  const data = ctx.spy(resourcePacks.fetch.dataAtom)
  const canPublish = ctx.spy(currentUserState.perms).includes(RESOURCEPACK_PUBLISH_PERMISSION)
  const publishing = ctx.spy(resourcePacks.publish.statusesAtom).isPending
  const adopting = ctx.spy(resourcePacks.adopt.statusesAtom).isPending
  const adoptError = ctx.spy(resourcePacks.adopt.errorAtom)
  const publishError = ctx.spy(resourcePacks.publish.errorAtom)

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-xs text-neutral-400">
          {translate["panel.resourcepack-hint"]()}
        </Typography>
        <div className="flex items-center gap-2">
          {canPublish && (
            <Button
              background="default"
              className="h-8 gap-1 px-3 text-xs"
              disabled={adopting}
              isLoading={adopting}
              withSpinner
              onClick={() => resourcePacks.adopt(ctx)}
            >
              {translate["panel.resourcepack-adopt"]()}
            </Button>
          )}
          <Button
            background="default"
            className="h-8 gap-2 px-3 text-sm"
            onClick={() => resourcePacks.fetch(ctx)}
            disabled={status.isPending}
          >
            <Icon name="sprite:refresh" className={status.isPending ? "size-4 animate-spin" : "size-4"} />
            {translate["panel.refresh"]()}
          </Button>
        </div>
      </div>

      {canPublish && <UploadForm />}

      {adoptError && <ErrorBlock title={adoptError.message} />}
      {publishError && <ErrorBlock title={publishError.message} />}

      {(status.isFirstPending || (!data && status.isPending)) && (
        <div className="flex flex-col gap-2 w-full">
          {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-24 w-full" />)}
        </div>
      )}

      {error && !status.isPending && (
        <div className="flex flex-col items-start gap-2">
          <ErrorBlock title={error.message} />
          <Button background="default" className="h-8 text-sm" onClick={() => resourcePacks.fetch(ctx)}>
            {translate["panel.retry"]()}
          </Button>
        </div>
      )}

      {!status.isPending && !error && data && data.items.length === 0 && (
        <Noop title={translate["panel.resourcepack-empty"]()} />
      )}

      {data && data.items.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.items.map((pack) => (
            <PackCard key={pack.id} pack={pack} canPublish={canPublish} publishing={publishing} />
          ))}
        </div>
      )}
    </div>
  )
}, "ResourcePacks")
