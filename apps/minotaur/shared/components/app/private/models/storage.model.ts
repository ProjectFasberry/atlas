import { createStorageModel as createBaseStorageModel } from "@projectfasberry/storage"
import { minotaurStorageApi } from "@/shared/api/storage"

export type { StorageSection } from "@projectfasberry/storage"

/** Minotaur binding of the generic model; other apps pass their own API. */
export const createStorageModel = (name: string) =>
	createBaseStorageModel({ name, api: minotaurStorageApi })
