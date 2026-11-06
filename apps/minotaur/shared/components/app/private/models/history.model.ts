import { client, withQueryParams } from "@/shared/lib/client-wrapper";
import { createEs } from "@/shared/lib/helpers";
import { createViewerModel } from "@/shared/models/shared.model";
import {
  action, atom, reatomAsync, spawn, withAbort, withAssign, withConcurrency,
  withErrorAtom, withStatusesAtom, type Ctx,
} from "@reatom/framework";
import { notifyAboutRestrictRole } from "./actions.model";

export type HistorySeverity = "info" | "warning" | "danger";

export type HistoryItem = {
  id: number;
  created_at: string;
  event: string;
  initiator: string;
  metadata: unknown;
  severity: string;
  source: string;
};

export type HistoryMeta = {
  hasNextPage: boolean;
  endCursor?: string;
};

export const { Component: HistoryViewer, inViewAtom: historyInView } = createViewerModel({
  name: "history-list",
});

export const historyState = atom(null, "historyState").pipe(
  withAssign((_, name) => ({
    filters: atom(null, `${name}.filters`).pipe(
      withAssign((_, filters) => ({
        initiator: atom("", `${filters}.initiator`),
        event: atom("", `${filters}.event`),
        severity: atom<Nullable<HistorySeverity>>(null, `${filters}.severity`),
      }))
    ),
    instance: atom<EventSource | null>(null, `${name}.es`),
    paused: atom(false, `${name}.paused`),
    pending: atom<HistoryItem[]>([], `${name}.pending`),
    freshIds: atom<Set<number>>(new Set<number>(), `${name}.freshIds`),
  }))
);

const historyData = atom<HistoryItem[]>([], "history.data");
const historyMeta = atom<HistoryMeta | null>(null, "history.meta");

function filtersParams(ctx: Ctx): Record<string, string> {
  const initiator = ctx.get(historyState.filters.initiator).trim();
  const event = ctx.get(historyState.filters.event).trim();
  const severity = ctx.get(historyState.filters.severity);

  return {
    ...(initiator ? { initiator } : {}),
    ...(event ? { event } : {}),
    ...(severity ? { severity } : {}),
  };
}

async function requestPage(params: Record<string, string | number | undefined>) {
  return client<{ data: HistoryItem[]; meta: HistoryMeta }>("privated/history/list")
    .pipe(withQueryParams(params))
    .exec();
}

function uniquePrepend(current: HistoryItem[], items: HistoryItem[]) {
  const ids = new Set(current.map((item) => item.id));
  const fresh = items.filter((item) => !ids.has(item.id));

  return [...fresh, ...current];
}

export const history = atom(null, "history").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => requestPage({ ...filtersParams(ctx), limit: 50 }));
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, result) => {
        // The API page is `{ data, meta }`; keep a bad shape from blanking the
        // table with an undefined list.
        historyData(ctx, Array.isArray(result?.data) ? result.data : []);
        historyMeta(ctx, result?.meta ?? null);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
      withAbort()
    ),

    loadMore: reatomAsync(async (ctx) => {
      const meta = ctx.get(historyMeta);
      if (!meta?.endCursor) return null;

      return await ctx.schedule(() => requestPage({
        ...filtersParams(ctx),
        limit: 50,
        endCursor: meta.endCursor,
      }));
    }, {
      name: `${name}.loadMore`,
      onFulfill: (ctx, result) => {
        if (!result) return;

        const items = Array.isArray(result.data) ? result.data : [];
        historyData(ctx, (current) => uniquePrepend(current, items));
        historyMeta(ctx, result.meta ?? null);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
      withAbort(),
      withConcurrency("first-in-win")
    ),

    refetchAll: action((ctx) => {
      history.loadMore.abort(ctx);
      history.loadMore.errorAtom.reset(ctx);
      historyMeta(ctx, null);
      historyData(ctx, []);
      history.fetch(ctx);
    }),

    /** A live NATS event; dedupes against the loaded pages. */
    push: action((ctx, item: HistoryItem) => {
      if (ctx.get(historyState.paused)) {
        historyState.pending(ctx, (current) => uniquePrepend(current, [item]));
        return;
      }

      historyData(ctx, (current) => uniquePrepend(current, [item]));
      historyState.freshIds(ctx, (current) => {
        const next = new Set(current);
        next.add(item.id);
        return next;
      });

      // The flash class runs once; drop the id so the set does not grow forever.
      setTimeout(() => {
        historyState.freshIds(ctx, (current) => {
          const next = new Set(current);
          next.delete(item.id);
          return next;
        });
      }, 2500);
    }),

    setPaused: action((ctx, paused: boolean) => {
      historyState.paused(ctx, paused);

      if (paused) return;

      const pending = ctx.get(historyState.pending);
      if (pending.length > 0) {
        historyData(ctx, (current) => uniquePrepend(current, pending));
      }

      historyState.pending(ctx, []);
    }),

    connect: action((ctx) => {
      const existing = ctx.get(historyState.instance);
      if (existing) return;

      const es = createEs("privated/history/events", { withCredentials: true });
      es.addEventListener("payload", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as HistoryItem;
          history.push(ctx, payload);
        } catch (error) {
          console.error("history payload", error);
        }
      });

      historyState.instance(ctx, es);
    }),

    disconnect: action((ctx) => {
      ctx.get(historyState.instance)?.close();
      historyState.instance(ctx, null);
      historyState.pending(ctx, []);
      historyState.freshIds(ctx, new Set());
    }),
  }))
);

export const historyDataAtom = historyData;
export const historyMetaAtom = historyMeta;

export const historyPendingCountAtom = atom((ctx) => ctx.spy(historyState.pending).length);

export const historyInViewEffect = action((ctx) => {
  const inView = ctx.get(historyInView);
  const meta = ctx.get(historyMeta);
  const pending = ctx.get(history.loadMore.statusesAtom).isPending;
  const error = ctx.get(history.loadMore.errorAtom);

  if (!inView || !meta?.hasNextPage || pending || error) return;

  spawn(ctx, (spawnCtx) => history.loadMore(spawnCtx));
});
