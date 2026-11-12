import { reatomComponent } from "@reatom/npm-react";
import { type ReactNode } from "react";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Icon } from "@/shared/ui/icon";
import { Link } from "@/shared/components/config/link/link";
import { createLink } from "@/shared/components/config/link/link.model";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow
} from "@/shared/ui/table";
import { Typography } from "@/shared/ui/typography";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { rating, ratings, ratingsState, RatingsViewer } from "../models/ratings.model";
import { getRatingTypeLabel, getServerLabel, type RatingType } from "../labels";
import { formatDuration, formatNumber } from "../format";
import { translate } from "@/shared/locales/helpers";

const MEDAL_COLORS = ["text-yellow-400", "text-neutral-300", "text-amber-600"];

const RankCell = ({ idx }: { idx: number }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
    {idx < 3 && <Icon name="sprite:trophy" className={`size-4 ${MEDAL_COLORS[idx]}`} />}
    <span className={idx < 3 ? "text-neutral-200" : "text-neutral-400"}>{idx + 1}</span>
  </span>
);

const UserHead = reatomComponent<{ nickname?: string | null, avatar?: string }>(({ ctx, nickname, avatar }) => {
  const current = ctx.spy(currentUserState)?.nickname;
  const name = nickname || "—";
  const isSelf = !!nickname && current === nickname;

  const content = (
    <>
      <Avatar nickname={name} url={avatar ?? ""} className="w-7 h-7" />
      <span className="font-medium text-sm truncate">{name}</span>
      {isSelf && (
        <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-400">
          {translate["ratings.you"]()}
        </span>
      )}
    </>
  );

  if (!nickname) return <span className="flex items-center gap-2 min-w-0">{content}</span>;

  return (
    <Link href={createLink("player", nickname)} className="flex items-center gap-2 min-w-0">
      {content}
    </Link>
  );
}, "UserHead");

const NumberCell = ({ value }: { value: number | null | undefined }) => (
  <span className="tabular-nums whitespace-nowrap">{formatNumber(value)}</span>
);

const DurationCell = ({ value }: { value: number | null | undefined }) => (
  <span className="tabular-nums whitespace-nowrap text-neutral-300">{formatDuration(value)}</span>
);

const LandName = ({ name, ulid }: { name?: string | null, ulid?: string }) => {
  if (!ulid) return <span>{name || "—"}</span>;

  return <Link href={createLink("land", ulid)}>{name || "—"}</Link>;
};

type Column = {
  key: string,
  label: () => string,
  align?: "left" | "right",
  className?: string,
  render: (row: any, idx: number) => ReactNode
}

type TableConfig = {
  columns: Column[],
  rowKey: (row: any, idx: number) => string,
  nickname?: (row: any) => string | undefined
}

const rankColumn: Column = {
  key: "rank",
  label: () => translate["ratings.columns.rank"](),
  className: "w-14",
  render: (_, idx) => <RankCell idx={idx} />
}

const playerColumn: Column = {
  key: "player",
  label: () => translate["ratings.columns.player"](),
  render: (row) => <UserHead nickname={row.nickname} avatar={row.avatar} />
}

const RATING_TABLE: Record<RatingType, TableConfig> = {
  playtime: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "total",
        label: () => translate["ratings.columns.totalTime"](),
        align: "right",
        render: (row) => <DurationCell value={row.total} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  lands: {
    columns: [
      rankColumn,
      {
        key: "land",
        label: () => translate["ratings.columns.land"](),
        render: (row) => <LandName name={row.name} ulid={row.ulid} />
      },
      {
        key: "chunks",
        label: () => translate["ratings.columns.chunks"](),
        align: "right",
        render: (row) => <NumberCell value={row.chunks_amount} />
      },
      {
        key: "type",
        label: () => translate["ratings.columns.type"](),
        align: "right",
        render: (row) => <span className="text-neutral-300">{row.type || "—"}</span>
      }
    ],
    rowKey: (row, idx) => `${row.ulid ?? row.land ?? "land"}-${idx}`
  },
  reputation: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "reputation",
        label: () => translate["ratings.columns.reputation"](),
        align: "right",
        render: (row) => <NumberCell value={row.reputation} />
      }
    ],
    rowKey: (row, idx) => `${row.uuid ?? row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  charism: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "charism",
        label: () => translate["ratings.columns.charism"](),
        align: "right",
        render: (row) => <NumberCell value={row.balance} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  belkoin: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "belkoin",
        label: () => translate["ratings.columns.belkoin"](),
        align: "right",
        render: (row) => <NumberCell value={row.balance} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  parkour: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "map",
        label: () => translate["ratings.columns.map"](),
        render: (row) => <span className="text-neutral-300">{row.area || "—"}</span>
      },
      {
        key: "score",
        label: () => translate["ratings.columns.score"](),
        align: "right",
        render: (row) => <NumberCell value={row.score} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? row.player ?? "row"}-${row.area ?? "area"}-${idx}`,
    nickname: (row) => row.nickname
  }
}

