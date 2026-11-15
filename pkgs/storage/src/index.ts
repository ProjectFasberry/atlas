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
	/** False when the bucket exists in the list but cannot be opened. */
	available?: boolean
}

export type StorageObject = {
	key: string
	size?: number
	lastModified?: string
	eTag?: string
}

export type StorageObjectPage = {
	contents?: StorageObject[]
	/** Virtual folders returned by S3 when a delimiter is used. */
	commonPrefixes?: { prefix: string }[]
	isTruncated?: boolean
	nextContinuationToken?: string
}

/**
 * The only thing an app has to provide: a few calls that match the
 * `/privated/volume/*` API design. The model stays independent from any HTTP
 * client, so another web app can bind its own transport.
 */
export type StorageApi = {
	listBuckets(): Promise<StorageBucket[]>
	getBucket(bucket: string): Promise<unknown>
	listObjects(
		bucket: string,
		options?: { folder?: string, delimiter?: string },
	): Promise<StorageObjectPage>
	/** Short-lived URL for private buckets; public buckets can omit it. */
	presign?(bucket: string, key: string): Promise<string>
}

export type StorageSection = "buckets-list" | "bucket-list"

const previewKey = (bucket: string, key: string) => `${bucket}/${key}`

export const createStorageModel = ({ name, api }: { name: string, api: StorageApi }) => {
	const storageState = atom(null, `${name}.storageState`).pipe(
		withAssign((_, name) => ({
			isOpen: atom(false, `${name}.isOpen`),
			section: atom<StorageSection>("buckets-list", `${name}.section`).pipe(withReset()),
			bucket: atom<string | null>(null, `${name}.bucket`).pipe(withReset()),
			/** S3 prefix of the open folder; empty at the bucket root. */
			folder: atom("", `${name}.folder`).pipe(withReset()),
		})),
	)

	const previews = atom<Record<string, string>>({}, `${name}.previews`)

	const storage = atom(null, `${name}.storage`).pipe(
		withAssign((_, name) => ({
			listBuckets: reatomAsync(async () => api.listBuckets(), `${name}.listBuckets`).pipe(
				withDataAtom(null),
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
					api.listObjects(params.bucket, { folder: params.folder, delimiter: "/" }),
				`${name}.listObjects`,
			).pipe(
				withDataAtom(null),
				withStatusesAtom(),
				withErrorAtom(),
			),
			previews,
			loadPreview: reatomAsync(async (_, params: { bucket: string, key: string }) => {
				if (!api.presign) return null

				return {
					key: previewKey(params.bucket, params.key),
					url: await api.presign(params.bucket, params.key),
				}
			}, {
				name: `${name}.loadPreview`,
				onFulfill: (ctx, result) => {
					if (!result) return
					previews(ctx, (state) => ({ ...state, [result.key]: result.url }))
				},
			}).pipe(
				withStatusesAtom(),
			),
			selectBucket: action((ctx, bucket: string) => {
				storageState.bucket(ctx, bucket)
				storageState.folder(ctx, "")
				storageState.section(ctx, "bucket-list")
			}, `${name}.selectBucket`),
			openFolder: action((ctx, prefix: string) => {
				storageState.folder(ctx, prefix)
				storage.load(ctx)
			}, `${name}.openFolder`),
			/** Folder up, then buckets, then close the panel. */
			goBack: action((ctx) => {
				const folder = ctx.get(storageState.folder)

				if (folder) {
					const parent = folder.replace(/\/$/, "").split("/").slice(0, -1).join("/")
					storageState.folder(ctx, parent ? `${parent}/` : "")
					storage.load(ctx)
					return
				}

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

				storage.listObjects(ctx, { bucket, folder: ctx.get(storageState.folder) })
			}, `${name}.load`),
		})),
	)

	return { storageState, storage }
}
