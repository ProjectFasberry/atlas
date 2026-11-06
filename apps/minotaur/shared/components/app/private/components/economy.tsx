import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { useState } from "react";
import { clsx } from "cnfast";
import { Dialog } from "@ark-ui/react/dialog";
import { Portal } from "@ark-ui/react/portal";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Icon } from "@/shared/ui/icon";
import { Noop } from "@/shared/ui/noop";
import { ErrorBlock } from "@/shared/ui/error-block";
import { PageLoader } from "@/shared/ui/page-loader";
import { Typography } from "@/shared/ui/typography";
import { dialogVariant, DialogClose } from "@/shared/ui/dialog";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { SectionWrapper, WithHeader } from "./ui";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { belkoinImage, charismImage } from "@/shared/consts/images";
import { dayjs } from "@/shared/lib/dayjs";
import {
  economy, economyBusyAtom, economyState,
  type EconomyCurrency, type EconomyOperation, type LedgerItem,
} from "../models/economy.model";

export const ECONOMY_WRITE_PERMISSION = "economy.write";

const CURRENCIES: EconomyCurrency[] = ["BELKOIN", "CHARISM"];

const CURRENCY_LABEL: Record<EconomyCurrency, string> = {
  BELKOIN: "Белкоин",
  CHARISM: "Харизма",
};

const CURRENCY_IMAGE: Record<EconomyCurrency, string> = {
  BELKOIN: belkoinImage,
  CHARISM: charismImage,
};

