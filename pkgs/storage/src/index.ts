import {
	action,
	atom,
	reatomAsync,
	withAssign,
	withCache,
	withDataAtom,
	withErrorAtom,
	withReset,
	withStatusesAtom,
} from "@reatom/framework"

/** Minimal shape of an S3-compatible bucket and object. */
export type StorageBucket = {
	name: string
	creationDate: string
}

export type StorageObject = {
	key: string
	size?: number
	lastModified?: string
	eTag?: string
}

export type StorageObjectPage = {
	contents?: StorageObject[]
	isTruncated?: boolean
	nextContinuationToken?: string
}

/**
 * The only thing an app has to provide: three calls that match the
 * `/privated/volume/*` API design. The model stays independent from any HTTP
 * client, so another web app can bind its own transport.
 */
export type StorageApi = {
	listBuckets(): Promise<StorageBucket[]>
	getBucket(bucket: string): Promise<unknown>
	listObjects(bucket: string, options?: { folder?: string }): Promise<StorageObjectPage>
}

export type StorageSection = "buckets-list" | "bucket-list"

export const createStorageModel = ({ name, api }: { name: string, api: StorageApi }) => {
	const storageState = atom(null, `${name}.storageState`).pipe(
		withAssign((_, name) => ({
			isOpen: atom(false, `${name}.isOpen`),
			section: atom<StorageSection>("buckets-list", `${name}.section`).pipe(withReset()),
			bucket: atom<string | null>(null, `${name}.bucket`).pipe(withReset()),
		})),
	)

	const storage = atom(null, `${name}.storage`).pipe(
		withAssign((_, name) => ({
			listBuckets: reatomAsync(async () => api.listBuckets(), `${name}.listBuckets`).pipe(
				withDataAtom(null),
				withCache({ swr: false }),
				withStatusesAtom(),
				withErrorAtom(),
			),
			getBucket: reatomAsync(async (_, bucket: string) => api.getBucket(bucket), `${name}.getBucket`).pipe(
				withDataAtom(null),
				withCache({ swr: false }),
				withStatusesAtom(),
				withErrorAtom(),
			),
			listObjects: reatomAsync(
				async (_, params: { bucket: string, folder?: string }) =>
					api.listObjects(params.bucket, { folder: params.folder }),
				`${name}.listObjects`,
			).pipe(
				withDataAtom(null),
				withCache({ swr: false }),
				withStatusesAtom(),
				withErrorAtom(),
			),
			selectBucket: action((ctx, bucket: string) => {
				storageState.bucket(ctx, bucket)
				storageState.section(ctx, "bucket-list")
			}, `${name}.selectBucket`),
			/** Back from the object list to the buckets, then close the panel. */
			goBack: action((ctx) => {
				if (ctx.get(storageState.section) === "bucket-list") {
					storageState.section(ctx, "buckets-list")
					return
				}

				storageState.isOpen(ctx, false)
			}, `${name}.goBack`),
			/** Loads the data for the current section; called on open and tab change. */
			load: action((ctx) => {
				if (ctx.get(storageState.section) === "buckets-list") {
					storage.listBuckets(ctx)
					return
				}

				const bucket = ctx.get(storageState.bucket)
				if (!bucket) return

				storage.listObjects(ctx, { bucket })
			}, `${name}.load`),
		})),
	)

	return { storageState, storage }
}
