import { client, withJsonBody, withQueryParams } from "@/shared/lib/client-wrapper";
import {
  action, atom, reatomAsync, withAssign, withErrorAtom, withStatusesAtom,
} from "@reatom/framework";
import { notifyAboutRestrictRole } from "./actions.model";

export type EconomyCurrency = "BELKOIN" | "CHARISM";
export type EconomyOperation = "credit" | "debit";

export type EconomyWallet = {
  nickname: string;
  BELKOIN: number;
  CHARISM: number;
};

export type LedgerItem = {
  id: number;
  created_at: string;
  nickname: string;
  currency: EconomyCurrency;
  delta: number;
  balance_after: number;
  reason: string;
  order_id: Nullable<string>;
  actor: Nullable<string>;
  metadata: unknown;
};

export type LedgerPage = {
  data: LedgerItem[];
  meta: { hasNextPage: boolean; endCursor?: string };
};

export type MigrationBatch = {
  scanned: number;
  migrated: number;
  skipped: number;
  nextCursor: Nullable<string>;
};

const PAGE_SIZE = 50;

export const economyState = atom(null, "economyState").pipe(
  withAssign((_, name) => ({
    target: atom("", `${name}.target`),
    wallet: atom<EconomyWallet | null>(null, `${name}.wallet`),
    ledger: atom<LedgerItem[]>([], `${name}.ledger`),
    meta: atom<LedgerPage["meta"] | null>(null, `${name}.meta`),
    migration: atom<MigrationBatch | null>(null, `${name}.migration`),
    form: atom(null, `${name}.form`).pipe(
      withAssign((_, form) => ({
        currency: atom<EconomyCurrency>("BELKOIN", `${form}.currency`),
        operation: atom<EconomyOperation>("credit", `${form}.operation`),
        amount: atom("", `${form}.amount`),
        reason: atom("", `${form}.reason`),
      }))
    ),
    refundReason: atom("", `${name}.refundReason`),
  }))
);

async function fetchWallet(nickname: string) {
  return client<EconomyWallet>("privated/economy/wallet")
    .pipe(withQueryParams({ nickname }))
    .exec();
}

async function fetchPage(nickname: string, endCursor?: string) {
  return client<LedgerPage>("privated/economy/ledger")
    .pipe(withQueryParams({ nickname, limit: PAGE_SIZE, endCursor }))
    .exec();
}

function uniqueAppend(current: LedgerItem[], items: LedgerItem[]) {
  const ids = new Set(current.map((item) => item.id));
  return [...current, ...items.filter((item) => !ids.has(item.id))];
}

export const economy = atom(null, "economy").pipe(
  withAssign((_, name) => ({
    search: reatomAsync(async (ctx, nickname: string) => {
      const query = nickname.trim();
      if (query.length === 0) return null;

      return await ctx.schedule(async () => {
        const [wallet, page] = await Promise.all([
          fetchWallet(query),
          fetchPage(query),
        ]);

        return { wallet, page };
      });
    }, {
      name: `${name}.search`,
      onFulfill: (ctx, result) => {
        if (!result) return;

        economyState.wallet(ctx, result.wallet);
        economyState.ledger(ctx, result.page.data);
        economyState.meta(ctx, result.page.meta);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    refresh: action((ctx) => {
      const nickname = ctx.get(economyState.wallet)?.nickname;
      if (!nickname) return;

      economy.search(ctx, nickname);
    }),

    loadMore: reatomAsync(async (ctx) => {
      const nickname = ctx.get(economyState.wallet)?.nickname;
      const meta = ctx.get(economyState.meta);
      if (!nickname || !meta?.endCursor) return null;

      return await ctx.schedule(() => fetchPage(nickname, meta.endCursor));
    }, {
      name: `${name}.loadMore`,
      onFulfill: (ctx, page) => {
        if (!page) return;

        economyState.ledger(ctx, (current) => uniqueAppend(current, page.data));
        economyState.meta(ctx, page.meta);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    adjust: reatomAsync(async (ctx) => {
      const wallet = ctx.get(economyState.wallet);
      if (!wallet) return null;

      const amount = Number(ctx.get(economyState.form.amount));
      const reason = ctx.get(economyState.form.reason).trim();

      const result = await ctx.schedule(() =>
        client.post<{ nickname: string; currency: EconomyCurrency; balance: number }>("privated/economy/adjust")
          .pipe(withJsonBody({
            nickname: wallet.nickname,
            currency: ctx.get(economyState.form.currency),
            operation: ctx.get(economyState.form.operation),
            amount,
            reason,
          }))
          .exec()
      );

      const page = await ctx.schedule(() => fetchPage(wallet.nickname));
      return { result, page };
    }, {
      name: `${name}.adjust`,
      onFulfill: (ctx, payload) => {
        if (!payload) return;

        economyState.wallet(ctx, (wallet) => wallet
          ? { ...wallet, [payload.result.currency]: payload.result.balance }
          : wallet);
        economyState.ledger(ctx, payload.page.data);
        economyState.meta(ctx, payload.page.meta);
        economyState.form.amount(ctx, "");
        economyState.form.reason(ctx, "");
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    refund: reatomAsync(async (ctx, orderId: string) => {
      const wallet = ctx.get(economyState.wallet);
      if (!wallet) return null;

      const reason = ctx.get(economyState.refundReason).trim() || "Возврат по запросу игрока";

      await ctx.schedule(() =>
        client.post<unknown>("privated/economy/refund")
          .pipe(withJsonBody({ orderId, reason }))
          .exec()
      );

      const [nextWallet, page] = await ctx.schedule(() => Promise.all([
        fetchWallet(wallet.nickname),
        fetchPage(wallet.nickname),
      ]));

      return { wallet: nextWallet, page };
    }, {
      name: `${name}.refund`,
      onFulfill: (ctx, payload) => {
        if (!payload) return;

        economyState.wallet(ctx, payload.wallet);
        economyState.ledger(ctx, payload.page.data);
        economyState.meta(ctx, payload.page.meta);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    migrate: reatomAsync(async (ctx) => {
      let cursor: Nullable<string> = null;
      let total = { scanned: 0, migrated: 0, skipped: 0 };
      let last: Nullable<MigrationBatch> = null;

      for (let step = 0; step < 200; step += 1) {
        const batch = await ctx.schedule(() =>
          client.post<MigrationBatch>("privated/economy/migrate")
            .pipe(withJsonBody(cursor ? { cursor } : {}))
            .exec()
        );

        last = batch;
        total = {
          scanned: total.scanned + batch.scanned,
          migrated: total.migrated + batch.migrated,
          skipped: total.skipped + batch.skipped,
        };

        economyState.migration(ctx, { ...batch, ...total });

        if (!batch.nextCursor || batch.scanned === 0) break;
        cursor = batch.nextCursor;
      }

      return last;
    }, {
      name: `${name}.migrate`,
      onFulfill: (ctx) => {
        const nickname = ctx.get(economyState.wallet)?.nickname;
        if (nickname) economy.search(ctx, nickname);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),
  }))
);

export const economyBusyAtom = atom((ctx) =>
  ctx.spy(economy.adjust.statusesAtom).isPending
  || ctx.spy(economy.refund.statusesAtom).isPending
  || ctx.spy(economy.migrate.statusesAtom).isPending
);
