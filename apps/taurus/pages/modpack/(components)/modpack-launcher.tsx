import { For } from "solid-js"
import { Link } from "@/shared/components/link"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { getLauncherDownloadUrl } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"

const WINDOWS_URL = getLauncherDownloadUrl("windows-x86_64")

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

export const ModpackLauncher = () => (
  <section id="launcher" class="scroll-mt-24 transparent-achievement-panel flex flex-col gap-5 p-4 sm:p-6">
    <div class="flex max-w-3xl flex-col gap-2">
      <h2 class="text-xl sm:text-3xl">
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
      <Button
        disabled
        title={translate["shared.soon"]()}
        class="w-full sm:w-auto"
      >
        <Typography color="white" class="text-sm sm:text-base text-nowrap">
          {translate["join.action-macos"]()}
          <span class="ml-2 border border-neutral-400/60 px-1 text-[10px] uppercase tracking-wide text-neutral-200">
            {translate["shared.soon"]()}
          </span>
        </Typography>
      </Button>
      <Link
        href="/start"
        class="text-sm text-neutral-300 underline underline-offset-4 hover:text-white sm:whitespace-nowrap"
      >
        {translate["join.action-guide"]()}
      </Link>
    </div>
  </section>
)
