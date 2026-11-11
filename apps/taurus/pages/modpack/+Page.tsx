import { Accordion } from "@ark-ui/solid/accordion";
import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { For, Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { Link } from "@/shared/components/link";
import { Button } from "@/shared/ui/button";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Overlay } from "@/shared/ui/overlay";
import { Typography } from "@/shared/ui/typography";
import { WrapperTitle } from "@/shared/ui/wrapper-title";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { getLauncherDownloadUrl, getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import type { Data } from "./+data";
import { ModpackList } from "./(components)/modpack-list";
import { modpackFaqItems, modpackState, setModpackFaq } from "./(models)/modpack.model";

const bgImage = getStaticObject("arts", "bzzvanet-.jpg")
const WINDOWS_URL = getLauncherDownloadUrl("windows-x86_64")
const MACOS_URL = getLauncherDownloadUrl("darwin-aarch64")

const launcherPoints = () => [
  {
    title: translate["modpack.launcher.version"](),
    note: translate["modpack.launcher.version-note"]()
  },
  {
    title: translate["modpack.launcher.resourcepack"](),
    note: translate["modpack.launcher.resourcepack-note"]()
  },
  {
    title: translate["modpack.launcher.updates"](),
    note: translate["modpack.launcher.updates-note"]()
  }
]

export default function Page() {
  const ctx = useCtx()
  const [faqOpen] = useAtom(modpackState.faqOpen)
  const pageData = useData<Data>()
  const data = pageData?.data
  const failed = pageData?.failed

  return (
    <MainWrapperPage variant="with_section">
      <div
        class={sectionVariant({ className: "bg-bottom md:bg-center bg-cover" })}
        style={{ "background-image": `url(${bgImage})` }}
      >
        <Overlay variant="default" />
        <WrapperTitle>
          <div class="flex flex-col gap-6 w-full lg:max-w-3xl items-start justify-start">
            <div class="flex flex-col gap-2 lg:max-w-3xl">
              <h1 class={sectionVariantChild().title({ className: "text-gold" })}>
                {translate["modpack.title"]()}
              </h1>
              <Typography color="white" class={sectionVariantChild().subtitle()}>
                {translate["modpack.subtitle"]()}
              </Typography>
            </div>
            <Link href="#launcher" class={sectionVariantChild().action()}>
              <Button class="w-full px-6 py-0.5 gap-2">
                <Typography color="white" class="text-lg">
                  {translate["modpack.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </WrapperTitle>
      </div>

      <div class="full-screen-section py-16 lg:py-24">
        <div class="responsive mx-auto flex flex-col gap-10 sm:gap-12">
          <section id="launcher" class="scroll-mt-24 transparent-achievement-panel flex flex-col gap-5 p-4 sm:p-6">
            <div class="flex max-w-3xl flex-col gap-2">
              <h2 class="text-2xl sm:text-3xl">
                {translate["modpack.launcher.title"]()}
              </h2>
              <Typography color="gray" class="text-sm leading-6 sm:text-base">
                {translate["modpack.launcher.description"]()}
              </Typography>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <For each={launcherPoints()}>
                {(point, index) => (
                  <div class="flex items-start gap-3">
                    <span class="raised-slot flex h-8 w-8 shrink-0 items-center justify-center text-xs text-neutral-800">
                      {String(index() + 1).padStart(2, "0")}
                    </span>
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <Typography color="white" class="text-sm sm:text-base">
                        {point.title}
                      </Typography>
                      <Typography color="gray" class="text-xs leading-5">
                        {point.note}
                      </Typography>
                    </div>
                  </div>
                )}
              </For>
            </div>

            <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <a href={WINDOWS_URL} target="_blank" rel="noreferrer" class="w-full sm:w-auto">
                <Button class="w-full sm:w-auto">
                  <Typography color="white" class="text-sm sm:text-base text-nowrap">
                    {translate["join.action-windows"]()}
                  </Typography>
                </Button>
              </a>
              <a href={MACOS_URL} target="_blank" rel="noreferrer" class="w-full sm:w-auto">
                <Button class="w-full sm:w-auto">
                  <Typography color="white" class="text-sm sm:text-base text-nowrap">
                    {translate["join.action-macos"]()}
                  </Typography>
                </Button>
              </a>
              <Link
                href="/start"
                class="text-sm text-neutral-300 underline underline-offset-4 hover:text-white sm:whitespace-nowrap"
              >
                {translate["join.action-guide"]()}
              </Link>
            </div>
          </section>

          <section id="modpacks" class="flex scroll-mt-24 flex-col gap-3">
            <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
              <div class="flex flex-col gap-1">
                <h2 class="text-2xl sm:text-3xl">
                  {translate["modpack.manual.title"]()}
                </h2>
                <Typography color="gray" class="text-sm sm:text-base">
                  {translate["modpack.manual.description"]()}
                </Typography>
              </div>
              <Show when={(data?.length ?? 0) > 0}>
                <span class="text-xs text-neutral-500 sm:text-sm">
                  {translate["modpack.manual.count"]({ count: data?.length ?? 0 })}
                </span>
              </Show>
            </div>
            <ModpackList data={data} failed={failed} />
          </section>

          <section class="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-10">
            <div class="flex flex-col gap-1">
              <h2 class="text-2xl sm:text-3xl lg:text-4xl">
                {translate["modpack.faq.title"]()}
              </h2>
              <Typography color="gray" class="text-sm sm:text-base">
                {translate["modpack.faq.subtitle"]()}
              </Typography>
            </div>

            <Accordion.Root
              multiple
              collapsible
              value={faqOpen()}
              onValueChange={(details) => setModpackFaq(ctx, details.value)}
              class="flex w-full flex-col gap-2"
            >
              <For each={modpackFaqItems()}>
                {(item) => (
                  <Accordion.Item value={item.value} class="transparent-achievement-panel">
                    <Accordion.ItemTrigger class="flex w-full cursor-pointer items-center justify-between gap-4 p-3 text-left sm:p-4">
                      <Typography color="white" class="text-sm sm:text-base">
                        {item.question}
                      </Typography>
                      <Accordion.ItemIndicator class="shrink-0 text-lg text-green-400 transition-transform duration-200 data-[state=open]:rotate-45">
                        +
                      </Accordion.ItemIndicator>
                    </Accordion.ItemTrigger>
                    <Accordion.ItemContent class="px-3 pb-3 sm:px-4 sm:pb-4">
                      <Typography color="gray" class="text-xs leading-5 sm:text-sm sm:leading-6">
                        {item.answer}
                      </Typography>
                    </Accordion.ItemContent>
                  </Accordion.Item>
                )}
              </For>
            </Accordion.Root>
          </section>
        </div>
      </div>
    </MainWrapperPage>
  )
}
