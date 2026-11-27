import { Show, type Accessor } from "solid-js";
import { useData } from "vike-solid/useData";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { translate } from "@/shared/locales/helpers";
import type { Data } from "./+data";
import { siteEdit } from "@/shared/models/site-edit.model";
import { asBlocks, asSectionsContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import { EditProvider } from "@/shared/components/edit/edit-provider";
import { EditToolbar } from "@/shared/components/edit/edit-toolbar";
import { EditEntry } from "@/shared/components/edit/edit-entry";
import { ModpackHero } from "./(components)/modpack-hero";
import { ModpackLauncher } from "./(components)/modpack-launcher";
import { ModpackManual } from "./(components)/modpack-manual";
import { ModpackFaq } from "./(components)/modpack-faq";
import { reatomComponent } from "@/shared/lib/reatom";
import { useAtomAccessor } from "@/shared/lib/utils";

const Edit = reatomComponent<{ pageData: Data, editing: Accessor<boolean> }>(({ ctx, ...props }) => {
  const content = useAtomAccessor(siteEdit.content)

  siteEdit.setPublishedBlocks(ctx, asBlocks(props.pageData.sections))

  return (
    <>
      <EditableSections
        sections={props.editing() && content()?.kind === "sections"
          ? content()!.sections
          : asSectionsContent(props.pageData.sections)}
        editing={props.editing()}
      />
      <EditEntry canEdit={Boolean(props.pageData?.canEdit)} />
      <Show when={props.editing()}>
        <EditToolbar />
      </Show>
    </>
  )
})

export default function Page() {
  const pageData = useData<Data>()
  const data = pageData?.data
  const failed = pageData?.failed
  const editing = useAtomAccessor(siteEdit.active)

  return (
    <MainWrapperPage variant="with_section" class={editing() ? "pb-24" : undefined}>
      <EditProvider
        page="modpack"
        locale={pageData.locale}
        canEdit={Boolean(pageData.canEdit)}
        canPublish={Boolean(pageData.canPublish)}
        build={(content) => ({
          kind: "sections",
          sections: asSectionsContent(content),
          blocks: asBlocks(content),
        })}
      />
      <ModpackHero />
      <div class="full-screen-section py-16 lg:py-24">
        <div class="responsive mx-auto flex flex-col gap-10 sm:gap-12">
          <ModpackLauncher />
          <ModpackManual data={data} failed={failed} />
          <ModpackFaq />
        </div>
      </div>
      <Edit pageData={pageData} editing={editing} />
    </MainWrapperPage>
  )
}
