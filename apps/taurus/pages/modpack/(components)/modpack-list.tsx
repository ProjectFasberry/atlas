import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import { Link } from "@/shared/components/link";
import { For, Show } from "solid-js";
import { dayjs } from "@/shared/lib/create-dayjs";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { type Modpack, type Modpacks } from "../(models)/modpack.model";

const emptyIcon = getStaticObject("minecraft", "icons/chest_opened.webp")

const ModpackItem = (props: Modpack) => {
  return (
    <div class="transparent-achievement-panel flex h-full flex-col gap-3 p-4">
      <div class="flex items-start justify-between gap-3">
        <Typography class="text-lg text-green-500 sm:text-xl">
          {props.name}
        </Typography>
        <span class="shrink-0 border border-neutral-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
          {translate["modpack.manual.badge"]()}
        </span>
      </div>
      <Typography color="gray" class="text-xs sm:text-sm">
        {translate["modpack.manual.created"]({
          date: dayjs(props.created_at).format("DD.MM.YYYY")
        })}
      </Typography>
      <div class="mt-auto pt-1">
        <a
          href={props.downloadLink}
          target="_blank"
          rel="noreferrer"
          class="block w-full"
        >
          <Button class="w-full py-0.5">
            <Typography color="white" class="text-sm sm:text-base">
              {translate["modpack.download"]()}
            </Typography>
          </Button>
        </a>
      </div>
    </div>
  );
}

const ModpackError = () => (
  <div class="transparent-achievement-panel flex w-full flex-col items-center gap-2 p-6 text-center">
    <Typography class="text-2xl text-red-400">
      {translate["modpack.error"]()}
    </Typography>
    <span class="text-sm text-neutral-400">
      {translate["modpack.retry-later"]()}
    </span>
    <Link href="/modpack" class="mt-2 text-sm text-green-400 underline underline-offset-4">
      {translate["modpack.retry"]()}
    </Link>
  </div>
)

const ModpackListEmpty = () => (
  <div class="transparent-achievement-panel flex flex-col items-center gap-3 p-6 text-center">
    <img
      src={emptyIcon}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      draggable={false}
    />
    <Typography color="white" class="text-lg sm:text-xl">
      {translate["modpack.manual.empty.title"]()}
    </Typography>
    <Typography color="gray" class="max-w-md text-sm leading-5">
      {translate["modpack.manual.empty.description"]()}
    </Typography>
    <Link href="/discord" class="text-sm text-green-400 underline underline-offset-4">
      {translate["modpack.manual.empty.action"]()} →
    </Link>
  </div>
)

export const ModpackList = (props: { data?: Modpacks; failed?: boolean }) => {
  return (
    <Show when={!props.failed} fallback={<ModpackError />}>
      <Show
        when={(props.data?.length ?? 0) > 0}
        fallback={<ModpackListEmpty />}
      >
        <div class="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <For each={props.data}>
            {(modpack) => <ModpackItem {...modpack} />}
          </For>
        </div>
      </Show>
    </Show>
  );
}
