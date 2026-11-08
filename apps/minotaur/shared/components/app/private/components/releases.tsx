import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { env } from "@/shared/env"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Icon } from "@/shared/ui/icon"
import { Noop } from "@/shared/ui/noop"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import {
  RELEASE_CHANNELS, releases, releasesState, releaseDownloadUrl,
  type Release, type ReleasePlatform,
} from "../models/releases.model"

const dateFormatter = new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" })

const PLATFORM_LABELS: Record<string, string> = {
  "darwin-aarch64": "macOS (arm64)",
  "darwin-x86_64": "macOS (x64)",
  "windows-x86_64": "Windows (x64)",
}

function formatDate(value: Nullable<string>) {
  if (!value) return "дата неизвестна"

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "дата неизвестна" : dateFormatter.format(date)
}

function formatSize(bytes: number) {
  if (!bytes) return "—"

  const mb = bytes / 1024 / 1024
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} МБ`
}

const ReleasesSkeleton = () => (
  <div className="flex flex-col gap-2 w-full">
    {Array.from({ length: 4 }).map((_, idx) => (
      <Skeleton key={idx} className="h-28 w-full" />
    ))}
  </div>
)

const PlatformRow = reatomComponent<{ channel: Release["channel"], version: string, platform: ReleasePlatform }>(
  ({ ctx, channel, version, platform }) => {
    return (
      <div className="flex flex-col gap-1 rounded-lg border border-neutral-800 px-3 py-2">
        <Typography className="text-sm font-semibold">
          {PLATFORM_LABELS[platform.platform] ?? platform.platform}
        </Typography>
        {platform.files.map((file) => {
          const url = releaseDownloadUrl(env.VITE_API_URL, channel, version, platform.platform, file.name)

          return (
            <div key={file.name} className="flex items-center justify-between gap-2 min-w-0">
              <div className="flex flex-col min-w-0">
                <span className="text-xs truncate text-neutral-300">{file.name}</span>
                <span className="text-[11px] text-neutral-500">{formatSize(file.size)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {file.checksum && (
                  <a
                    href={releaseDownloadUrl(env.VITE_API_URL, channel, version, platform.platform, file.checksum)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-[11px] text-neutral-400 underline underline-offset-2 hover:text-neutral-200"
                  >
                    sha256
                  </a>
                )}
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 px-2 py-1 text-xs font-semibold hover:bg-neutral-700"
                >
                  <Icon name="sprite:download" className="size-3.5" />
                  Скачать
                </a>
              </div>
            </div>
          )
        })}
      </div>
    )
  },
  "ReleasePlatformRow"
)

const ReleaseCard = reatomComponent<Release>(({ channel, version, pub_date, notes, latest, platforms }) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Typography className="text-base font-semibold">v{version}</Typography>
          {latest && (
            <span className="rounded-lg bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold text-green-400">
              latest
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-400">{formatDate(pub_date)}</span>
      </div>
      {notes && (
        <Typography className="text-sm leading-5 whitespace-pre-line text-neutral-300">
          {notes}
        </Typography>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformRow key={platform.platform} channel={channel} version={version} platform={platform} />
        ))}
      </div>
    </div>
  )
}, "ReleaseCard")

const ChannelTabs = reatomComponent(({ ctx }) => {
  const active = ctx.spy(releasesState.channel)
  const pending = ctx.spy(releases.fetch.statusesAtom).isPending

  return (
    <div className="flex items-center gap-1 rounded-xl bg-neutral-800 p-1">
      {RELEASE_CHANNELS.map((channel) => (
        <button
          key={channel.value}
          type="button"
          data-state={active === channel.value}
          disabled={pending && active === channel.value}
          onClick={() => releasesState.channel(ctx, channel.value)}
          className="rounded-lg px-3 py-1 text-sm font-semibold duration-150 data-[state=true]:bg-neutral-50 data-[state=true]:text-neutral-950 data-[state=false]:text-neutral-300"
        >
          {channel.label}
        </button>
      ))}
    </div>
  )
}, "ReleasesChannelTabs")

export const Releases = reatomComponent(({ ctx }) => {
  useUpdate(releases.fetch, [])

  const status = ctx.spy(releases.fetch.statusesAtom)
  const error = ctx.spy(releases.fetch.errorAtom)
  const data = ctx.spy(releases.fetch.dataAtom)

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ChannelTabs />
        <Button
          background="default"
          className="h-8 gap-2 px-3 text-sm"
          onClick={() => releases.fetch(ctx)}
          disabled={status.isPending}
        >
          <Icon name="sprite:refresh" className={status.isPending ? "size-4 animate-spin" : "size-4"} />
          Обновить
        </Button>
      </div>

      {(status.isFirstPending || (!data && status.isPending)) && <ReleasesSkeleton />}

      {error && !status.isPending && (
        <div className="flex flex-col items-start gap-2">
          <ErrorBlock title={error.message} />
          <Button background="default" className="h-8 text-sm" onClick={() => releases.fetch(ctx)}>
            Повторить
          </Button>
        </div>
      )}

      {!status.isPending && !error && data && data.length === 0 && (
        <Noop title="Релизов в этом канале нет" />
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.map((release) => <ReleaseCard key={release.version} {...release} />)}
        </div>
      )}
    </div>
  )
}, "Releases")
