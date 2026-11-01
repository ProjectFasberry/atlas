import { Typography } from '@/shared/ui/typography';
import { Button } from '@/shared/ui/button';
import { ErrorBoundary, For, Show } from 'solid-js';
import { type Modpack, type Modpacks } from '../(models)/modpack.model';
import { translate } from '@/shared/locales/helpers';

const ModpackItem = (props: Modpack) => {
  return (
    <div class="flex flex-col transparent-achievement-panel gap-4 justify-between h-full p-4 relative">
      <div class="flex flex-col gap-2 justify-between grow">
        <Typography class="text-lg lg:text-xl sm:text-2xl text-green-500">
          {props.name}
        </Typography>
        <div class="flex items-center justify-center w-full gap-1">
          <a
            href={props.downloadLink}
            target="_blank"
            rel="noreferrer"
            class='w-full md:w-1/2'
          >
            <Button class="py-0.5 text-sm sm:text-base w-full">
              {translate["modpack.download"]()}
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

const ModpackError = () => (
  <div class="flex flex-col gap-2 w-full items-center justify-cenetr">
    <Typography class="text-red text-2xl">
      {translate["modpack.error"]()}
    </Typography>
    <span class="truncate text-sm text-neutral-400">
      {translate["modpack.retry-later"]()}
    </span>
  </div>
)

const ModpackListEmpty = () => (
  <Typography class="text-neutral-400 text-2xl">
    {translate["modpack.empty"]()}
  </Typography>
)

export const ModpackList = (props: { data?: Modpacks }) => {
  return (
    <ErrorBoundary fallback={<ModpackError />}>
      <Show when={props.data} fallback={<ModpackListEmpty />}>
        {(data) => (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full xl:grid-cols-4 gap-4 grid-rows-2">
            <For each={data()}>
              {(modpack) => <ModpackItem {...modpack} />}
            </For>
          </div>
        )}
      </Show>
    </ErrorBoundary>
  );
}
