import { ModpackList } from "@/pages/modpack/(components)/modpack-list";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { onMount } from "solid-js";
import { useData } from "vike-solid/useData";
import type { Data } from "./+data";
import { useCtx } from "@reatom/npm-solid-js";
import { modpacksState } from "./(models)/modpack.model";
import { translate } from "@/shared/locales/helpers";

export default function Page() {
  const ctx = useCtx();
  const data = useData<Data>()?.data

  onMount(() => {
    if (data) {
      modpacksState.list(ctx, data)
    }
  })

  return (
    <MainWrapperPage variant="with_section">
      <div class="min-h-[80vh] w-[90%] mx-auto py-36">
        <div class="flex flex-col justify-center items-center mb-6">
          <h1 class="text-xl sm:text-2xl md:text-4xl lg:text-5xl">
            {translate["modpack.title"]()}
          </h1>
        </div>
        <div class="flex items-center justify-center w-full">
          <ModpackList data={data} />
        </div>
      </div>
    </MainWrapperPage>
  );
}