const currentTable = (type: RatingType) => RATING_TABLE[type] ?? RATING_TABLE.playtime;

const RatingTableHeader = ({ config }: { config: TableConfig }) => (
  <TableRow>
    {config.columns.map((column) => (
      <TableHead
        key={column.key}
        className={`${column.align === "right" ? "text-right" : ""} ${column.className ?? ""}`}
      >
        {column.label()}
      </TableHead>
    ))}
  </TableRow>
)

const RatingTable = reatomComponent(({ ctx }) => {
  const type = ctx.spy(ratingsState.filters.by);
  const config = currentTable(type);
  const data = (ctx.spy(ratingsState.data) ?? []) as any[];
  const current = ctx.spy(currentUserState)?.nickname;

  return (
    <Table>
      <TableCaption>{translate["ratings.caption"]()}</TableCaption>
      <TableHeader>
        <RatingTableHeader config={config} />
      </TableHeader>
      <TableBody>
        {data.map((row, idx) => {
          const isSelf = !!current && config.nickname?.(row) === current;

          return (
            <TableRow
              key={config.rowKey(row, idx)}
              className={isSelf ? "bg-green-900/10 hover:bg-green-900/20" : undefined}
            >
              {config.columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={column.align === "right" ? "text-right" : ""}
                >
                  {column.render(row, idx)}
                </TableCell>
              ))}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}, "RatingTable")

const RatingTableSkeleton = reatomComponent(({ ctx }) => {
  const config = currentTable(ctx.spy(ratingsState.filters.by));

  return (
    <Table>
      <TableHeader>
        <RatingTableHeader config={config} />
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, idx) => (
          <TableRow key={idx}>
            {config.columns.map((column) => (
              <TableCell key={column.key}>
                <Skeleton className={`h-5 ${column.key === "rank" ? "w-8" : "w-full"}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}, "RatingTableSkeleton")

const pillClass = (active: boolean) => `shrink-0 rounded-xl px-3 py-2 text-sm font-semibold duration-150 ${
  active
    ? "bg-neutral-50 text-neutral-950"
    : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
}`

const RatingPills = reatomComponent(({ ctx }) => {
  const groups = ctx.spy(rating.fetch.dataAtom) ?? [];
  const currentServer = ctx.spy(ratingsState.filters.server);
  const currentType = ctx.spy(ratingsState.filters.by);

  if (!groups.length) return null;

  const group = groups.find((item) => item.key === currentServer);
  const typeFor = (item: (typeof groups)[number]): RatingType | undefined =>
    item.childs.some((child) => child.value === currentType)
      ? currentType
      : item.childs[0]?.value as RatingType | undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {groups.map((item) => {
          const nextType = typeFor(item);
          if (!nextType) return null;

          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={item.key === currentServer}
              onClick={() => ratings.applyFilters(ctx, { server: item.key, type: nextType })}
              className={pillClass(item.key === currentServer)}
            >
              {getServerLabel(item.key, item.title)}
            </button>
          )
        })}
      </div>
      {group && (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {group.childs.map((child) => (
            <button
              key={child.value}
              type="button"
              aria-pressed={child.value === currentType}
              onClick={() => ratings.applyFilters(ctx, { server: group.key, type: child.value as RatingType })}
              className={pillClass(child.value === currentType)}
            >
              {getRatingTypeLabel(child.value, child.title)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}, "RatingPills")

const SortControl = reatomComponent(({ ctx }) => {
  const asc = ctx.spy(ratingsState.filters.asc);

  const set = (value: boolean) => ratings.applyFilters(ctx, { asc: value });

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {translate["ratings.sort.label"]()}
      </span>
      <div className="flex rounded-xl bg-neutral-900 p-1">
        <button
          type="button"
          aria-pressed={!asc}
          onClick={() => set(false)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold duration-150 ${
            !asc ? "bg-neutral-50 text-neutral-950" : "text-neutral-400 hover:text-neutral-100"
          }`}
        >
          {translate["ratings.sort.best"]()}
        </button>
        <button
          type="button"
          aria-pressed={asc}
          onClick={() => set(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold duration-150 ${
            asc ? "bg-neutral-50 text-neutral-950" : "text-neutral-400 hover:text-neutral-100"
          }`}
        >
          {translate["ratings.sort.worst"]()}
        </button>
      </div>
    </div>
  )
}, "SortControl")

const RatingsToolbar = reatomComponent(({ ctx }) => (
  <div className="flex flex-col gap-3">
    <RatingPills />
    <div className="flex items-center justify-between gap-3">
      <SortControl />
    </div>
  </div>
), "RatingsToolbar")

const RatingsEmpty = () => (
  <div className="flex flex-col items-center gap-2 py-16 text-center">
    <Icon name="sprite:trophy" className="size-8 text-neutral-600" />
    <Typography className="text-lg font-semibold">
      {translate["ratings.empty.title"]()}
    </Typography>
    <Typography color="gray" className="text-sm">
      {translate["ratings.empty.description"]()}
    </Typography>
    <Link
      href="/"
      className="mt-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold duration-150 hover:bg-green-500"
    >
      {translate["ratings.empty.action"]()}
    </Link>
  </div>
)

const RatingsError = reatomComponent(({ ctx }) => {
  const isPending = ctx.spy(ratings.fetch.statusesAtom).isPending

  return (
    <div className="flex flex-col gap-3">
      <ErrorBlock title={ctx.spy(ratings.fetch.errorAtom)?.message || translate["ratings.error"]()} />
      <Button
        background="default"
        className="w-fit"
        disabled={isPending}
        withSpinner
        isLoading={isPending}
        onClick={() => ratings.fetch(ctx)}
      >
        {translate["ratings.retry"]()}
      </Button>
    </div>
  )
}, "RatingsError")

const LoadMore = reatomComponent(({ ctx }) => {
  const meta = ctx.spy(ratingsState.meta);
  const isPending = ctx.spy(ratings.update.statusesAtom).isPending;
  const error = ctx.spy(ratings.update.errorAtom);
  const hasMore = !!meta?.hasNextPage && !!meta.endCursor;

  if (!hasMore && !error) return null;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {error && <ErrorBlock title={error.message} />}
      <Button
        background="default"
        onClick={() => ratings.loadMore(ctx)}
        disabled={isPending}
        withSpinner
        isLoading={isPending}
      >
        {isPending
          ? translate["ratings.loadingMore"]()
          : hasMore
            ? translate["ratings.loadMore"]()
            : translate["ratings.retry"]()}
      </Button>
    </div>
  )
}, "LoadMore")

export const Ratings = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data);
  const error = ctx.spy(ratings.fetch.errorAtom);
  const isPending = ctx.spy(ratings.fetch.statusesAtom).isPending;
  const isLoaded = ctx.spy(ratingsState.loaded);

  return (
    <div className="flex flex-col gap-4 w-full">
      <RatingsToolbar />
      {!data && error
        ? <RatingsError />
        : !data && (!isLoaded || isPending)
          ? <RatingTableSkeleton />
          : !data
            ? <RatingsEmpty />
            : (
              <>
                <RatingTable />
                <RatingsViewer />
                <LoadMore />
              </>
            )}
    </div>
  )
}, "Ratings")
