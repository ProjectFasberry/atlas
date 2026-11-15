import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { createStorageModel } from "../models/storage.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { dayjs } from "@/shared/lib/dayjs";
import { Portal } from "@ark-ui/react/portal";
import { Menu } from "@ark-ui/react/menu";
import { menuVariant } from "@/shared/ui/menu";
import { Typography } from "@/shared/ui/typography";
import type { ReactNode } from "react";
import { atom, type Ctx, type CtxSpy } from "@reatom/framework";
import { BackButton } from "@/shared/ui/back-button";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Noop } from "@/shared/ui/noop";
import { Icon } from "@/shared/ui/icon";
import type { StorageObject } from "@repo/storage";

type StorageModel = {
  name: string,
  onSelectFile?: (ctx: Ctx, fileName: string) => void,
} & ({
  as: "menu", Slot: React.ReactNode
} | {
  as: "headless", Slot?: never
})

const formatBytes = (value?: number) => {
  if (value === undefined || value === null) return "—"

  const units = ["B", "KB", "MB", "GB", "TB"]
  let size = value
  let unit = 0

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }

  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

export const storageModel = ({
  name,
  as = "headless",
  Slot,
  onSelectFile
}: StorageModel) => {
  const { storage, storageState } = createStorageModel(name)

  storageState.isOpen.onChange((ctx, state) => {
    if (state) storage.load(ctx)
  })
  storageState.section.onChange((ctx) => storage.load(ctx))

  const TITLES = (ctx: CtxSpy) => {
    const folder = ctx.spy(storageState.folder)

    return {
      "buckets-list": "Список бакетов",
      "bucket-list": `Список объектов в ${ctx.spy(storageState.bucket)}${folder ? `/${folder}` : ""}`,
    }
  }

  const storageTitleAtom = atom((ctx) => TITLES(ctx)[ctx.spy(storageState.section)])

  const StorageListSkeleton = () => (
    <div className="flex flex-col gap-1 w-full">
      {Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-8 w-full" />)}
    </div>
  )

  const IMAGE_RE = /\.(png|jpe?g|webp|gif)$/i

  const StorageObjectRow = reatomComponent<{
    bucket: string,
    object: StorageObject,
    onSelect: () => void,
  }>(({ ctx, bucket, object, onSelect }) => {
    const key = `${bucket}/${object.key}`
    const preview = ctx.spy(storage.previews)[key]
    const isImage = IMAGE_RE.test(object.key)

    useUpdate((ctx) => {
      if (isImage && !preview) storage.loadPreview(ctx, { bucket, key: object.key })
    }, [preview, isImage])

    return (
      <div
        className="flex items-center gap-2 w-full px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg min-h-10"
        onClick={onSelect}
      >
        {isImage && preview ? (
          <img src={preview} alt="" className="size-8 shrink-0 rounded object-cover" />
        ) : (
          <div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-500">
            <Icon name="sprite:book" className="size-4" />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <Typography className="text-sm font-medium truncate">
            {object.key}
          </Typography>
          <span className="text-neutral-400 text-[10px]">
            {formatBytes(object.size)}
            {object.lastModified ? ` · ${dayjs(object.lastModified).format("DD.MM.YYYY HH:mm")}` : ""}
          </span>
        </div>
      </div>
    )
  }, `${name}.StorageObjectRow`)

  const StorageBucketList = reatomComponent(({ ctx }) => {
    if (ctx.spy(storage.listObjects.statusesAtom).isPending) return <StorageListSkeleton />

    const error = ctx.spy(storage.listObjects.errorAtom)
    if (error) return <ErrorBlock title={error.message} />

    const data = ctx.spy(storage.listObjects.dataAtom)
    const folders = data?.commonPrefixes ?? []
    const objects = data?.contents ?? []
    const bucket = ctx.get(storageState.bucket)
    const folder = ctx.spy(storageState.folder)

    if (!bucket) return null

    if (folders.length === 0 && objects.length === 0) {
      return <Noop title={folder ? "Папка пуста" : "Бакет пуст"} />
    }

    return (
      <div className="flex flex-col gap-1 w-full max-h-[40vh] overflow-y-auto">
        {folders.map(({ prefix }) => (
          <div
            key={prefix}
            className="flex items-center gap-2 w-full px-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg h-10 cursor-pointer"
            onClick={() => storage.openFolder(ctx, prefix)}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded bg-neutral-900 text-neutral-400">
              <Icon name="sprite:category" className="size-4" />
            </div>
            <Typography className="text-sm font-medium truncate">
              {prefix.slice(folder.length)}
            </Typography>
          </div>
        ))}
        {objects.map((object) => (
          <StorageObjectRow
            key={object.key}
            bucket={bucket}
            object={object}
            onSelect={() => {
              onSelectFile?.(ctx, `${bucket}/${object.key}`)
              storageState.isOpen(ctx, false)
            }}
          />
        ))}
      </div>
    )
  }, `${name}.StorageBucketList`)

  const StorageBucketsList = reatomComponent(({ ctx }) => {
    if (ctx.spy(storage.listBuckets.statusesAtom).isPending) return <StorageListSkeleton />

    const error = ctx.spy(storage.listBuckets.errorAtom)
    if (error) return <ErrorBlock title={error.message} />

    const data = ctx.spy(storage.listBuckets.dataAtom)
    if (!data || data.length === 0) return <Noop title="Бакетов нет" />

    return (
      <div className="flex flex-col gap-1 w-full">
        {data.map((bucket) => {
          const available = bucket.available !== false

          return (
            <div
              key={bucket.name}
              aria-disabled={!available}
              title={available ? undefined : "Бакет недоступен"}
              className={`
                flex bg-neutral-800 rounded-lg items-center px-2 h-8 justify-between w-full gap-2
                ${available ? "hover:bg-neutral-700 cursor-pointer" : "opacity-40 pointer-events-none"}
              `}
              onClick={() => available && storage.selectBucket(ctx, bucket.name)}
            >
              <Typography className="text-sm leading-5 truncate">
                {bucket.name}
              </Typography>
              <span className="text-[12px] leading-4">
                {dayjs(bucket.creationDate).format("DD MMM YYYY")}
              </span>
            </div>
          )
        })}
      </div>
    )
  }, `${name}.StorageBucketsList`)

  const STORAGE_SECTIONS: Record<string, ReactNode> = {
    "buckets-list": <StorageBucketsList />,
    "bucket-list": <StorageBucketList />,
  }

  const StorageContent = reatomComponent(({ ctx }) => {
    const section = ctx.spy(storageState.section)
    const folder = ctx.spy(storageState.folder)
    const inBucket = section === "bucket-list"

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between gap-1 w-full">
          <BackButton
            event="custom"
            onClick={() => storage.goBack(ctx)}
            icon={inBucket || folder ? "sprite:arrow-left" : "sprite:x"}
          />
          <span className="text-sm text-center leading-4">
            {ctx.spy(storageTitleAtom)}
          </span>
          <span />
        </div>
        {STORAGE_SECTIONS[section]}
      </div>
    )
  }, `${name}.StorageContent`)

  const StorageWrapper = reatomComponent(({ ctx }) => {
    if (as === "menu" && Slot) {
      return (
        <Menu.Root
          open={ctx.spy(storageState.isOpen)}
          onOpenChange={({ open }) => storageState.isOpen(ctx, open)}
        >
          <Menu.Trigger asChild>
            {Slot}
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className={menuVariant.content("min-w-[340px]")}>
                <StorageContent />
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )
    }

    return <StorageContent />
  }, `${name}.StorageWrapper`)

  return {
    Storage: StorageWrapper,
  }
}
