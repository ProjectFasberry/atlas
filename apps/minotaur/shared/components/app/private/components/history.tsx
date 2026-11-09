import { PageLoader } from "@/shared/ui/page-loader";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Noop } from "@/shared/ui/noop";
import { ErrorBlock } from "@/shared/ui/error-block";
import { Typography } from "@/shared/ui/typography";
import { SectionWrapper } from "./ui";
import { atom, spawn } from "@reatom/framework";
import { dayjs } from "@/shared/lib/dayjs";
import { getFromDictionary } from "@/shared/models/app/utils";
import {
  HistoryViewer, history, historyDataAtom, historyInView, historyMetaAtom, historyPendingCountAtom, historyState,
  type HistoryItem, type HistorySeverity,
} from "../models/history.model";

const historyFiltersReady = atom(false, "historyFiltersReady")
const historyFiltersTimer = atom<ReturnType<typeof setTimeout> | null>(null, "historyFiltersTimer")

const SEVERITIES: { label: string, value: Nullable<HistorySeverity> }[] = [
  { label: "Все", value: null },
  { label: "Info", value: "info" },
  { label: "Warning", value: "warning" },
  { label: "Danger", value: "danger" },
];

const SEVERITY_STYLE: Record<string, string> = {
  info: "text-neutral-400",
  warning: "text-yellow-400",
  danger: "text-red",
};

function formatDate(value: string) {
  const date = dayjs(value);
  return date.isValid() ? date.format("DD.MM.YYYY HH:mm:ss") : "—";
}

const HistoryFilters = reatomComponent(({ ctx }) => {
  const initiator = ctx.spy(historyState.filters.initiator);
  const event = ctx.spy(historyState.filters.event);
  const severity = ctx.spy(historyState.filters.severity);
  useUpdate((ctx) => {
    if (!ctx.get(historyFiltersReady)) {
      historyFiltersReady(ctx, true)
      return
    }

    const current = ctx.get(historyFiltersTimer)
    if (current) clearTimeout(current)

    historyFiltersTimer(ctx, setTimeout(() => {
      historyFiltersTimer(ctx, null)
      history.refetchAll(ctx)
    }, 300))
  }, [initiator, event, severity]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full">
      <Input
        value={initiator}
        onChange={(e) => historyState.filters.initiator(ctx, e.target.value)}
        placeholder="Инициатор"
        maxLength={32}
        className="h-8 flex-1"
      />
      <Input
        value={event}
        onChange={(e) => historyState.filters.event(ctx, e.target.value)}
        placeholder="Событие (например players.role.update)"
        maxLength={128}
        className="h-8 flex-1"
      />
      <div className="flex items-center gap-1">
        {SEVERITIES.map((item) => (
          <Button
            key={item.label}
            background={severity === item.value ? "white" : "default"}
            className="h-8 px-2 text-xs"
            onClick={() => historyState.filters.severity(ctx, item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  )
}, "HistoryFilters")

const HistoryRow = reatomComponent<HistoryItem>(({ ctx, ...item }) => {
  const open = ctx.spy(historyState.expanded).has(item.id);
  const fresh = ctx.spy(historyState.freshIds).has(item.id);

  return (
    <>
      <TableRow
        className={fresh ? "cursor-pointer animate-[flash_2s_ease-out_forwards]" : "cursor-pointer"}
        onClick={() => historyState.toggleExpanded(ctx, item.id)}
      >
        <TableCell className="font-medium">{item.id}</TableCell>
        <TableCell>{item.initiator}</TableCell>
        <TableCell title={item.event}>{getFromDictionary(ctx, item.event)}</TableCell>
        <TableCell className={SEVERITY_STYLE[item.severity] ?? ""}>{item.severity}</TableCell>
        <TableCell className="text-right whitespace-nowrap">{formatDate(item.created_at)}</TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={5}>
            <div className="flex flex-col gap-1 text-xs">
              <span className="text-neutral-400">source: {item.source} · event: {item.event}</span>
              <pre className="max-h-64 overflow-auto rounded-lg bg-neutral-950 p-2 text-[11px]">
                {JSON.stringify(item.metadata ?? {}, null, 2)}
              </pre>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}, "HistoryRow")

const HistoryControls = reatomComponent(({ ctx }) => {
  const paused = ctx.spy(historyState.paused);
  const pending = ctx.spy(historyPendingCountAtom);
  const loading = ctx.spy(history.fetch.statusesAtom).isPending;

  return (
    <div className="flex items-center gap-2">
      <Button
        background="default"
        className="h-8 px-3 text-xs"
        onClick={() => history.setPaused(ctx, !paused)}
      >
        {paused ? (pending > 0 ? `Показать ${pending}` : "Продолжить") : "Пауза"}
      </Button>
      <Button
        background="default"
        className="h-8 px-3 text-xs"
        disabled={loading}
        onClick={() => history.refetchAll(ctx)}
      >
        Обновить
      </Button>
    </div>
  )
}, "HistoryControls")

const HistoryAutoLoad = reatomComponent(({ ctx }) => {
  const inView = ctx.spy(historyInView);
  const meta = ctx.spy(historyMetaAtom);
  const pending = ctx.spy(history.loadMore.statusesAtom).isPending;
  const error = ctx.spy(history.loadMore.errorAtom);

  useUpdate((ctx) => {
    if (!inView || !meta?.hasNextPage || pending || error) return;

    spawn(ctx, (spawnCtx) => history.loadMore(spawnCtx));
  }, [inView, meta?.endCursor, meta?.hasNextPage, pending, error]);

  return null;
}, "HistoryAutoLoad")

export const HistoryList = reatomComponent(({ ctx }) => {
  const data = ctx.spy(historyDataAtom);
  const loading = ctx.spy(history.fetch.statusesAtom);
  const error = ctx.spy(history.fetch.errorAtom);
  const loadMoreError = ctx.spy(history.loadMore.errorAtom);

  return (
    <SectionWrapper className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-sm text-neutral-400">
          Загружено: {data.length}
        </Typography>
        <HistoryControls />
      </div>

      <HistoryFilters />

      {loading.isFirstPending && <PageLoader />}

      {error && !loading.isPending && <ErrorBlock title={error.message} />}

      {!error && data.length === 0 && !loading.isPending && (
        <Noop title="Событий пока нет" />
      )}

      {data.length > 0 && (
        <Table>
          <TableCaption>История</TableCaption>
          <TableHeader>
            <TableRow className="*:font-semibold *:text-base">
              <TableHead className="w-[64px]">#</TableHead>
              <TableHead>Инициатор</TableHead>
              <TableHead>Ивент</TableHead>
              <TableHead className="w-[100px]">Уровень</TableHead>
              <TableHead className="text-right">Дата</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => <HistoryRow key={item.id} {...item} />)}
          </TableBody>
        </Table>
      )}

      {loadMoreError && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-red/40 px-3 py-2">
          <Typography className="text-sm text-red">{loadMoreError.message}</Typography>
          <Button
            size="small"
            background="default"
            onClick={() => {
              history.loadMore.errorAtom.reset(ctx);
              history.loadMore(ctx);
            }}
          >
            Повторить
          </Button>
        </div>
      )}

      <HistoryViewer />
      <HistoryAutoLoad />
    </SectionWrapper>
  )
}, "HistoryList")
