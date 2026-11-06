import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Noop } from "@/shared/ui/noop";
import { ErrorBlock } from "@/shared/ui/error-block";
import { PageLoader } from "@/shared/ui/page-loader";
import { Typography } from "@/shared/ui/typography";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { SectionWrapper, WithHeader } from "./ui";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { dayjs } from "@/shared/lib/dayjs";
import {
  economy, economyBusyAtom, economyState,
  type EconomyCurrency, type EconomyOperation, type LedgerItem,
} from "../models/economy.model";

export const ECONOMY_WRITE_PERMISSION = "economy.write";

const CURRENCY_LABEL: Record<EconomyCurrency, string> = {
  BELKOIN: "Белкоин",
  CHARISM: "Харизма",
};

const REASON_LABEL: Record<string, string> = {
  "migration": "Миграция баланса",
  "admin.adjustment": "Корректировка админа",
  "server.give_balance": "Выдача с сервера",
  "referral:initiator": "Реферал (инициатор)",
  "referral:recipient": "Реферал (приглашённый)",
  "referral:bonus": "Реферальный бонус",
  "store.purchase:BELKOIN": "Покупка за белкоин",
  "store.purchase:CHARISM": "Покупка за харизму",
  "store.refund:BELKOIN": "Возврат белкоина",
  "store.refund:CHARISM": "Возврат харизмы",
};

const number = new Intl.NumberFormat("ru-RU");

function formatAmount(value: number) {
  return `${value > 0 ? "+" : ""}${number.format(value)}`;
}

function formatDate(value: string) {
  const date = dayjs(value);
  return date.isValid() ? date.format("DD.MM.YYYY HH:mm:ss") : "—";
}

function reasonLabel(reason: string) {
  return REASON_LABEL[reason] ?? reason;
}

const SearchBar = reatomComponent(({ ctx }) => {
  const target = ctx.spy(economyState.target);
  const loading = ctx.spy(economy.search.statusesAtom).isPending;
  const error = ctx.spy(economy.search.errorAtom);

  const submit = () => {
    economyState.target(ctx, target.trim());
    economy.search(ctx, target);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-center w-full"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Input
          value={target}
          onChange={(event) => economyState.target(ctx, event.target.value)}
          placeholder="Никнейм игрока"
          maxLength={32}
          className="h-8 flex-1"
        />
        <Button background="white" className="h-8 px-4 text-xs" disabled={loading || target.trim().length === 0}>
          Найти
        </Button>
      </form>
      {error && !loading && <ErrorBlock title={error.message} />}
    </div>
  );
}, "EconomySearch");

const WalletBalances = reatomComponent(({ ctx }) => {
  const wallet = ctx.spy(economyState.wallet);
  if (!wallet) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Typography className="text-sm text-neutral-400">
        Игрок: <span className="text-neutral-50 font-semibold">{wallet.nickname}</span>
      </Typography>
      {(Object.keys(CURRENCY_LABEL) as EconomyCurrency[]).map((currency) => (
        <div key={currency} className="rounded-lg border border-neutral-800 px-3 py-1">
          <Typography className="text-xs text-neutral-400">{CURRENCY_LABEL[currency]}</Typography>
          <Typography className="text-base font-semibold">{number.format(wallet[currency])}</Typography>
        </div>
      ))}
    </div>
  );
}, "EconomyWallet");

