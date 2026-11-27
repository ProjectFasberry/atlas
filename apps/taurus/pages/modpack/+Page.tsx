import { useData } from "vike-solid/useData";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import type { Data } from "./+data";
import { siteEdit } from "@/shared/models/site-edit.model";
import { asBlocks, asSectionsContent } from "@/shared/api/site";
import { EditProvider } from "@/shared/components/edit/edit-provider";
import { PageEdit } from "@/shared/components/edit/page-edit";
import { ModpackHero } from "./(components)/modpack-hero";
import { ModpackLauncher } from "./(components)/modpack-launcher";
import { ModpackManual } from "./(components)/modpack-manual";
import { ModpackFaq } from "./(components)/modpack-faq";
import { useAtomAccessor } from "@/shared/lib/utils";

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
      <PageEdit page="modpack" kind="sections" content={pageData.sections} canEdit={pageData.canEdit} editing={editing} />
    </MainWrapperPage>
  )
}
