# @repo/storage

Headless Reatom model for an S3-compatible storage browser. The model does not
know about HTTP or UI: an app binds a small adapter, so the same state machine
can power the minotaur panel or any other web app.

## API contract

```ts
type StorageApi = {
  listBuckets(): Promise<StorageBucket[]>
  getBucket(bucket: string): Promise<unknown>
  listObjects(bucket: string, options?: { folder?: string, delimiter?: string }): Promise<StorageObjectPage>
  presign?(bucket: string, key: string): Promise<string>
}
```

`listObjects` is expected to follow the S3 list shape: `contents` for files,
`commonPrefixes` for virtual folders and `nextContinuationToken` for pagination.
`presign` is only needed for private buckets; public buckets can omit it.

## Usage

```ts
const { storageState, storage } = createStorageModel({ name: "media", api })
```

The model exposes:

- `storageState`: `isOpen`, `section` (`buckets-list` | `bucket-list`), `bucket`, `folder`;
- `storage.listBuckets`, `storage.listObjects`, `storage.getBucket`;
- `storage.selectBucket`, `storage.openFolder`, `storage.goBack`, `storage.load`;
- `storage.previews` and `storage.loadPreview` for presigned image URLs.

The view stays in the app: `apps/minotaur/.../components/storage.tsx` is the
reference implementation (folders, image previews, disabled unavailable
buckets).
