import { reatomComponent } from "@reatom/npm-react";
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

  const TITLES = (ctx: CtxSpy) => ({
    "buckets-list": "Список бакетов",
    "bucket-list": `Список объектов в ${ctx.spy(storageState.bucket)}`,
  })

  const storageTitleAtom = atom((ctx) => TITLES(ctx)[ctx.spy(storageState.section)])

  const StorageListSkeleton = () => (
    <div className="flex flex-col gap-1 w-full">
      {Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-8 w-full" />)}
    </div>
  )

  const StorageBucketList = reatomComponent(({ ctx }) => {
    if (ctx.spy(storage.listObjects.statusesAtom).isPending) return <StorageListSkeleton />

    const error = ctx.spy(storage.listObjects.errorAtom)
    if (error) return <ErrorBlock title={error.message} />

    const data = ctx.spy(storage.listObjects.dataAtom);
    const objects = data?.contents ?? []

    if (objects.length === 0) return <Noop title="Бакет пуст" />

    return (
      <div className="flex flex-col gap-1 w-full max-h-[40vh] overflow-y-auto">
        {objects.map((object, idx) => (
          <div
            key={`${object.key}-${idx}`}
            className="flex flex-col gap-1 w-full px-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg h-10"
            onClick={() => {
              const bucket = ctx.get(storageState.bucket)
              if (bucket) onSelectFile?.(ctx, `${bucket}/${object.key}`)
              storageState.isOpen(ctx, false)
            }}
          >
            <Typography className="text-sm font-medium">
              {object.key}
            </Typography>
            <span className="text-neutral-400 text-[10px]">
              {formatBytes(object.size)}
            </span>
          </div>
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
        {data.map((bucket) => (
          <div
            key={bucket.name}
            className="
              flex bg-neutral-800 hover:bg-neutral-700
              cursor-pointer rounded-lg items-center px-2 h-8 justify-between w-full gap-2
            "
            onClick={() => storage.selectBucket(ctx, bucket.name)}
          >
            <Typography className="text-sm leading-5 truncate">
              {bucket.name}
            </Typography>
            <span className="text-[12px] leading-4">
              {dayjs(bucket.creationDate).format("DD MMM YYYY")}
            </span>
          </div>
        ))}
      </div>
    )
  }, `${name}.StorageBucketsList`)

  const STORAGE_SECTIONS: Record<string, ReactNode> = {
    "buckets-list": <StorageBucketsList />,
    "bucket-list": <StorageBucketList />,
  }

  const StorageContent = reatomComponent(({ ctx }) => {
    const section = ctx.spy(storageState.section)
    const inBucket = section === "bucket-list"

    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between gap-1 w-full">
          <BackButton
            event="custom"
            onClick={() => storage.goBack(ctx)}
            icon={inBucket ? "sprite:arrow-left" : "sprite:x"}
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
