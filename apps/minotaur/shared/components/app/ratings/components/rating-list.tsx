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
import {
  Toolbar, ToolbarActions, ToolbarGroup, ToolbarIconButton, ToolbarSelect
} from "@/shared/ui/toolbar";

const MEDAL_COLORS = ["text-yellow-400", "text-neutral-300", "text-amber-600"];

const RankCell = ({ idx }: { idx: number }) => (
  <span className="inline-flex items-center gap-1.5 font-semibold
    tabular-nums">
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
        <span className="rounded bg-green-500/15 px-1.5 py-0.5 text-[10px]
          font-semibold uppercase text-green-400">
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
  },
  votes: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "votes",
        label: () => translate["ratings.columns.votes"](),
        align: "right",
        render: (row) => <NumberCell value={row.votes} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  wiki: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "revisions",
        label: () => translate["ratings.columns.revisions"](),
        align: "right",
        render: (row) => <NumberCell value={row.revisions} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  referrals: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "referrals",
        label: () => translate["ratings.columns.referrals"](),
        align: "right",
        render: (row) => <NumberCell value={row.referrals} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  purchases: {
    columns: [
      rankColumn,
      playerColumn,
      {
        key: "purchases",
        label: () => translate["ratings.columns.purchases"](),
        align: "right",
        render: (row) => <NumberCell value={row.purchases} />
      }
    ],
    rowKey: (row, idx) => `${row.nickname ?? "row"}-${idx}`,
    nickname: (row) => row.nickname
  },
  "lands-members": {
    columns: [
      rankColumn,
      {
        key: "land",
        label: () => translate["ratings.columns.land"](),
        render: (row) => <LandName name={row.name} ulid={row.ulid} />
      },
      {
        key: "members",
        label: () => translate["ratings.columns.members"](),
        align: "right",
        render: (row) => <NumberCell value={row.members_count} />
      }
    ],
    rowKey: (row, idx) => `${row.ulid ?? "land"}-${idx}`
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
                  className={`py-3.5 ${column.align === "right" ? "text-right" : ""}`}
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
              <TableCell key={column.key} className="py-3.5">
                <Skeleton className={`h-5 ${column.key === "rank" ? "w-8" : "w-full"}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}, "RatingTableSkeleton")

const RatingsToolbarSkeleton = () => (
  <Toolbar>
    <ToolbarGroup>
      <Skeleton className="h-9 w-36 rounded-xl" />
      <Skeleton className="h-9 w-36 rounded-xl" />
    </ToolbarGroup>
    <ToolbarActions>
      <Skeleton className="h-9 w-9 rounded-xl" />
      <Skeleton className="h-9 w-28 rounded-xl" />
    </ToolbarActions>
  </Toolbar>
)

const sortItems = [
  { label: translate["ratings.sort.best"](), value: "best" },
  { label: translate["ratings.sort.worst"](), value: "worst" }
];

const RatingsToolbar = reatomComponent(({ ctx }) => {
  const groups = ctx.spy(rating.fetch.dataAtom) ?? [];
  const currentServer = ctx.spy(ratingsState.filters.server);
  const currentType = ctx.spy(ratingsState.filters.by);
  const asc = ctx.spy(ratingsState.filters.asc);

  if (!groups.length) return null;

  const group = groups.find((item) => item.key === currentServer) ?? groups[0];
  const activeType = group?.childs.some((child) => child.value === currentType)
    ? currentType
    : group?.childs[0]?.value as RatingType | undefined;

  const serverItems = groups.map((item) => ({
    label: getServerLabel(item.key, item.title),
    value: item.key
  }));
  const typeItems = (group?.childs ?? []).map((child) => ({
    label: getRatingTypeLabel(child.value, child.title),
    value: child.value
  }));

  const pickServer = (key: string) => {
    const next = groups.find((item) => item.key === key);
    if (!next) return;

    const nextType = next.childs.some((child) => child.value === currentType)
      ? currentType
      : next.childs[0]?.value as RatingType | undefined;
    if (!nextType) return;

    ratings.applyFilters(ctx, { server: next.key, type: nextType });
  };

  return (
    <Toolbar>
      <ToolbarGroup>
        <ToolbarSelect
          label={translate["ratings.filters.server"]()}
          items={serverItems}
          value={group?.key ? [group.key] : []}
          onValueChange={pickServer}
        />
        <ToolbarSelect
          label={translate["ratings.filters.type"]()}
          items={typeItems}
          value={activeType ? [activeType] : []}
          onValueChange={(value) => {
            if (!group) return;
            ratings.applyFilters(ctx, { server: group.key, type: value as RatingType });
          }}
        />
      </ToolbarGroup>
      <ToolbarActions>
        <ToolbarIconButton
          aria-label={asc ? translate["ratings.sort.best"]() : translate["ratings.sort.worst"]()}
          title={translate["ratings.sort.label"]()}
          onClick={() => ratings.applyFilters(ctx, { asc: !asc })}
        >
          <Icon name={asc ? "sprite:arrow-down" : "sprite:arrow-up"} className="size-4" />
        </ToolbarIconButton>

        <ToolbarSelect
          label={translate["ratings.sort.label"]()}
          items={sortItems}
          value={[asc ? "worst" : "best"]}
          onValueChange={(value) => ratings.applyFilters(ctx, { asc: value === "worst" })}
          className="flex-1 sm:flex-none"
        />
      </ToolbarActions>
    </Toolbar>
  )
}, "RatingsToolbar")

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
      className="mt-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold
        duration-150 hover:bg-green-500"
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
  const isPending = ctx.spy(ratings.fetch.statusesAtom).isPending;
  const error = ctx.spy(ratings.fetch.errorAtom);
  const hasMore = !!meta?.hasNextPage && !!meta.endCursor;

  if (!hasMore && !error) return null;

  const label = () => {
    if (isPending) return translate["ratings.loadingMore"]()
    if (hasMore) return translate["ratings.loadMore"]()
    return translate["ratings.retry"]()
  }

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {error && <ErrorBlock title={error.message} />}
      <Button
        background="default"
        onClick={() => ratings.fetch(ctx)}
        disabled={isPending}
        withSpinner
        isLoading={isPending}
      >
        {label()}
      </Button>
    </div>
  )
}, "LoadMore")

type RatingsBodyProps = {
  hasData: boolean
  hasError: boolean
  isPending: boolean
  isLoaded: boolean
}

const RatingsBody = ({ hasData, hasError, isPending, isLoaded }: RatingsBodyProps) => {
  if (hasError && !hasData) return <RatingsError />
  if (!hasData && (!isLoaded || isPending)) return <RatingTableSkeleton />
  if (!hasData) return <RatingsEmpty />

  return (
    <>
      <RatingTable />
      <RatingsViewer />
      <LoadMore />
    </>
  )
}

export const Ratings = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data);
  const error = ctx.spy(ratings.fetch.errorAtom);
  const isPending = ctx.spy(ratings.fetch.statusesAtom).isPending;
  const isLoaded = ctx.spy(ratingsState.loaded);

  return (
    <div className="flex flex-col gap-4 w-full">
      <RatingsToolbar />
      <RatingsBody
        hasData={!!data}
        hasError={!!error}
        isPending={isPending}
        isLoaded={isLoaded}
      />
    </div>
  )
}, "Ratings")
