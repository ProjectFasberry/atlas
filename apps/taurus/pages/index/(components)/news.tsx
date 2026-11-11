import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { For, onCleanup, onMount, Show } from "solid-js";
import { env } from "@/shared/env";
import { translate } from "@/shared/locales/helpers";
import { appState } from "@/shared/models/app.model";
import { Link } from "@/shared/components/link";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { newsList, type NewsItem } from "../(models)/news.model";

const APP_URL = env.VITE_APP_URL

const formatDate = (value: string, locale: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date)
}

const NewsCard = (props: { item: NewsItem }) => {
  const [locale] = useAtom(appState.locale)

  return (
    <Link
      href={`${APP_URL}/news/${props.item.id}`}
      target="_blank"
      rel="noreferrer"
      class="group flex flex-col overflow-hidden transparent-achievement-panel duration-300 hover:-translate-y-1 hover:brightness-110"
    >
      <div class="relative aspect-video w-full overflow-hidden bg-neutral-900">
        <Show when={props.item.imageUrl}>
          {(src) => (
            <img
              src={src()}
              alt=""
              loading="lazy"
              width={640}
              height={360}
              class="h-full w-full object-cover brightness-75 duration-500 group-hover:scale-[1.03] group-hover:brightness-100"
            />
          )}
        </Show>
      </div>
      <div class="flex flex-1 flex-col gap-2 p-4">
        <time class="text-xs text-neutral-400" dateTime={props.item.created_at}>
          {formatDate(props.item.created_at, locale())}
        </time>
        <Typography color="white" class="line-clamp-2 text-lg leading-6">
          {props.item.title}
        </Typography>
        <Show when={props.item.description}>
          <Typography color="gray" class="line-clamp-3 text-sm leading-5">
            {props.item.description}
          </Typography>
        </Show>
        <span class="mt-auto pt-2 text-sm text-green-400 underline-offset-4 group-hover:underline">
          {translate["news.read"]()}
        </span>
      </div>
    </Link>
  )
}

const NewsSkeleton = () => (
  <div class="flex flex-col gap-2 transparent-achievement-panel p-2">
    <Skeleton class="aspect-video w-full" />
    <Skeleton class="mt-2 h-3 w-1/3" />
    <Skeleton class="h-5 w-full" />
    <Skeleton class="h-5 w-2/3" />
  </div>
)

export const NewsSection = () => {
  const ctx = useCtx();

  const [items] = useAtom(newsList.dataAtom)
  const [statuses] = useAtom(newsList.statusesAtom)
  const [error] = useAtom(newsList.errorAtom)

  onMount(() => {
    if (!statuses().isPending) newsList(ctx)
  })

  onCleanup(() => {
    newsList.abort(ctx)
  })

  const isLoading = () => statuses().isPending || !statuses().isEverPending
  const isEmpty = () => !isLoading() && !error() && items().length === 0

  return (
    <div id="news" class="section-edge relative flex w-full flex-col items-center py-16 sm:py-20 lg:py-28">
      <div class="responsive z-1 flex flex-col gap-6 sm:gap-8">
        <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div class="flex flex-col gap-1">
            <Typography color="white" class="text-2xl sm:text-3xl lg:text-4xl">
              {translate["news.title"]()}
            </Typography>
            <Typography color="gray" class="text-sm sm:text-base">
              {translate["news.subtitle"]()}
            </Typography>
          </div>
          <Link
            href={`${APP_URL}/news`}
            target="_blank"
            rel="noreferrer"
            class="w-fit text-sm text-green-400 underline underline-offset-4 hover:text-green-300"
          >
            {translate["news.action"]()}
          </Link>
        </div>

        <Show
          when={!isLoading()}
          fallback={
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <NewsSkeleton />
              <NewsSkeleton />
              <NewsSkeleton />
            </div>
          }
        >
          <Show
            when={!error()}
            fallback={
              <div class="flex flex-col items-center gap-3 transparent-achievement-panel p-6 text-center">
                <Typography color="gray" class="text-sm sm:text-base">
                  {translate["news.error"]()}
                </Typography>
                <Button onClick={() => newsList(ctx)} class="px-6">
                  <Typography color="white" class="text-sm">
                    {translate["news.retry"]()}
                  </Typography>
                </Button>
              </div>
            }
          >
            <Show
              when={!isEmpty()}
              fallback={
                <div class="transparent-achievement-panel p-6 text-center">
                  <Typography color="gray" class="text-sm sm:text-base">
                    {translate["news.empty"]()}
                  </Typography>
                </div>
              }
            >
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <For each={items()}>
                  {(item) => <NewsCard item={item} />}
                </For>
              </div>
            </Show>
          </Show>
        </Show>
      </div>
    </div>
  )
}
