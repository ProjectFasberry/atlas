import { Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Typography } from "@/shared/ui/typography";
import { tv } from "tailwind-variants";
import { getLauncherDownloadUrl, getStaticObject } from "@/shared/lib/helpers";
import { env } from "@/shared/env";
import { translate } from "@/shared/locales/helpers";
import { reatomComponent } from "@/shared/lib/reatom";
import { useAtomAccessor } from "@/shared/lib/utils";
import { siteEdit } from "@/shared/models/site-edit.model";
import { asBlocks, asSectionsContent } from "@/shared/api/site";
import { EditableSections } from "@/shared/components/edit/editable-sections";
import { EditProvider } from "@/shared/components/edit/edit-provider";
import { EditToolbar } from "@/shared/components/edit/edit-toolbar";
import { EditEntry } from "@/shared/components/edit/edit-entry";
import { BlockControls, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block";
import type { Data } from "./+data";

const APP_URL = env.VITE_APP_URL
const WINDOWS_URL = getLauncherDownloadUrl("windows-x86_64")
const NumericItem = ({ index }: { index: number }) => {
  return (
    <div class="flex items-center justify-center aspect-square border-shark-800">
      <p class="text-white text-xl lg:text-2xl">
        {index}.
      </p>
    </div>
  )
}

const stepVariant = tv({
  base: `flex flex-col sm:flex-row items-center justify-between w-full gap-4 h-fit`
})

const stepContentVariant = tv({
  base: "flex flex-col gap-6 items-center h-full w-full sm:w-2/3"
})

const stepImageVariant = tv({
  base: `flex justify-center sm:justify-end items-center w-full sm:w-1/3`
})

export default reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()
  const editing = useAtomAccessor(siteEdit.active)

  siteEdit.setPublishedBlocks(ctx, asBlocks(pageData.content))

  const heroHidden = useBlockHidden("start-hero")


  return (
    <MainWrapperPage class={editing() ? "pb-24" : undefined}>
      <EditProvider
        page="start"
        locale={pageData.locale}
        canEdit={Boolean(pageData.canEdit)}
        canPublish={Boolean(pageData.canPublish)}
        build={(content) => ({
          kind: "sections",
          sections: asSectionsContent(content),
          blocks: asBlocks(content),
        })}
      />
      <Show when={!heroHidden()}>
      <div class="flex flex-col items-center w-full gap-12 h-full">
        <BlockTitle
          id="start-hero"
          fallback={translate["start.template.steps.title"]()}
          as="h1"
          class="text-white text-center text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl"
        />
        <BlockControls id="start-hero" />
        <div class="flex flex-col gap-16 w-full h-full">
          <div class={stepVariant()}>
            <div class={stepContentVariant()}>
              <div class="flex items-start gap-4 w-full">
                <NumericItem index={1} />
                <Typography color="white" class="text-md md:text-xl lg:text-2xl">
                  <a
                    href={`${APP_URL}/auth`}
                    class="text-green text-shadow-lg hover:underline-offset-8 hover:underline"
                  >
                    {translate["start.template.register"]()}
                  </a>&nbsp;{translate["start.template.register-project"]()}{" "}
                  {translate["start.template.register-after"]()}
                </Typography>
              </div>
            </div>
            <div class={stepImageVariant()}>
              <img
                src={getStaticObject("minecraft", "items/seeking_wolf.png")}
                draggable={false}
                width={128}
                height={128}
                alt="Register"
                loading="lazy"
              />
            </div>
          </div>
          <div class={stepVariant()}>
            <div class={stepContentVariant()}>
              <div class="flex items-start gap-4 w-full">
                <NumericItem index={2} />
                <div class="flex flex-col gap-4">
                  <Typography color="white" class="text-md md:text-xl lg:text-2xl">
                    {translate["start.template.steps.download"]()}
                  </Typography>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={WINDOWS_URL}
                      class="flex justify-center items-center button px-4 py-1"
                    >
                      <Typography class="text-nowrap">
                        {translate["start.template.steps.download-windows"]()}
                      </Typography>
                    </a>
                    <button
                      type="button"
                      disabled
                      title={translate["shared.soon"]()}
                      class="flex cursor-not-allowed items-center justify-center button px-4 py-1 opacity-70"
                    >
                      <Typography class="text-nowrap">
                        {translate["start.template.steps.download-macos"]()}
                        <span class="ml-2 border border-neutral-400/60 px-1 text-[10px] uppercase tracking-wide text-neutral-200">
                          {translate["shared.soon"]()}
                        </span>
                      </Typography>
                    </button>
                  </div>
                  <Typography color="gray" class="text-sm md:text-base">
                    {translate["start.template.steps.download-hint"]()}
                  </Typography>
                </div>
              </div>
            </div>
            <div class={stepImageVariant()}>
              <img
                src={getStaticObject("minecraft", "items/enderman_boosts.png")}
                draggable={false}
                width={128}
                height={128}
                alt="Cabinet"
                loading="lazy"
              />
            </div>
          </div>
          <div class={stepVariant()}>
            <div class="flex items-start gap-4 w-full sm:w-2/3">
              <NumericItem index={3} />
              <Typography color="white" class="text-md md:text-xl lg:text-2xl">
                {translate["start.template.steps.luckily-game"]()} <span class="text-red">❤</span>
              </Typography>
            </div>
            <div class={stepImageVariant()}>
              <img
                src={getStaticObject("minecraft", "items/adventure_icon.png")}
                draggable={false}
                width={128}
                height={128}
                alt="Done"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      </Show>
      <EditableSections
        sections={editing() && ctx.get(siteEdit.content)?.kind === "sections"
          ? ctx.get(siteEdit.content)!.sections
          : asSectionsContent(pageData.content)}
        editing={editing()}
      />
      <EditEntry active={editing()} canEdit={Boolean(pageData?.canEdit)} />
      <Show when={editing()}>
        <EditToolbar />
      </Show>
    </MainWrapperPage>
  )
}, "StartPage")
