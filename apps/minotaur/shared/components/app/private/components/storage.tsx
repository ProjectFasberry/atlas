import { reatomComponent } from "@reatom/npm-react";
import { createStorageView } from "@projectfasberry/storage/react";
import type { Ctx } from "@reatom/framework";
import { createStorageModel } from "../models/storage.model";
import { dayjs } from "@/shared/lib/dayjs";
import { Vaul, VaulContent, VaulHeader, VaulTrigger } from "@/shared/ui/vaul";
import { translate } from "@/shared/locales/helpers"

type StorageModel = {
  name: string,
  onSelectFile?: (ctx: Ctx, fileName: string) => void,
  /** Pick several files; the footer shows the count and confirms them together. */
  multiple?: boolean,
  maxSelected?: number,
  onSelectFiles?: (ctx: Ctx, fileNames: string[]) => void,
} & ({
  as: "drawer", Slot: React.ReactNode
} | {
  as: "headless", Slot?: never
})

const labels = {
  bucketsTitle: translate["panel.bucket-list"](),
  objectsTitle: (bucket: string, folder: string) =>
    `${translate["panel.objects-in-bucket"]({ bucket })}${folder ? `/${folder}` : ""}`,
  emptyBucket: translate["panel.the-bucket-is-empty"](),
  emptyFolder: translate["panel.the-folder-is-empty"](),
  noBuckets: translate["panel.no-buckets"](),
  unavailable: translate["panel.the-bucket-is-unavailable"](),
  back: translate["panel.back"](),
  close: translate["panel.close"](),
  search: translate["panel.search-2"](),
  clearSearch: translate["panel.clear"](),
  sort: translate["panel.sorting"](),
  sortName: translate["panel.name"](),
  sortSize: translate["panel.size"](),
  sortDate: translate["panel.date"](),
  sortAsc: translate["panel.ascending-2"](),
  sortDesc: translate["panel.descending-2"](),
  loadMore: translate["panel.show-more"](),
  retry: translate["panel.retry"](),
  select: translate["panel.select"](),
  cancel: translate["panel.cancel"](),
  preview: translate["panel.open-the-preview"](),
  closePreview: translate["panel.close"](),
  selectedCount: (count: number, max?: number) =>
    max
    ? translate["panel.selected-count"]({ count, max })
    : translate["panel.selected-count-simple"]({ count }),
  tree: translate["panel.folders"](),
  expand: translate["panel.expand"](),
  collapse: translate["panel.collapse"](),
  noResults: translate["panel.nothing-found"](),
  listView: translate["panel.list"](),
  gridView: translate["panel.grid"](),
};

const formatDate = (value: string, kind: "object" | "bucket") =>
  kind === "bucket"
    ? dayjs(value).format("DD MMM YYYY")
    : dayjs(value).format("DD.MM.YYYY HH:mm");

export const storageModel = ({
  name,
  as = "headless",
  Slot,
  onSelectFile,
  multiple = false,
  maxSelected,
  onSelectFiles,
}: StorageModel) => {
  const { storage, storageState } = createStorageModel(name);
  const { StorageContent } = createStorageView({
    name,
    storage,
    storageState,
    onSelectFile,
    onSelectFiles,
    multiple,
    maxSelected,
    labels,
    formatDate,
    previews: true,
    selectionMode: "confirm",
    defaultViewMode: "list",
    showTree: true,
  });

  const StorageWrapper = reatomComponent(({ ctx }) => {
    if (as === "drawer" && Slot) {
      return (
        <Vaul openAtom={storageState.isOpen}>
          <VaulTrigger asChild>{Slot}</VaulTrigger>
          <VaulContent side="right" className="w-full! max-w-4xl">
            <VaulHeader title={translate["panel.storage"]()} />
            <div className="flex min-h-0 flex-1 flex-col">
              <StorageContent />
            </div>
          </VaulContent>
        </Vaul>
      )
    }

    return <StorageContent />
  }, `${name}.StorageWrapper`)

  return {
    Storage: StorageWrapper,
    /** Lets a screen open the browser for its own field without a trigger. */
    storageState,
  }
}