const OPERATIONS: { label: string, value: EconomyOperation, icon: "sprite:plus" | "sprite:arrow-down" }[] = [
  { label: "Начислить", value: "credit", icon: "sprite:plus" },
  { label: "Списать", value: "debit", icon: "sprite:arrow-down" },
];

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
  const selected = ctx.spy(economyState.form.currency);
  if (!wallet) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-sm font-semibold">Кошелёк</Typography>
        <Typography className="text-xs text-neutral-400">
          Игрок: <span className="text-neutral-50 font-semibold">{wallet.nickname}</span>
        </Typography>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CURRENCIES.map((currency) => {
          const isSelected = selected === currency;

          return (
            <button
              key={currency}
              type="button"
              data-state={isSelected}
              onClick={() => economyState.form.currency(ctx, currency)}
              className={clsx(
                "flex items-center justify-between gap-3 rounded-xl border p-3 text-left duration-150",
                isSelected
                  ? "border-green-700 bg-green-500/10"
                  : "border-neutral-800 bg-neutral-800/40 hover:border-neutral-700 hover:bg-neutral-800/70"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={CURRENCY_IMAGE[currency]}
                  width={28}
                  height={28}
                  alt=""
                  draggable={false}
                  className="shrink-0 select-none"
                />
                <div className="flex min-w-0 flex-col">
                  <Typography className="text-xs text-neutral-400">{CURRENCY_LABEL[currency]}</Typography>
                  <Typography className="truncate text-xl font-semibold">
                    {number.format(wallet[currency])}
                  </Typography>
                </div>
              </div>
              {isSelected && <Icon name="sprite:check" className="size-4 shrink-0 text-green-500" />}
            </button>
          );
        })}
      </div>
      <Typography className="text-xs text-neutral-500">
        Выберите кошелёк, чтобы сразу подготовить операцию.
      </Typography>
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
  const canWrite = ctx.spy(currentUserState.perms).includes(ECONOMY_WRITE_PERMISSION);

  if (!wallet || !canWrite) return null;

  const isCredit = operation === "credit";
  const amountValue = Number(amount);
  const currentBalance = wallet[currency];
  const insufficient = !isCredit && Number.isInteger(amountValue) && amountValue > currentBalance;
  const projected = isCredit
    ? currentBalance + (Number.isInteger(amountValue) ? amountValue : 0)
    : currentBalance - (Number.isInteger(amountValue) ? amountValue : 0);
  const valid = Number.isInteger(amountValue)
    && amountValue > 0
    && reason.trim().length >= 3
    && !insufficient;

  return (
    <SectionWrapper className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <Typography className="text-sm font-semibold">Начисление и списание</Typography>
          <Typography color="gray" className="text-xs">
            Изменения применяются сразу и попадают в журнал операций.
          </Typography>
        </div>
        <span className="rounded-lg bg-neutral-800 px-2 py-1 text-[11px] font-medium text-neutral-400">
          {number.format(currentBalance)} {CURRENCY_LABEL[currency].toLowerCase()}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <Typography color="gray" className="text-xs">Операция</Typography>
          <div className="flex items-center gap-1 rounded-xl bg-neutral-800 p-1">
            {OPERATIONS.map((item) => (
              <button
                key={item.value}
                type="button"
                data-state={operation === item.value}
                onClick={() => economyState.form.operation(ctx, item.value)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-300 duration-150 hover:bg-neutral-700 data-[state=true]:bg-neutral-50 data-[state=true]:text-neutral-950"
              >
                <Icon name={item.icon} className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Typography color="gray" className="text-xs">Валюта</Typography>
          <div className="flex items-center gap-1 rounded-xl bg-neutral-800 p-1">
            {CURRENCIES.map((item) => (
              <button
                key={item}
                type="button"
                data-state={currency === item}
                onClick={() => economyState.form.currency(ctx, item)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-300 duration-150 hover:bg-neutral-700 data-[state=true]:bg-neutral-50 data-[state=true]:text-neutral-950"
              >
                <img
                  src={CURRENCY_IMAGE[item]}
                  width={18}
                  height={18}
                  alt=""
                  draggable={false}
                  className="select-none"
                />
                {CURRENCY_LABEL[item]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[minmax(0,10rem)_1fr]">
        <div className="flex flex-col gap-1">
          <Typography color="gray" className="text-xs">Сумма</Typography>
          <Input
            value={amount}
            onChange={(event) => economyState.form.amount(ctx, event.target.value.replace(/\D/g, ""))}
            placeholder="0"
            inputMode="numeric"
            maxLength={10}
            className="h-10 w-full"
          />
        </div>
        <div className="flex flex-col gap-1">
          <Typography color="gray" className="text-xs">Причина</Typography>
          <Input
            value={reason}
            onChange={(event) => economyState.form.reason(ctx, event.target.value)}
            placeholder="Например: компенсация за ивент"
            maxLength={200}
            className="h-10 w-full"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-800/40 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Typography color="gray" className="text-xs">Баланс после операции</Typography>
          <span className="text-sm font-semibold text-neutral-400">{number.format(currentBalance)}</span>
          <Icon name="sprite:arrow-right" className="size-4 text-neutral-500" />
          <span
            className={clsx(
              "text-base font-semibold",
              insufficient ? "text-red" : isCredit ? "text-green-500" : "text-neutral-50"
            )}
          >
            {number.format(projected)}
          </span>
          <Typography color="gray" className="text-xs">{CURRENCY_LABEL[currency].toLowerCase()}</Typography>
        </div>

        <Button
          background={isCredit ? "positive" : "default"}
          variant={isCredit ? "default" : "danger"}
          withSpinner
          isLoading={busy}
          className="h-10 px-4 text-sm font-semibold"
          disabled={!valid || busy}
          onClick={() => economy.adjust(ctx)}
        >
          {isCredit ? "Начислить" : "Списать"}
          {amountValue > 0 ? ` ${number.format(amountValue)}` : ""}
        </Button>
      </div>

      {insufficient && (
        <Typography className="text-xs text-red">
          Недостаточно средств: на балансе {number.format(currentBalance)} {CURRENCY_LABEL[currency].toLowerCase()}.
        </Typography>
      )}
      {error && <ErrorBlock title={error.message} />}
      <Typography className="text-xs text-neutral-500">
        Каждая правка пишется в журнал с актором и причиной, прямые изменения балансов запрещены.
      </Typography>
    </SectionWrapper>
  );
}, "EconomyAdjustForm");

const LedgerRow = reatomComponent<{
  item: LedgerItem, canWrite: boolean, onRefund: (item: LedgerItem) => void
}>(({ ctx, item, canWrite, onRefund }) => {
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
            onClick={() => onRefund(item)}
          >
            Вернуть
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}, "EconomyLedgerRow");

const RefundInfoRow = ({ label, value, accent, mono }: {
  label: string, value: string, accent?: boolean, mono?: boolean
}) => (
  <div className="flex items-center justify-between gap-3">
    <Typography color="gray" className="text-xs">{label}</Typography>
    <span
      className={clsx(
        "truncate text-sm",
        accent ? "font-semibold text-green-500" : "font-medium text-neutral-100",
        mono && "font-mono text-xs"
      )}
    >
      {value}
    </span>
  </div>
)

const RefundDialog = reatomComponent<{ item: LedgerItem | null, onClose: () => void }>(({ ctx, item, onClose }) => {
  const reason = ctx.spy(economyState.refundReason);
  const busy = ctx.spy(economy.refund.statusesAtom).isPending;
  const error = ctx.spy(economy.refund.errorAtom);

  if (!item) return null;

  const amount = Math.abs(item.delta);

  const submit = async () => {
    if (!item.order_id) return;

    try {
      await economy.refund(ctx, item.order_id);
      onClose();
    } catch {
      // The model reports the failure through a toast and errorAtom.
    }
  };

  return (
    <Dialog.Root open onOpenChange={({ open }) => { if (!open) onClose(); }}>
      <Portal>
        <Dialog.Backdrop className={dialogVariant.backdrop()} />
        <Dialog.Positioner className={dialogVariant.positioner()}>
          <Dialog.Content className={dialogVariant.content("items-start! justify-start! max-w-lg!")}>
            <div className="flex flex-col gap-1 pr-8 w-full">
              <Dialog.Title className={dialogVariant.title("text-left!")}>Возврат заказа</Dialog.Title>
              <Typography color="gray" className="text-sm">
                Средства вернутся на кошелёк игрока, действие попадёт в журнал операций.
              </Typography>
            </div>

            <div className="flex w-full flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-800/40 p-3">
              <RefundInfoRow label="Игрок" value={item.nickname} />
              <RefundInfoRow label="Заказ" value={item.order_id ?? "—"} mono />
              <RefundInfoRow label="Списание" value={`${formatAmount(item.delta)} ${CURRENCY_LABEL[item.currency]}`} />
              <RefundInfoRow label="К возврату" value={`${number.format(amount)} ${CURRENCY_LABEL[item.currency]}`} accent />
            </div>

            <div className="flex w-full flex-col gap-1">
              <Typography color="gray" className="text-xs">Причина возврата</Typography>
              <Input
                value={reason}
                onChange={(event) => economyState.refundReason(ctx, event.target.value)}
                placeholder="Например: возврат по запросу игрока"
                maxLength={200}
                className="h-10 w-full"
              />
            </div>

            {error && <ErrorBlock title={error.message} />}

            <div className="flex w-full items-center justify-end gap-2">
              <Button background="default" className="h-10 px-4 text-sm" onClick={onClose}>
                Отмена
              </Button>
              <Button
                background="white"
                withSpinner
                isLoading={busy}
                className="h-10 px-4 text-sm font-semibold"
                disabled={busy || reason.trim().length < 3}
                onClick={submit}
              >
                Вернуть средства
              </Button>
            </div>
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}, "EconomyRefundDialog");

const LedgerTable = reatomComponent(({ ctx }) => {
  const ledger = ctx.spy(economyState.ledger);
  const meta = ctx.spy(economyState.meta);
  const canWrite = ctx.spy(currentUserState.perms).includes(ECONOMY_WRITE_PERMISSION);
  const loadMore = ctx.spy(economy.loadMore.statusesAtom).isPending;
  const loadMoreError = ctx.spy(economy.loadMore.errorAtom);
  const [refundTarget, setRefundTarget] = useState<LedgerItem | null>(null);

  if (!ctx.spy(economyState.wallet)) return null;

  const openRefund = (item: LedgerItem) => {
    if (ctx.get(economyState.refundReason).trim().length === 0) {
      economyState.refundReason(ctx, "Возврат по запросу игрока");
    }

    setRefundTarget(item);
  };

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-sm font-semibold">Журнал операций</Typography>
        <div className="flex items-center gap-2">
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
              {ledger.map((item) => (
                <LedgerRow
                  key={item.id}
                  item={item}
                  canWrite={canWrite}
                  onRefund={openRefund}
                />
              ))}
            </TableBody>
          </Table>
        )}

      <RefundDialog item={refundTarget} onClose={() => setRefundTarget(null)} />

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
  const editing = ctx.spy(economyState.rateForm.editing);
  const busy = ctx.spy(economy.addRate.statusesAtom).isPending
    || ctx.spy(economy.deleteRate.statusesAtom).isPending;
  const error = ctx.spy(economy.addRate.errorAtom);

  const valid = Number(rate) > 0 && Number(spread) >= 0 && Number(spread) < 1 && (editing !== null || from !== to);

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
                {canWrite && <TableHead className="text-right">Действия</TableHead>}
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
                  {canWrite && (
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="small"
                          background="default"
                          disabled={busy}
                          onClick={() => economy.startEditRate(ctx, item)}
                        >
                          Изменить
                        </Button>
                        <Button
                          size="small"
                          background="default"
                          disabled={busy}
                          onClick={() => economy.confirmDeleteRate(ctx, item)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  )}
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
            disabled={editing !== null}
            onChange={(event) => economyState.rateForm.from(ctx, event.target.value)}
            className="h-8 rounded-lg bg-neutral-800 px-2 text-xs disabled:opacity-50"
          >
            {RATE_CURRENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Typography className="text-xs text-neutral-400">→</Typography>
          <select
            value={to}
            disabled={editing !== null}
            onChange={(event) => economyState.rateForm.to(ctx, event.target.value)}
            className="h-8 rounded-lg bg-neutral-800 px-2 text-xs disabled:opacity-50"
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
            {editing !== null ? "Сохранить" : "Добавить курс"}
          </Button>
          {editing !== null && (
            <Button
              size="small"
              background="default"
              disabled={busy}
              onClick={() => economy.cancelEditRate(ctx)}
            >
              Отмена
            </Button>
          )}
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


const MINOR_EXPONENT: Record<string, number> = { RUB: 2, USDT: 6, USDC: 6 };

function formatMinor(amount: number, currency: string) {
  const exponent = MINOR_EXPONENT[currency] ?? 2;
  return number.format(amount / 10 ** exponent);
}

const ReconciliationSection = reatomComponent(({ ctx }) => {
  const data = ctx.spy(economyState.reconciliation);
  const report = ctx.spy(economyState.report);
  const checking = ctx.spy(economy.loadReconciliation.statusesAtom).isPending;
  const loadingReport = ctx.spy(economy.loadReport.statusesAtom).isPending;
  const error = ctx.spy(economy.loadReconciliation.errorAtom) ?? ctx.spy(economy.loadReport.errorAtom);

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-sm font-semibold">Сверка и отчёт</Typography>
        <div className="flex items-center gap-2">
          <Button
            background="default"
            className="h-8 px-3 text-xs"
            disabled={checking}
            onClick={() => economy.loadReconciliation(ctx)}
          >
            {checking ? "Проверка..." : "Проверить сверку"}
          </Button>
          <Button
            background="default"
            className="h-8 px-3 text-xs"
            disabled={loadingReport}
            onClick={() => economy.loadReport(ctx)}
          >
            {loadingReport ? "Загрузка..." : "Отчёт за 7 дней"}
          </Button>
        </div>
      </div>

      {error && <ErrorBlock title={error.message} />}

      {data && (
        <div className="flex flex-col gap-2">
          <Typography className="text-xs text-neutral-400">
            Проверено {data.balances.checked}, расхождений {data.balances.mismatchCount},
            ждут проекции {data.balances.pendingProjection}, без строки плагина {data.balances.missingPlugin}.
            Очередь: {data.jobs.pending} в ожидании, {data.jobs.failed} с ошибкой, {data.jobs.stuck} зависло.
          </Typography>

          {data.balances.mismatches.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="*:font-semibold *:text-base">
                  <TableHead>Игрок</TableHead>
                  <TableHead>Валюта</TableHead>
                  <TableHead>Ledger</TableHead>
                  <TableHead>Плагин</TableHead>
                  <TableHead className="text-right">Разница</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.balances.mismatches.map((item) => (
                  <TableRow key={`${item.nickname}:${item.currency}`}>
                    <TableCell>{item.nickname}</TableCell>
                    <TableCell>{item.currency}</TableCell>
                    <TableCell>{number.format(item.wallet)}</TableCell>
                    <TableCell>{number.format(item.plugin)}</TableCell>
                    <TableCell className="text-right">{formatAmount(item.delta)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {data.jobs.failedSamples.length > 0 && (
            <div className="flex flex-col gap-1 text-xs text-red">
              {data.jobs.failedSamples.map((job) => (
                <span key={`${job.orderId}:${job.kind}`}>
                  {job.kind} {job.orderId}: {job.error ?? "unknown"} ({job.attempts} попыток)
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {report && (
        <div className="flex flex-col gap-2">
          <Typography className="text-xs text-neutral-400">
            Период: {formatDate(report.period.from)} - {formatDate(report.period.to)}.
            Заказов {report.payments.created}, оплачено {report.payments.succeeded},
            конверсия {(report.payments.conversion * 100).toFixed(1)}%,
            плательщиков {report.payments.uniquePayers},
            выдано BELKOIN {number.format(report.payments.belkoinIssued)}.
            Топ-5 держателей: {(report.whales.topShare * 100).toFixed(1)}% от {number.format(report.whales.totalBelkoin)} BELKOIN.
          </Typography>

          {Object.entries(report.payments.revenueMinor).length > 0 && (
            <Typography className="text-xs text-neutral-400">
              Выручка: {Object.entries(report.payments.revenueMinor)
                .map(([currency, amount]) => `${formatMinor(amount, currency)} ${currency}`)
                .join(", ")}.
            </Typography>
          )}

          {report.flows.rows.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow className="*:font-semibold *:text-base">
                  <TableHead>Валюта</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Приход</TableHead>
                  <TableHead>Расход</TableHead>
                  <TableHead>Итог</TableHead>
                  <TableHead className="text-right">Операций</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.flows.rows.slice(0, 15).map((row) => (
                  <TableRow key={`${row.currency}:${row.reason}`}>
                    <TableCell>{row.currency}</TableCell>
                    <TableCell title={row.reason}>{reasonLabel(row.reason)}</TableCell>
                    <TableCell className="text-green-500">{number.format(row.inflow)}</TableCell>
                    <TableCell className="text-red">{number.format(row.outflow)}</TableCell>
                    <TableCell>{formatAmount(row.net)}</TableCell>
                    <TableCell className="text-right">{number.format(row.operations)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </SectionWrapper>
  );
}, "EconomyReconciliation");


const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "Ожидает",
  succeeded: "Оплачен",
  failed: "Ошибка",
  expired: "Истёк",
  refunded: "Возврат",
};

const ORDER_STATUSES: { label: string, value: Nullable<string> }[] = [
  { label: "Все", value: null },
  { label: "Ожидают", value: "pending" },
  { label: "Оплачены", value: "succeeded" },
  { label: "Возвраты", value: "refunded" },
  { label: "Ошибки", value: "failed" },
  { label: "Истекли", value: "expired" },
];

const OrdersSection = reatomComponent(({ ctx }) => {
  const orders = ctx.spy(economyState.orders);
  const meta = ctx.spy(economyState.ordersMeta);
  const nickname = ctx.spy(economyState.ordersFilter.nickname);
  const status = ctx.spy(economyState.ordersFilter.status);
  const sort = ctx.spy(economyState.ordersFilter.sort);
  const order = ctx.spy(economyState.ordersFilter.order);
  const loading = ctx.spy(economy.loadOrders.statusesAtom).isPending;
  const loadingMore = ctx.spy(economy.loadMoreOrders.statusesAtom).isPending;
  const busy = ctx.spy(economy.refundOrder.statusesAtom).isPending;
  const error = ctx.spy(economy.loadOrders.errorAtom) ?? ctx.spy(economy.refundOrder.errorAtom);

  return (
    <SectionWrapper className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-sm font-semibold">Заказы</Typography>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={nickname}
            onChange={(event) => economyState.ordersFilter.nickname(ctx, event.target.value)}
            placeholder="Никнейм"
            maxLength={32}
            className="h-8 w-40"
          />
          <Button
            background="default"
            className="h-8 px-3 text-xs"
            disabled={loading}
            onClick={() => economy.loadOrders(ctx)}
          >
            {loading ? "Загрузка..." : "Найти"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {([
          { label: "Дата", value: "date" as const },
          { label: "Сумма", value: "amount" as const },
        ]).map((item) => (
          <Button
            key={item.value}
            background={sort === item.value ? "white" : "default"}
            className="h-7 px-2 text-xs"
            onClick={() => {
              economyState.ordersFilter.sort(ctx, item.value);
              economy.loadOrders(ctx);
            }}
          >
            {item.label}
          </Button>
        ))}
        <Button
          background="default"
          className="h-7 px-2 text-xs"
          onClick={() => {
            economyState.ordersFilter.order(ctx, order === "desc" ? "asc" : "desc");
            economy.loadOrders(ctx);
          }}
        >
          {order === "desc" ? "Сначала новые" : "Сначала старые"}
        </Button>
        {ORDER_STATUSES.map((item) => (
          <Button
            key={item.label}
            background={status === item.value ? "white" : "default"}
            className="h-7 px-2 text-xs"
            onClick={() => {
              economyState.ordersFilter.status(ctx, item.value);
              economy.loadOrders(ctx);
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {error && <ErrorBlock title={error.message} />}

      {orders.length === 0
        ? <Noop title={loading ? "Загрузка..." : "Заказов нет"} />
        : (
          <Table>
            <TableHeader>
              <TableRow className="*:font-semibold *:text-base">
                <TableHead>Дата</TableHead>
                <TableHead>Заказ</TableHead>
                <TableHead>Игрок</TableHead>
                <TableHead>Провайдер</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>BELKOIN</TableHead>
                <TableHead className="text-right">Действие</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell className="whitespace-nowrap">{formatDate(order.createdAt)}</TableCell>
                  <TableCell className="text-xs text-neutral-400">{order.orderId}</TableCell>
                  <TableCell>{order.nickname}</TableCell>
                  <TableCell>{order.provider}</TableCell>
                  <TableCell>{ORDER_STATUS_LABEL[order.status] ?? order.status}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatMinor(order.amountMinor, order.currency)} {order.currency}
                  </TableCell>
                  <TableCell>{number.format(order.belkoin)}</TableCell>
                  <TableCell className="text-right">
                    {order.status === "succeeded" && (
                      <Button
                        size="small"
                        background="default"
                        disabled={busy}
                        onClick={() => economy.confirmRefundOrder(ctx, order)}
                      >
                        Вернуть
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

      {meta?.hasNextPage && (
        <Button
          background="default"
          className="h-8 px-3 text-xs self-center"
          disabled={loadingMore}
          onClick={() => economy.loadMoreOrders(ctx)}
        >
          {loadingMore ? "Загрузка..." : "Показать ещё"}
        </Button>
      )}
    </SectionWrapper>
  );
}, "EconomyOrders");

const PANEL_TABS = [
  { value: "player", label: "Игрок" },
  { value: "rates", label: "Курсы" },
  { value: "payments", label: "Платежи" },
  { value: "reconciliation", label: "Сверка" },
] as const;

type PanelTab = typeof PANEL_TABS[number]["value"];

export const EconomyPanel = reatomComponent(({ ctx }) => {
  const [tab, setTab] = useState<PanelTab>("player");
  const loading = ctx.spy(economy.search.statusesAtom).isPending;
  const wallet = ctx.spy(economyState.wallet);

  useUpdate((ctx) => {
    economy.loadRates(ctx);
  }, []);

  useUpdate((ctx) => {
    if (tab === "payments") economy.loadOrders(ctx);
  }, [tab]);

  return (
    <div className="flex flex-col gap-3 w-full min-w-0">
      <div className="flex w-full flex-wrap gap-1 rounded-xl bg-neutral-900 p-1">
        {PANEL_TABS.map((item) => (
          <Button
            key={item.value}
            background={tab === item.value ? "white" : "default"}
            className="h-8 flex-1 px-3 text-xs sm:flex-none"
            onClick={() => setTab(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {tab === "player" && (
        <>
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
            </>
          )}
        </>
      )}

      {tab === "rates" && <RatesSection />}

      {tab === "payments" && (
        <>
          <FakePaymentSection />
          <OrdersSection />
        </>
      )}

      {tab === "reconciliation" && (
        <>
          <ReconciliationSection />
          <MigrationPanel />
        </>
      )}
    </div>
  );
}, "EconomyPanel");

export const EconomyHeader = () => (
  <WithHeader title="Экономика" />
);
