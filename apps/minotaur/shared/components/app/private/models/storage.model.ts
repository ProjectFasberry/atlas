import { client } from "@/shared/lib/client-wrapper"
import { invariant } from "@/shared/lib/utils"
import { logger } from "@/shared/lib/logger"
import { action, atom, reatomAsync, spawn, withAssign, withCache, withDataAtom, withErrorAtom, withReset, withStatusesAtom, type Ctx } from "@reatom/framework"
import { withUndo } from "@reatom/undo"

export type StorageSection = "buckets-list" | "bucket-list"

export const createStorageModel = (name: string) => {
  const storageLogger = logger.withTag(`${name}.storage`);

  const storageState = atom(null, `${name}.storageState`).pipe(
    withAssign((_, name) => ({
      isOpen: atom(false, `${name}.isOpen`),
      section: atom<StorageSection>("buckets-list", `${name}.section`).pipe(withReset(), withUndo({ length: 100 })),
      bucket: atom<string | null>(null, `${name}.bucket`).pipe(withReset())
    })),
  )
  const storage = atom(null, `${name}.storage`).pipe(
    withAssign((_, name) => ({
      getBucketsList: reatomAsync(async () => {
        return await client
          .get<ExtractApiData<"getPrivatedVolumeBucketsList">["data"]>("privated/volume/buckets/list")
          .exec()
      }, `${name}.getBucketsList`).pipe(
        withDataAtom(null),
        withCache({ swr: false }),
        withStatusesAtom(),
        withErrorAtom()
      ),
      getBucket: reatomAsync(async (_, bucketId: string) => {
        return await client
          .get<ExtractApiData<"getPrivatedVolumeBucketsByBucket">["data"]>(`privated/volume/bucket/${bucketId}`)
          .exec()
      }, `${name}.getBucket`).pipe(
        withDataAtom(null),
        withCache({ swr: false }),
        withStatusesAtom(),
        withErrorAtom()
      ),
      getListByBucket: reatomAsync(async (_, bucketId: string) => {
        return await client
          .get<ExtractApiData<"getPrivatedVolumeBucketsByBucketList">["data"]>(`privated/volume/buckets/${bucketId}/list`)
          .exec()
      }, `${name}.getListByBucket`).pipe(
        withDataAtom(null),
        withCache({ swr: false }),
        withStatusesAtom(),
        withErrorAtom()
      ),
      selectBucket: action((ctx, bucketName: string) => {
        spawn(ctx, (spawnCtx) => {
          storageState.bucket(spawnCtx, bucketName)
          storageState.section(spawnCtx, "bucket-list")
        })
      }, `${name}.selectBucket`),
      navigation: {
        goBack: action((ctx) => {
          const isUndo = ctx.get(storageState.section.isUndoAtom);

          if (isUndo) {
            storageState.section.undo(ctx)
          } else {
            storageState.isOpen(ctx, false)
          }
        })
      },
      getSelectedBucket: action((ctx) => {
        const bucket = ctx.get(storageState.bucket);
        invariant(bucket, "No bucket selected")
        return bucket;
      }),
      execEvent: action((ctx, section: StorageSection) => {
        const EVENTS: Record<typeof section, (ctx: Ctx) => void> = {
          "buckets-list": (ctx) => storage.getBucketsList(ctx),
          "bucket-list": (ctx) => storage.getListByBucket(ctx, storage.getSelectedBucket(ctx)),
        }

        const event = EVENTS[section];

        if (!event) {
          console.warn(`No event for section: ${section}`)
          return
        }

        event(ctx)
      }, `${name}.execEvent`)
    }))
  )

  if (import.meta.env.DEV) {
    storageState.isOpen.onChange((_, state) => state ? storageLogger.log("Open") : storageLogger.log("Close"));

    storageState.section.onChange((ctx, state) => {
      const history = ctx.get(storageState.section.historyAtom)
      const prev = history[history.length - 1]
      storageLogger.log(`Section change from ${prev} to ${state}`);
    })
  }

  return { storageState, storage }
}
