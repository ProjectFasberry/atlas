import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Avatar } from "@/shared/ui/avatar";
import { Link } from "@/shared/components/config/link/link";
import { Typography } from "@/shared/ui/typography";
import { createLink } from "@/shared/components/config/link/link.model";
import { actions } from "../models/actions.model";
import { deleteNews, newsList, type NewsSingle } from "../models/news.model";
import { DeleteButton, EditButton, LinkButton } from "./ui";

const UserBadge = ({ nickname, avatar }: { nickname: string; avatar: string }) => {
  return (
    <Link href={createLink("player", nickname)} className="flex items-center gap-1">
      <Avatar nickname={nickname} url={avatar} className="size-5" />
      <Typography className="text-xs text-neutral-400">{nickname}</Typography>
    </Link>
  );
};

const NewsListItem = reatomComponent<NewsSingle>(({ ctx, id, title, imageUrl, creator }) => {
  return (
    <div
      className="flex w-full items-center justify-between gap-2 overflow-hidden rounded-lg
        border border-neutral-800 p-2 transition-colors hover:border-neutral-700"
    >
      <div className="flex min-w-0 items-center gap-2">
        <img
          src={imageUrl}
          alt={title}
          className="h-16 w-24 shrink-0 select-none rounded-lg object-cover"
        />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <Typography className="truncate font-semibold">{title}</Typography>
          <UserBadge avatar={creator.avatar} nickname={creator.nickname} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <LinkButton link={createLink("news", id)} />
        <EditButton
          onClick={() => actions.open(ctx, { parent: "news", type: "edit", target: id })}
        />
        <DeleteButton
          onClick={() => deleteNews.deleteBefore(ctx, { id, title })}
          disabled={ctx.spy(deleteNews.submit.statusesAtom).isPending}
        />
      </div>
    </div>
  );
}, "NewsListItem");

export const NewsList = reatomComponent(({ ctx }) => {
  useUpdate(newsList.fetch, []);

  if (ctx.spy(newsList.fetch.statusesAtom).isFirstPending) {
    return (
      <div className="flex h-full w-full flex-col gap-2">
        {Array.from({ length: 6 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)}
      </div>
    );
  }

  const error = ctx.spy(newsList.fetch.errorAtom);
  if (error) return <span className="text-sm text-red">{error.message}</span>;

  const data = ctx.spy(newsList.fetch.dataAtom)?.data;
  if (!data) return null;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {data.map((news) => <NewsListItem key={news.id} {...news} />)}
    </div>
  );
}, "NewsList");
