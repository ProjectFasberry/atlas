import { reatomComponent } from "@reatom/npm-react";
import { createStorageView } from "@projectfasberry/storage/react";
import type { Ctx } from "@reatom/framework";
import { createStorageModel } from "../models/storage.model";
import { dayjs } from "@/shared/lib/dayjs";
import { Vaul, VaulContent, VaulHeader, VaulTrigger } from "@/shared/ui/vaul";

type StorageModel = {
  name: string,
  onSelectFile?: (ctx: Ctx, fileName: string) => void,
} & ({
  as: "drawer", Slot: React.ReactNode
} | {
  as: "headless", Slot?: never
})

const labels = {
  bucketsTitle: "Список бакетов",
  objectsTitle: (bucket: string, folder: string) =>
    `Список объектов в ${bucket}${folder ? `/${folder}` : ""}`,
  emptyBucket: "Бакет пуст",
  emptyFolder: "Папка пуста",
  noBuckets: "Бакетов нет",
  unavailable: "Бакет недоступен",
  back: "Назад",
  close: "Закрыть",
};

const formatDate = (value: string, kind: "object" | "bucket") =>
  kind === "bucket"
    ? dayjs(value).format("DD MMM YYYY")
    : dayjs(value).format("DD.MM.YYYY HH:mm");

export const storageModel = ({
  name,
  as = "headless",
  Slot,
  onSelectFile
}: StorageModel) => {
  const { storage, storageState } = createStorageModel(name);
  const { StorageContent } = createStorageView({
    name,
    storage,
    storageState,
    onSelectFile,
    labels,
    formatDate,
  });

  const StorageWrapper = reatomComponent(({ ctx }) => {
    if (as === "drawer" && Slot) {
      return (
        <Vaul openAtom={storageState.isOpen}>
          <VaulTrigger asChild>{Slot}</VaulTrigger>
          <VaulContent side="right" className="w-full! max-w-md">
            <VaulHeader title="Хранилище" />
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
  }
}
