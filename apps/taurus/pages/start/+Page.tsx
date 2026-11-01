import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Typography } from "@/shared/ui/typography";
import { tv } from "tailwind-variants";
import { getStaticObject } from "@/shared/lib/helpers";
import { env } from "@/shared/env";
import { onMount } from "solid-js";
import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { launcher, launcherArtifact } from "./(models)/launcher.model";
import { translate } from "@/shared/locales/helpers";

const APP_URL = env.VITE_APP_URL
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

export default function Page() {
  const ctx = useCtx();

  onMount(() => {
    launcher.fetch(ctx)
  })

  const [launcherData] = useAtom(launcher.fetch.dataAtom)
  const windowsUrl = () => launcherArtifact(launcherData(), "windows-x86_64")
  const macosUrl = () => launcherArtifact(launcherData(), "darwin-aarch64")

  return (
    <MainWrapperPage>
      <div class="flex flex-col items-center w-full gap-12 h-full">
        <h1 class="text-white text-center text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl">
          {translate["start.template.steps.title"]()}
        </h1>
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
                  </a>&nbsp;{translate["start.template.register-project"]()}
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
                      href={windowsUrl() ?? undefined}
                      aria-disabled={windowsUrl() ? undefined : "true"}
                      class="flex justify-center items-center button px-4 py-1"
                      classList={{ "opacity-60 pointer-events-none select-none": !windowsUrl() }}
                    >
                      <Typography class="text-nowrap">
                        {translate["start.template.steps.download-windows"]()}
                      </Typography>
                    </a>
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={macosUrl() ?? undefined}
                      aria-disabled={macosUrl() ? undefined : "true"}
                      class="flex justify-center items-center button px-4 py-1"
                      classList={{ "opacity-60 pointer-events-none select-none": !macosUrl() }}
                    >
                      <Typography class="text-nowrap">
                        {macosUrl()
                          ? translate["start.template.steps.download-macos"]()
                          : translate["start.template.steps.download-macos-soon"]()}
                      </Typography>
                    </a>
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
    </MainWrapperPage>
  )
}
