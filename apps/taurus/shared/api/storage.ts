import type { StorageApi, StorageBucket, StorageObjectPage } from "@projectfasberry/storage"
import { mainClient } from "./client"

/**
 * Taurus adapter for the storage model: the same `/privated/volume/*` contract
 * Minotaur uses, but unwrapped from its `client` helper.
 */
export const taurusStorageApi: StorageApi = {
  async listBuckets() {
    const { data } = await mainClient.GET("/privated/volume/buckets/list")

    return (data?.data ?? []) as StorageBucket[]
  },
  async getBucket(bucket) {
    const { data } = await mainClient.GET("/privated/volume/buckets/{bucket}/", {
      params: { path: { bucket } },
    })

    return data?.data
  },
  async listObjects(bucket, options) {
    const { data } = await mainClient.GET("/privated/volume/buckets/{bucket}/list", {
      params: {
        path: { bucket },
        query: {
          // Elysia rejects empty strings for these optional query fields.
          folder: options?.folder || undefined,
          delimiter: options?.delimiter || undefined,
          continuationToken: options?.continuationToken || undefined,
        },
      },
    })

    return (data?.data ?? { contents: [] }) as StorageObjectPage
  },
  async presign(bucket, key) {
    const { data } = await mainClient.GET("/privated/volume/buckets/{bucket}/presign", {
      params: { path: { bucket }, query: { key } },
    })

    return data?.data?.url ?? ""
  },
}
