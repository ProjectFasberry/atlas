import { Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { translate } from "@/shared/locales/helpers";
import type { Data } from "./+data";
import { siteEdit } from "@/shared/models/site-edit.model";
import { asBlocks, asSectionsContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import { EditToolbar } from "@/shared/components/edit/edit-toolbar";
import { EditEntry } from "@/shared/components/edit/edit-entry";
import { ModpackHero } from "./(components)/modpack-hero";
import { ModpackLauncher } from "./(components)/modpack-launcher";
import { ModpackManual } from "./(components)/modpack-manual";
import { ModpackFaq } from "./(components)/modpack-faq";
import { reatomComponent } from "@/shared/lib/reatom";

export default reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()
  const data = pageData?.data
  const failed = pageData?.failed
  const edit = pageData?.edit

  siteEdit.setPublishedBlocks(ctx, asBlocks(pageData.sections))

  if (edit?.active) {
    siteEdit.init(ctx, {
      page: "modpack",
      locale: edit.locale,
      version: edit.version,
      canPublish: edit.canPublish,
      content: {
        kind: "sections",
        sections: asSectionsContent(pageData.sections),
        blocks: asBlocks(pageData.sections),
      },
    })
  }

  return (
    <MainWrapperPage variant="with_section" class={edit?.active ? "pb-24" : undefined}>
      <ModpackHero />
      <div class="full-screen-section py-16 lg:py-24">
        <div class="responsive mx-auto flex flex-col gap-10 sm:gap-12">
          <ModpackLauncher />
          <ModpackManual data={data} failed={failed} />
          <ModpackFaq />
        </div>
      </div>
      <EditableSections
        sections={edit?.active && ctx.get(siteEdit.content)?.kind === "sections"
          ? ctx.get(siteEdit.content)!.sections
          : asSectionsContent(pageData.sections)}
        editing={Boolean(edit?.active)}
      />
      <EditEntry active={Boolean(edit?.active)} canEdit={Boolean(pageData?.canEdit)} />
      <Show when={edit?.active}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "ModpackPage")
