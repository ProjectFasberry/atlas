import { createStorageModel as createBaseStorageModel } from "@repo/storage"
import { minotaurStorageApi } from "@/shared/api/storage"

export type { StorageSection } from "@repo/storage"

/** Minotaur binding of the generic model; other apps pass their own API. */
export const createStorageModel = (name: string) =>
	createBaseStorageModel({ name, api: minotaurStorageApi })