const AdjustForm = reatomComponent(({ ctx }) => {
  const wallet = ctx.spy(economyState.wallet);
  const currency = ctx.spy(economyState.form.currency);
  const operation = ctx.spy(economyState.form.operation);
  const amount = ctx.spy(economyState.form.amount);
  const reason = ctx.spy(economyState.form.reason);
  const busy = ctx.spy(economyBusyAtom);
  const error = ctx.spy(economy.adjust.errorAtom);

  if (!wallet) return null;

  const amountValue = Number(amount);
  const valid = Number.isInteger(amountValue)
    && amountValue > 0
    && reason.trim().length >= 3;

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <Typography className="text-sm font-semibold">Корректировка баланса</Typography>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {(Object.keys(CURRENCY_LABEL) as EconomyCurrency[]).map((value) => (
            <Button
              key={value}
              background={currency === value ? "white" : "default"}
              className="h-8 px-2 text-xs"
              onClick={() => economyState.form.currency(ctx, value)}
            >
              {CURRENCY_LABEL[value]}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {([
            { label: "Начислить", value: "credit" },
            { label: "Списать", value: "debit" },
          ] as { label: string, value: EconomyOperation }[]).map((item) => (
            <Button
              key={item.value}
              background={operation === item.value ? "white" : "default"}
              className="h-8 px-2 text-xs"
              onClick={() => economyState.form.operation(ctx, item.value)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <Input
          value={amount}
          onChange={(event) => economyState.form.amount(ctx, event.target.value.replace(/\D/g, ""))}
          placeholder="Сумма"
          inputMode="numeric"
          maxLength={10}
          className="h-8 w-28"
        />

        <Input
          value={reason}
          onChange={(event) => economyState.form.reason(ctx, event.target.value)}
          placeholder="Причина (обязательно)"
          maxLength={200}
          className="h-8 flex-1"
        />

        <Button
          background="white"
          className="h-8 px-4 text-xs"
          disabled={!valid || busy}
          onClick={() => economy.adjust(ctx)}
        >
          Применить
        </Button>
      </div>

      {error && <ErrorBlock title={error.message} />}
      <Typography className="text-xs text-neutral-500">
        Каждая правка пишется в журнал с актором и причиной, прямые изменения балансов запрещены.
      </Typography>
    </SectionWrapper>
  );
}, "EconomyAdjustForm");

const LedgerRow = reatomComponent<{ item: LedgerItem, canWrite: boolean }>(({ ctx, item, canWrite }) => {
  const busy = ctx.spy(economyBusyAtom);
  const refundable = canWrite && item.reason.startsWith("store.purchase:") && item.order_id;

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{formatDate(item.created_at)}</TableCell>
      <TableCell>{CURRENCY_LABEL[item.currency] ?? item.currency}</TableCell>
      <TableCell className={item.delta > 0 ? "text-green-500" : "text-red"}>
        {formatAmount(item.delta)}
      </TableCell>
      <TableCell>{number.format(item.balance_after)}</TableCell>
      <TableCell title={item.reason}>{reasonLabel(item.reason)}</TableCell>
      <TableCell className="text-xs text-neutral-400">{item.actor ?? "—"}</TableCell>
      <TableCell className="text-xs text-neutral-400">{item.order_id ?? "—"}</TableCell>
      <TableCell className="text-right">
        {refundable && (
          <Button
            size="small"
            background="default"
            disabled={busy}
            onClick={() => item.order_id && economy.refund(ctx, item.order_id)}
          >
            Вернуть
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}, "EconomyLedgerRow");

const LedgerTable = reatomComponent(({ ctx }) => {
  const ledger = ctx.spy(economyState.ledger);
  const meta = ctx.spy(economyState.meta);
  const canWrite = ctx.spy(currentUserState.perms).includes(ECONOMY_WRITE_PERMISSION);
  const loadMore = ctx.spy(economy.loadMore.statusesAtom).isPending;
  const loadMoreError = ctx.spy(economy.loadMore.errorAtom);
  const refundReason = ctx.spy(economyState.refundReason);

  if (!ctx.spy(economyState.wallet)) return null;

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-sm font-semibold">Журнал операций</Typography>
        <div className="flex items-center gap-2">
          <Input
            value={refundReason}
            onChange={(event) => economyState.refundReason(ctx, event.target.value)}
            placeholder="Причина возврата"
            maxLength={200}
            className="h-8 w-56"
          />
          <Button
            background="default"
            className="h-8 px-3 text-xs"
            disabled={ctx.spy(economy.search.statusesAtom).isPending}
            onClick={() => economy.refresh(ctx)}
          >
            Обновить
          </Button>
        </div>
      </div>

      {ledger.length === 0
        ? <Noop title="Операций пока нет" />
        : (
          <Table>
            <TableCaption>Операции игрока</TableCaption>
            <TableHeader>
              <TableRow className="*:font-semibold *:text-base">
                <TableHead>Дата</TableHead>
                <TableHead>Валюта</TableHead>
                <TableHead>Изменение</TableHead>
                <TableHead>Баланс</TableHead>
                <TableHead>Причина</TableHead>
                <TableHead>Актор</TableHead>
                <TableHead>Заказ</TableHead>
                <TableHead className="text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((item) => <LedgerRow key={item.id} item={item} canWrite={canWrite} />)}
            </TableBody>
          </Table>
        )}

      {meta?.hasNextPage && (
        <Button
          background="default"
          className="h-8 px-3 text-xs self-center"
          disabled={loadMore}
          onClick={() => economy.loadMore(ctx)}
        >
          {loadMore ? "Загрузка..." : "Показать ещё"}
        </Button>
      )}

      {loadMoreError && <ErrorBlock title={loadMoreError.message} />}
    </SectionWrapper>
  );
}, "EconomyLedger");

const MigrationPanel = reatomComponent(({ ctx }) => {
  const canWrite = ctx.spy(currentUserState.perms).includes(ECONOMY_WRITE_PERMISSION);
  const batch = ctx.spy(economyState.migration);
  const busy = ctx.spy(economy.migrate.statusesAtom).isPending;

  if (!canWrite) return null;

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <Typography className="text-sm font-semibold">Миграция балансов</Typography>
      <Typography className="text-xs text-neutral-400">
        Переносит балансы плагинов в кошелёк один раз; повторный запуск безопасен и пропускает уже перенесённых.
      </Typography>

      <div className="flex items-center gap-2">
        <Button
          background="white"
          className="h-8 px-4 text-xs"
          disabled={busy}
          onClick={() => economy.migrate(ctx)}
        >
          {busy ? "Миграция..." : "Запустить миграцию"}
        </Button>

        {batch && (
          <Typography className="text-xs text-neutral-400">
            Проверено {batch.scanned}, перенесено {batch.migrated}, пропущено {batch.skipped}
            {batch.nextCursor ? ", продолжение..." : ", завершено"}
          </Typography>
        )}
      </div>
    </SectionWrapper>
  );
}, "EconomyMigration");


const RATE_CURRENCIES = ["RUB", "USDT", "USDC", "BELKOIN", "CHARISM"] as const;

const RatesSection = reatomComponent(({ ctx }) => {
  const canWrite = ctx.spy(currentUserState.perms).includes(ECONOMY_WRITE_PERMISSION);
  const payload = ctx.spy(economyState.rates);
  const from = ctx.spy(economyState.rateForm.from);
  const to = ctx.spy(economyState.rateForm.to);
  const rate = ctx.spy(economyState.rateForm.rate);
  const spread = ctx.spy(economyState.rateForm.spread);
  const busy = ctx.spy(economy.addRate.statusesAtom).isPending;
  const error = ctx.spy(economy.addRate.errorAtom);

  const valid = Number(rate) > 0 && Number(spread) >= 0 && Number(spread) < 1 && from !== to;

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <Typography className="text-sm font-semibold">Курсы валют</Typography>
      <Typography className="text-xs text-neutral-400">
        База - цена BELKOIN в рублях; остальные валюты считаются через BELKOIN. Спред удерживается при конвертации.
      </Typography>

      {payload && payload.current.length > 0
        ? (
          <Table>
            <TableHeader>
              <TableRow className="*:font-semibold *:text-base">
                <TableHead>Из</TableHead>
                <TableHead>В</TableHead>
                <TableHead>Курс</TableHead>
                <TableHead>Спред</TableHead>
                <TableHead className="text-right">Действует с</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payload.current.map((item) => (
                <TableRow key={`${item.from_currency}:${item.to_currency}:${item.effective_from}`}>
                  <TableCell>{item.from_currency}</TableCell>
                  <TableCell>{item.to_currency}</TableCell>
                  <TableCell>{Number(item.rate)}</TableCell>
                  <TableCell>{Math.round(Number(item.spread) * 1000) / 10}%</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatDate(item.effective_from)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
        : <Noop title="Курсы ещё не заданы" />}

      {canWrite && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={from}
            onChange={(event) => economyState.rateForm.from(ctx, event.target.value)}
            className="h-8 rounded-lg bg-neutral-800 px-2 text-xs"
          >
            {RATE_CURRENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Typography className="text-xs text-neutral-400">→</Typography>
          <select
            value={to}
            onChange={(event) => economyState.rateForm.to(ctx, event.target.value)}
            className="h-8 rounded-lg bg-neutral-800 px-2 text-xs"
          >
            {RATE_CURRENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Input
            value={rate}
            onChange={(event) => economyState.rateForm.rate(ctx, event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Курс"
            inputMode="decimal"
            maxLength={12}
            className="h-8 w-28"
          />
          <Input
            value={spread}
            onChange={(event) => economyState.rateForm.spread(ctx, event.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Спред, 0.05"
            inputMode="decimal"
            maxLength={6}
            className="h-8 w-28"
          />
          <Button
            background="white"
            className="h-8 px-4 text-xs"
            disabled={!valid || busy}
            onClick={() => economy.addRate(ctx)}
          >
            Добавить курс
          </Button>
          {error && <ErrorBlock title={error.message} />}
        </div>
      )}
    </SectionWrapper>
  );
}, "EconomyRates");

const FakePaymentSection = reatomComponent(({ ctx }) => {
  const canWrite = ctx.spy(currentUserState.perms).includes(ECONOMY_WRITE_PERMISSION);
  const amount = ctx.spy(economyState.fakeAmount);
  const order = ctx.spy(economyState.fakeOrder);
  const busy = ctx.spy(economy.createFakeInvoice.statusesAtom).isPending;
  const error = ctx.spy(economy.createFakeInvoice.errorAtom);

  if (!canWrite) return null;

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <Typography className="text-sm font-semibold">Тестовая оплата</Typography>
      <Typography className="text-xs text-neutral-400">
        Создаёт счёт фейкового провайдера и открывает страницу оплаты. Доступно только админам.
      </Typography>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={amount}
          onChange={(event) => economyState.fakeAmount(ctx, event.target.value.replace(/\D/g, ""))}
          placeholder="Сумма, ₽"
          inputMode="numeric"
          maxLength={10}
          className="h-8 w-36"
        />
        <Button
          background="white"
          className="h-8 px-4 text-xs"
          disabled={busy || amount.length === 0}
          onClick={() => economy.createFakeInvoice(ctx)}
        >
          Создать счёт
        </Button>
      </div>

      {error && <ErrorBlock title={error.message} />}

      {order && (
        <div className="flex flex-col gap-1 text-xs text-neutral-400">
          <span>
            Заказ {order.orderId}: {order.status}, к начислению BELKOIN {order.belkoin}
          </span>
          {order.payUrl && (
            <a className="text-neutral-50 underline" href={order.payUrl} target="_blank" rel="noreferrer">
              Открыть страницу оплаты
            </a>
          )}
        </div>
      )}
    </SectionWrapper>
  );
}, "EconomyFakePayment");

export const EconomyPanel = reatomComponent(({ ctx }) => {
  const loading = ctx.spy(economy.search.statusesAtom).isPending;
  const wallet = ctx.spy(economyState.wallet);

  useUpdate((ctx) => {
    economy.loadRates(ctx);
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      <RatesSection />
      <FakePaymentSection />
      <SearchBar />

      {loading && !wallet && <PageLoader />}

      {!wallet && !loading && (
        <Noop title="Найдите игрока, чтобы увидеть его кошелёк и журнал" />
      )}

      {wallet && (
        <>
          <SectionWrapper className="flex flex-col gap-2">
            <WalletBalances />
          </SectionWrapper>
          <AdjustForm />
          <LedgerTable />
          <MigrationPanel />
        </>
      )}
    </div>
  );
}, "EconomyPanel");

export const EconomyHeader = () => (
  <WithHeader title="Экономика" />
);
