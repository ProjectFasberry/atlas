import type { StorageApi, StorageBucket, StorageObjectPage } from "@projectfasberry/storage"
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
		const data = await client.get("/privated/volume/buckets/{bucket}/list", {
			params: {
				path: { bucket },
				query: {
					// Elysia rejects empty strings for these optional query fields.
					folder: options?.folder || undefined,
					delimiter: options?.delimiter || undefined,
				},
			},
		})

		return (data ?? { contents: [] }) as StorageObjectPage
	},
	async presign(bucket, key) {
		const data = await client.get("/privated/volume/buckets/{bucket}/presign", {
			params: { path: { bucket }, query: { key } },
		})

		return data.url
	},
}
