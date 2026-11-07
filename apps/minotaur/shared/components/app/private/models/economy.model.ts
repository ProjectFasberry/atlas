import { client, withJsonBody, withQueryParams } from "@/shared/lib/client-wrapper";
import {
  action, atom, reatomAsync, withAssign, withErrorAtom, withStatusesAtom,
} from "@reatom/framework";
import { toast } from "sonner";
import { notifyAboutRestrictRole } from "./actions.model";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";

export type EconomyCurrency = "BELKOIN" | "CHARISM";
export type EconomyOperation = "credit" | "debit";

export type EconomyWallet = {
  nickname: string;
  BELKOIN: number;
  CHARISM: number;
  refundable?: Record<EconomyCurrency, number>;
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

export type ExchangeRate = {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number | string;
  spread: number | string;
  effective_from: string;
};

export type RatesPayload = {
  current: ExchangeRate[];
  history: ExchangeRate[];
};

export type PaymentOrder = {
  orderId: string;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
  belkoin: number;
  payUrl: Nullable<string>;
  expiresAt: string;
};

export type BalanceMismatch = {
  nickname: string;
  currency: string;
  wallet: number;
  plugin: number;
  delta: number;
};

export type ReconciliationData = {
  balances: {
    at: string;
    checked: number;
    mismatchCount: number;
    missingPlugin: number;
    pendingProjection: number;
    mismatches: BalanceMismatch[];
  };
  jobs: {
    pending: number;
    failed: number;
    stuck: number;
    oldestPendingAt: Nullable<string>;
    failedSamples: { orderId: string; kind: string; error: Nullable<string>; attempts: number }[];
  };
};

export type AdminOrder = {
  id: number;
  orderId: string;
  nickname: string;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
  belkoin: number;
  refundableBelkoin: number;
  createdAt: string;
  expiresAt: string;
  paidAt: Nullable<string>;
  refundedAt: Nullable<string>;
};

export type OrdersPage = {
  data: AdminOrder[];
  meta: { hasNextPage: boolean; endCursor?: string };
};

export type FlowRow = {
  currency: string;
  reason: string;
  inflow: number;
  outflow: number;
  net: number;
  operations: number;
};

export type EconomyReport = {
  period: { from: string; to: string };
  flows: {
    rows: FlowRow[];
    totals: Record<string, { inflow: number; outflow: number; net: number }>;
  };
  payments: {
    orders: Record<string, number>;
    created: number;
    succeeded: number;
    conversion: number;
    revenueMinor: Record<string, number>;
    uniquePayers: number;
    belkoinIssued: number;
  };
  whales: {
    totalBelkoin: number;
    topAmount: number;
    topShare: number;
    holders: number;
  };
};

const PAGE_SIZE = 50;

export const economyState = atom(null, "economyState").pipe(
  withAssign((_, name) => ({
    target: atom("", `${name}.target`),
    wallet: atom<EconomyWallet | null>(null, `${name}.wallet`),
    ledger: atom<LedgerItem[]>([], `${name}.ledger`),
    meta: atom<LedgerPage["meta"] | null>(null, `${name}.meta`),
    migration: atom<MigrationBatch | null>(null, `${name}.migration`),
    rates: atom<RatesPayload | null>(null, `${name}.rates`),
    rateForm: atom(null, `${name}.rateForm`).pipe(
      withAssign((_, form) => ({
        from: atom("BELKOIN", `${form}.from`),
        to: atom("RUB", `${form}.to`),
        rate: atom("", `${form}.rate`),
        spread: atom("0", `${form}.spread`),
        editing: atom<Nullable<number>>(null, `${form}.editing`),
      }))
    ),
    fakeAmount: atom("", `${name}.fakeAmount`),
    fakeOrder: atom<PaymentOrder | null>(null, `${name}.fakeOrder`),
    reconciliation: atom<ReconciliationData | null>(null, `${name}.reconciliation`),
    report: atom<EconomyReport | null>(null, `${name}.report`),
    orders: atom<AdminOrder[]>([], `${name}.orders`),
    ordersMeta: atom<OrdersPage["meta"] | null>(null, `${name}.ordersMeta`),
    ordersFilter: atom(null, `${name}.ordersFilter`).pipe(
      withAssign((_, filters) => ({
        nickname: atom("", `${filters}.nickname`),
        appliedNickname: atom("", `${filters}.appliedNickname`),
        status: atom<Nullable<string>>(null, `${filters}.status`),
        provider: atom<Nullable<string>>(null, `${filters}.provider`),
        sort: atom<"date" | "amount">("date", `${filters}.sort`),
        order: atom<"asc" | "desc">("desc", `${filters}.order`),
      }))
    ),
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
        client.post<{ nickname: string; currency: EconomyCurrency; balance: number; duplicate: boolean }>("privated/economy/adjust")
          .pipe(withJsonBody({
            nickname: wallet.nickname,
            currency: ctx.get(economyState.form.currency),
            operation: ctx.get(economyState.form.operation),
            amount,
            reason,
            idempotencyKey: crypto.randomUUID(),
          }))
          .exec()
      );

      const page = await ctx.schedule(() => fetchPage(wallet.nickname));
      return { result, page };
    }, {
      name: `${name}.adjust`,
      onFulfill: (ctx, payload) => {
        if (!payload) return;

        const operation = ctx.get(economyState.form.operation);
        const amount = ctx.get(economyState.form.amount);

        economyState.wallet(ctx, (wallet) => wallet
          ? { ...wallet, [payload.result.currency]: payload.result.balance }
          : wallet);
        economyState.ledger(ctx, payload.page.data);
        economyState.meta(ctx, payload.page.meta);
        economyState.form.amount(ctx, "");
        economyState.form.reason(ctx, "");

        toast.success(operation === "credit" ? "Баланс пополнен" : "Баланс уменьшен", {
          description: `${payload.result.nickname}: ${amount} ${payload.result.currency}`,
        });
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
        toast.success("Возврат выполнен");
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    loadRates: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client<RatesPayload>("privated/economy/rates").exec());
    }, {
      name: `${name}.loadRates`,
      onFulfill: (ctx, payload) => {
        if (payload) economyState.rates(ctx, payload);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    addRate: reatomAsync(async (ctx) => {
      const editing = ctx.get(economyState.rateForm.editing);
      const body = {
        rate: Number(ctx.get(economyState.rateForm.rate)),
        spread: Number(ctx.get(economyState.rateForm.spread)) || 0,
      };

      const rate = await ctx.schedule(() => editing
        ? client.patch<ExchangeRate>(`privated/economy/rates/${editing}`)
          .pipe(withJsonBody(body))
          .exec()
        : client.post<ExchangeRate>("privated/economy/rates")
          .pipe(withJsonBody({
            from: ctx.get(economyState.rateForm.from).trim().toUpperCase(),
            to: ctx.get(economyState.rateForm.to).trim().toUpperCase(),
            ...body,
          }))
          .exec()
      );

      const payload = await ctx.schedule(() => client<RatesPayload>("privated/economy/rates").exec());
      return { rate, payload };
    }, {
      name: `${name}.addRate`,
      onFulfill: (ctx, payload) => {
        if (!payload) return;

        economyState.rates(ctx, payload.payload);
        economyState.rateForm.rate(ctx, "");
        economyState.rateForm.spread(ctx, "0");
        economyState.rateForm.editing(ctx, null);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    startEditRate: action((ctx, rate: ExchangeRate) => {
      economyState.rateForm.editing(ctx, rate.id);
      economyState.rateForm.from(ctx, rate.from_currency);
      economyState.rateForm.to(ctx, rate.to_currency);
      economyState.rateForm.rate(ctx, String(Number(rate.rate)));
      economyState.rateForm.spread(ctx, String(Number(rate.spread)));
    }),

    cancelEditRate: action((ctx) => {
      economyState.rateForm.editing(ctx, null);
      economyState.rateForm.rate(ctx, "");
      economyState.rateForm.spread(ctx, "0");
    }),

    deleteRate: reatomAsync(async (ctx, id: number) => {
      await ctx.schedule(() =>
        client.delete<ExchangeRate>(`privated/economy/rates/${id}`).exec()
      );

      const payload = await ctx.schedule(() => client<RatesPayload>("privated/economy/rates").exec());
      return { id, payload };
    }, {
      name: `${name}.deleteRate`,
      onFulfill: (ctx, result) => {
        if (!result) return;

        economyState.rates(ctx, result.payload);
        if (ctx.get(economyState.rateForm.editing) === result.id) {
          economy.cancelEditRate(ctx);
        }
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    confirmDeleteRate: action((ctx, rate: ExchangeRate) => {
      alertDialog.open(ctx, {
        title: "Удалить курс?",
        description: `${rate.from_currency} -> ${rate.to_currency} (${Number(rate.rate)})`,
        confirmLabel: "Удалить",
        withCancel: true,
        onConfirm: () => economy.deleteRate(ctx, rate.id),
      });
    }),

    loadReconciliation: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client<ReconciliationData>("privated/economy/reconciliation").exec());
    }, {
      name: `${name}.loadReconciliation`,
      onFulfill: (ctx, payload) => {
        if (payload) economyState.reconciliation(ctx, payload);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    loadReport: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client<EconomyReport>("privated/economy/report").exec());
    }, {
      name: `${name}.loadReport`,
      onFulfill: (ctx, payload) => {
        if (payload) economyState.report(ctx, payload);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    loadOrders: reatomAsync(async (ctx) => {
      const nickname = ctx.get(economyState.ordersFilter.appliedNickname).trim();
      const status = ctx.get(economyState.ordersFilter.status);
      const provider = ctx.get(economyState.ordersFilter.provider);

      return await ctx.schedule(() =>
        client<OrdersPage>("privated/economy/orders")
          .pipe(withQueryParams({
            limit: 50,
            sort: ctx.get(economyState.ordersFilter.sort),
            order: ctx.get(economyState.ordersFilter.order),
            ...(nickname ? { nickname } : {}),
            ...(status ? { status } : {}),
            ...(provider ? { provider } : {}),
          }))
          .exec()
      );
    }, {
      name: `${name}.loadOrders`,
      onFulfill: (ctx, page) => {
        if (!page) return;

        economyState.orders(ctx, page.data);
        economyState.ordersMeta(ctx, page.meta);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    loadMoreOrders: reatomAsync(async (ctx) => {
      const meta = ctx.get(economyState.ordersMeta);
      if (!meta?.endCursor) return null;

      const nickname = ctx.get(economyState.ordersFilter.appliedNickname).trim();
      const status = ctx.get(economyState.ordersFilter.status);
      const provider = ctx.get(economyState.ordersFilter.provider);

      return await ctx.schedule(() =>
        client<OrdersPage>("privated/economy/orders")
          .pipe(withQueryParams({
            limit: 50,
            endCursor: meta.endCursor,
            sort: ctx.get(economyState.ordersFilter.sort),
            order: ctx.get(economyState.ordersFilter.order),
            ...(nickname ? { nickname } : {}),
            ...(status ? { status } : {}),
            ...(provider ? { provider } : {}),
          }))
          .exec()
      );
    }, {
      name: `${name}.loadMoreOrders`,
      onFulfill: (ctx, page) => {
        if (!page) return;

        economyState.orders(ctx, (current) => [...current, ...page.data]);
        economyState.ordersMeta(ctx, page.meta);
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    applyOrdersNickname: action((ctx) => {
      const nickname = ctx.get(economyState.ordersFilter.nickname).trim();
      economyState.ordersFilter.appliedNickname(ctx, nickname);
      economy.loadOrders(ctx);
    }, `${name}.applyOrdersNickname`),

    resetOrdersFilters: action((ctx) => {
      economyState.ordersFilter.nickname(ctx, "");
      economyState.ordersFilter.appliedNickname(ctx, "");
      economyState.ordersFilter.status(ctx, null);
      economyState.ordersFilter.provider(ctx, null);
      economyState.ordersFilter.sort(ctx, "date");
      economyState.ordersFilter.order(ctx, "desc");
      economy.loadOrders(ctx);
    }, `${name}.resetOrdersFilters`),

    refundOrder: reatomAsync(async (ctx, order: AdminOrder) => {
      await ctx.schedule(() =>
        client.post<unknown>(`payments/orders/${order.orderId}/refund`)
          .pipe(withJsonBody({ reason: "Возврат из панели" }))
          .exec()
      );

      return await ctx.schedule(() =>
        client<OrdersPage>("privated/economy/orders")
          .pipe(withQueryParams({ limit: 50 }))
          .exec()
      );
    }, {
      name: `${name}.refundOrder`,
      onFulfill: (ctx, page) => {
        if (!page) return;

        economyState.orders(ctx, page.data);
        economyState.ordersMeta(ctx, page.meta);
        toast.success("Возврат платежа выполнен");
      },
      onReject: (_, error) => notifyAboutRestrictRole(error),
    }).pipe(withStatusesAtom(), withErrorAtom()),

    confirmRefundOrder: action((ctx, order: AdminOrder) => {
      alertDialog.open(ctx, {
        title: "Вернуть платёж?",
        description: `${order.orderId}: к возврату ${order.refundableBelkoin ?? 0} из ${order.belkoin} BELKOIN игроку ${order.nickname}. Потраченная часть пополнения не возвращается; купленные товары остаются.`,
        confirmLabel: "Вернуть",
        withCancel: true,
        onConfirm: () => economy.refundOrder(ctx, order),
      });
    }),

    createFakeInvoice: reatomAsync(async (ctx) => {
      const amount = Number(ctx.get(economyState.fakeAmount).replace(/[^0-9]/g, ""));
      if (!Number.isInteger(amount) || amount <= 0) return null;

      return await ctx.schedule(() =>
        client.post<PaymentOrder>("payments/invoice")
          .pipe(withJsonBody({ provider: "fake", amountMinor: amount * 100, currency: "RUB" }))
          .exec()
      );
    }, {
      name: `${name}.createFakeInvoice`,
      onFulfill: (ctx, order) => {
        if (order) economyState.fakeOrder(ctx, order);
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
