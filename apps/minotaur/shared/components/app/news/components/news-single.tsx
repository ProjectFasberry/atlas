import { Link } from "@/shared/components/config/link/link";
import { Typography } from "@/shared/ui/typography";
import { reatomComponent } from "@reatom/npm-react";
import { usePageContext } from "vike-react/usePageContext";
import { Avatar } from "@/shared/ui/avatar";
import { dayjs } from "@/shared/lib/dayjs";
import { Icon } from "@/shared/ui/icon";
import { renderToHTMLString } from "@tiptap/static-renderer";
import type { JSONContent } from "@tiptap/react";
import { editorExtensions as extensions } from "@/shared/components/config/editor/editor.model";
import { defineNewsMeta, newsSingleState, type NewsSingle as NewsSingleType } from "../models/news-single.model";
import { createLink } from "@/shared/components/config/link/link.model";

const NewsSingleEdit = reatomComponent(({ ctx }) => {
  const data = ctx.spy(newsSingleState.editParams)

  return (
    <Link href={data} className="flex items-center aspect-square font-semibold gap-2 bg-neutral-800">
      <Icon name="sprite:pencil" className="size-5" />
    </Link>
  )
}, "NewsSingleEdit")

const NewsSingleHeader = reatomComponent<{ data: NewsSingleType }>(({ ctx, data }) => {
  const pageCtx = usePageContext();
  const allowEdit = defineNewsMeta(ctx, pageCtx.snapshot)

  return (
    <div className="flex items-center overflow-x-auto text-nowrap text-sm gap-2 w-full justify-start
      *:border *:border-neutral-800 *:rounded-xl *:px-3 *:h-9"
    >
      <div className="flex items-center gap-2 text-base font-semibold w-fit">
        <Typography color="gray">Автор</Typography>
        <Link href={createLink("player", data.creator.nickname)} className="flex items-center gap-1">
          <Avatar
            url={data.creator.avatar}
            nickname={data.creator.nickname}
            className="h-5 w-5"
          />
          <Typography>{data.creator.nickname}</Typography>
        </Link>
      </div>
      <div
        title={dayjs(data.created_at).format("DD.MM.YYYY")}
        className="flex items-center gap-2 text-base font-semibold"
      >
        <Typography color="gray">Создано</Typography>
        <Typography>{dayjs(data.created_at).format('D MMM YYYY')}</Typography>
      </div>
      <div className="flex items-center text-base font-semibold gap-2">
        <Icon name="sprite:eye" className="size-5 text-neutral-400" />
        <Typography>{data.views}</Typography>
      </div>
      {allowEdit && <NewsSingleEdit />}
    </div>
  )
}, "NewsHeader")

const NewsSingleContent = ({ content }: { content: JSONContent }) => {
  const html = renderToHTMLString({ extensions, content })

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="tiptap p-0! whitespace-pre-wrap"
    />
  )
}

export const NewsSingle = reatomComponent(({ ctx }) => {
  const data = ctx.spy(newsSingleState.data)
  if (!data) return null;

  return (
    <div className="flex flex-col gap-4 w-full h-full overflow-hidden">
      <div className="flex overflow-hidden rounded-xl">
        <img
          src={data.imageUrl}
          alt=""
          width={1280}
          height={720}
          className="object-center object-cover h-80 w-full"
        />
      </div>
      <Typography className="text-3xl font-semibold">
        {data.title}
      </Typography>
      <NewsSingleHeader data={data} />
      <NewsSingleContent content={data.content as JSONContent} />
    </div>
  )
}, "NewsSingle")
