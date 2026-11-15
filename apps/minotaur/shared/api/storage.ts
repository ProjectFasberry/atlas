import type { StorageApi, StorageBucket, StorageObjectPage } from "@repo/storage"
import { client } from "@/shared/lib/client-wrapper"

/**
 * Minotaur adapter for the generic storage model: the API is the
 * `/privated/volume/*` contract, so another web app can implement the same
 * three calls against its own transport.
 */
export const minotaurStorageApi: StorageApi = {
	async listBuckets() {
		const data = await client.get("/privated/volume/buckets/list")

		return (data ?? []) as StorageBucket[]
	},
	async getBucket(bucket) {
		return client.get("/privated/volume/buckets/{bucket}/", {
			params: { path: { bucket } },
		})
	},
	async listObjects(bucket, options) {
		const data = await client.raw.get<StorageObjectPage>(
			"/privated/volume/buckets/{bucket}/list",
			{
				params: {
					path: { bucket },
					query: { folder: options?.folder, delimiter: options?.delimiter },
				},
			},
		)

		return data ?? { contents: [] }
	},
	async presign(bucket, key) {
		const data = await client.raw.get<{ url: string }>(
			"/privated/volume/buckets/{bucket}/presign",
			{ params: { path: { bucket }, query: { key } } },
		)

		return data.url
	},
}
