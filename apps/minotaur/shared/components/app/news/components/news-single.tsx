import { Link } from "@/shared/components/config/link/link";
import { Typography } from "@/shared/ui/typography";
import { reatomComponent } from "@reatom/npm-react";
import { usePageContext } from "vike-react/usePageContext";
import { Avatar } from "@/shared/ui/avatar";
import { dayjs } from "@/shared/lib/dayjs";
import { Icon } from "@/shared/ui/icon";
import { Button } from "@/shared/ui/button";
import { renderTiptapContent } from "@/shared/lib/tiptap-content";
import { editorExtensions as extensions } from "@/shared/components/config/editor/editor.model";
import {
  defineNewsMeta, newsSingleState,
  type NewsSingle as NewsSingleType
} from "../models/news-single.model";
import { createLink } from "@/shared/components/config/link/link.model";
import { translate } from "@/shared/locales/helpers";
import { toast } from "sonner";

const WORDS_PER_MINUTE = 180

const getReadingMinutes = (html: string) => {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length

  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}

const NewsSingleBack = () => (
  <Link
    href="/news"
    className="flex w-fit items-center gap-1.5 text-sm font-semibold
      text-neutral-400 duration-150 hover:text-neutral-100"
  >
    <Icon name="sprite:arrow-left" className="size-4" />
    {translate["news.single.back"]()}
  </Link>
)

const NewsSingleEdit = reatomComponent(({ ctx }) => {
  const data = ctx.spy(newsSingleState.editParams)

  return (
    <Link
      href={data}
      aria-label={translate["panel.edit"]()}
      title={translate["panel.edit"]()}
      className="flex size-9 items-center justify-center rounded-lg bg-neutral-800
        text-neutral-400 duration-150 hover:bg-neutral-700 hover:text-neutral-100"
    >
      <Icon name="sprite:pencil" className="size-4" />
    </Link>
  )
}, "NewsSingleEdit")

const NewsSingleShare = ({ id }: { id: string | number }) => {
  const share = () => {
    const url = `${window.location.origin}${createLink("news", id)}`

    navigator.clipboard.writeText(url)
      .then(() => toast.success(translate["shared.copy.success"]()))
      .catch(() => toast.error(translate["settings.errors.title"]()))
  }

  return (
    <Button
      background="default"
      aria-label={translate["news.single.share"]()}
      title={translate["news.single.share"]()}
      className="size-9 p-0 text-neutral-400 hover:text-neutral-100"
      onClick={share}
    >
      <Icon name="sprite:link" className="size-4" />
    </Button>
  )
}

const NewsSingleMeta = reatomComponent<{
  data: NewsSingleType
  readingMinutes: number
}>(({ ctx, data, readingMinutes }) => {
  const pageCtx = usePageContext();
  const allowEdit = defineNewsMeta(ctx, pageCtx.snapshot)

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400">
      <Link
        href={createLink("player", data.creator.nickname)}
        className="flex items-center gap-2 duration-150 hover:text-neutral-100"
      >
        <Avatar
          url={data.creator.avatar}
          nickname={data.creator.nickname}
          className="size-6 shrink-0"
        />
        <span className="font-semibold text-neutral-100">{data.creator.nickname}</span>
      </Link>
      <span
        title={dayjs(data.created_at).format("DD.MM.YYYY HH:mm")}
        className="text-neutral-400"
      >
        {dayjs(data.created_at).fromNow()}
      </span>
      <span className="flex items-center gap-1.5" title={translate["news.single.views"]()}>
        <Icon name="sprite:eye" className="size-4" />
        {data.views}
        <span className="sr-only">{translate["news.single.views"]()}</span>
      </span>
      <span>{translate["news.single.reading-time"]({ count: readingMinutes })}</span>
      <div className="ml-auto flex items-center gap-2">
        <NewsSingleShare id={data.id} />
        {allowEdit && <NewsSingleEdit />}
      </div>
    </div>
  )
}, "NewsSingleMeta")

const NewsSingleContent = ({ html }: { html: string }) => (
  <div
    dangerouslySetInnerHTML={{ __html: html }}
    className="tiptap p-0! whitespace-pre-wrap"
  />
)

export const NewsSingle = reatomComponent(({ ctx }) => {
  const data = ctx.spy(newsSingleState.data)
  if (!data) return null;

  const html = renderTiptapContent(data.content, extensions)
  const readingMinutes = getReadingMinutes(html)

  return (
    <div className="flex flex-col gap-5 w-full h-full">
      <NewsSingleBack />
      <div className="relative flex min-h-48 w-full items-end overflow-hidden
        rounded-xl bg-neutral-900 sm:aspect-video sm:max-h-105">
        {data.imageUrl && (
          <img
            src={data.imageUrl}
            alt=""
            width={1280}
            height={720}
            loading="eager"
            className="absolute inset-0 size-full select-none object-cover
              object-center"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950
          via-neutral-950/50 to-neutral-950/10" />
        <Typography className="relative z-1 max-w-4xl p-4 text-2xl font-semibold
          leading-tight text-neutral-50 sm:p-6 sm:text-3xl">
          {data.title}
        </Typography>
      </div>
      <NewsSingleMeta data={data} readingMinutes={readingMinutes} />
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <NewsSingleContent html={html} />
      </article>
    </div>
  )
}, "NewsSingle")
