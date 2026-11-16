import type { ReactNode } from "react";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { spawn } from "@reatom/framework";
import { toast } from "sonner";
import { env } from "@/shared/env";
import { belkoinImage, charismImage } from "@/shared/consts/images";
import { getStaticImage } from "@/shared/lib/helpers";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { balance, balanceState } from "@/shared/components/app/player/models/balance.model";
import { tasks } from "@/shared/components/app/tasks/models/tasks.model";
import { referralLinkUrl, referrals } from "@/shared/components/app/referrals/models/referrals.model";
import { serverStatus } from "@/shared/components/app/intro/models/intro.model";
import { formatDuration, formatNumber } from "@/shared/components/app/ratings/format";
import { newsState } from "@/shared/components/app/news/models/news.model";
import { eventsState } from "@/shared/components/app/events/models/events.model";
import { Link } from "@/shared/components/config/link/link";
import { createLink } from "@/shared/components/config/link/link.model";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { home } from "../models/home.model";

const HERO_IMAGE = getStaticImage("images/village_pillage.webp");

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-2 rounded-xl bg-neutral-900/40 p-4 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{children}</span>
    {action}
  </div>
);

export const HomeHero = reatomComponent(({ ctx }) => {
  const user = ctx.spy(currentUserState);
  const status = ctx.spy(serverStatus.fetch.dataAtom);

  useUpdate((ctx) => {
    if (!user) return;
    balance.fetch(ctx);
  }, [Boolean(user)]);

  const balanceData = {
    belkoin: ctx.spy(balanceState.belkoinBalance),
    charism: ctx.spy(balanceState.charismBalance),
  };

  return (
    <div className="relative flex min-h-60 w-full flex-col overflow-hidden rounded-xl md:h-96 max-h-80">
      <div className="absolute inset-0 z-5 w-full bg-gradient-to-r from-black/85 via-black/50 to-transparent" />
      <img
        src={HERO_IMAGE}
        alt=""
        draggable={false}
        className="absolute inset-0 z-4 h-full w-full select-none object-cover"
      />
      <div className="relative z-6 flex h-full w-full grow flex-col justify-between gap-4 p-4 lg:p-6">
        <div className="flex flex-col items-start gap-3">
          <span className="rounded-md bg-green-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-green-300">
            {user ? `С возвращением, ${user.nickname}` : "Fasberry"}
          </span>
          <Typography className="text-2xl font-[PIXY] leading-[1.1] lg:text-4xl">
            {user ? "Твоё приключение продолжается" : "Мир, который ты строишь сам"}
          </Typography>
          <Typography className="max-w-2xl text-sm leading-tight text-neutral-200 lg:text-base">
            {user
              ? "Задания, рефералы и твоя земля - всё под рукой. Заходи в игру или проверь, что нового."
              : "Выживание, земли, ивенты и дружное комьюнити. Начни за пару минут - нужен только ник и пароль."}
          </Typography>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-300">
            <span className={`size-2 rounded-full ${status ? "bg-green-400" : "bg-neutral-500"}`} />
            <span>{status?.proxy.online ?? 0} онлайн</span>
          </div>

          {user ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link href={createLink("player", user.nickname)} className="flex items-center gap-2 rounded-lg bg-black/40 px-2 py-1">
                <Avatar url={user.avatar} nickname={user.nickname} className="size-6" />
                <span className="text-sm font-semibold">{user.nickname}</span>
              </Link>
              <span className="rounded-lg bg-black/40 px-2 py-1 text-xs text-neutral-300">
                {user.meta.role.name}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 text-sm">
                <img src={belkoinImage} alt="BELKOIN" className="size-4" />
                {formatNumber(balanceData.belkoin)}
              </span>
              <span className="flex items-center gap-1.5 rounded-lg bg-black/40 px-2 py-1 text-sm">
                <img src={charismImage} alt="CHARISM" className="size-4" />
                {formatNumber(balanceData.charism)}
              </span>
              <a href={`${env.VITE_LANDING_URL}/start`} target="_blank" rel="noreferrer">
                <Button background="white" className="h-8 text-sm font-semibold">
                  Как играть
                </Button>
              </a>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/auth?type=register">
                <Button background="white" className="h-9 text-sm font-semibold">
                  Создать аккаунт
                </Button>
              </Link>
              <a href={`${env.VITE_LANDING_URL}/start`} target="_blank" rel="noreferrer">
                <Button background="default" className="h-9 text-sm font-semibold">
                  Скачать лаунчер
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, "HomeHero");

const PlayerBalance = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { balance.fetch(ctx) }, []);

  const pending = ctx.spy(balance.fetch.statusesAtom).isPending;

  return (
    <Card>
      <CardTitle>Баланс</CardTitle>
      {pending ? (
        <Skeleton className="h-8 w-32" />
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5">
            <img src={belkoinImage} alt="BELKOIN" className="size-6" />
            <span className="text-2xl font-semibold">{formatNumber(ctx.spy(balanceState.belkoinBalance))}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <img src={charismImage} alt="CHARISM" className="size-6" />
            <span className="text-2xl font-semibold">{formatNumber(ctx.spy(balanceState.charismBalance))}</span>
          </span>
        </div>
      )}
      <Link href="/store" className="text-xs text-green-400 hover:text-green-300">
        В магазин
      </Link>
    </Card>
  );
}, "PlayerBalance");

const PlayerTasks = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { tasks.fetch(ctx) }, []);

  const data = ctx.spy(tasks.fetch.dataAtom);
  const pending = ctx.spy(tasks.fetch.statusesAtom).isPending;

  return (
    <Card>
      <CardTitle action={<Link href="/tasks" className="text-xs text-green-400 hover:text-green-300">Все</Link>}>
        Задания
      </CardTitle>
      {pending && !data ? (
        <Skeleton className="h-12 w-full" />
      ) : data?.data.length ? (
        <ul className="flex flex-col gap-1.5">
          {data.data.slice(0, 3).map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="truncate text-neutral-200">{task.title}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-green-300">
                <img
                  src={task.reward_currency === "CHARISM" ? charismImage : belkoinImage}
                  alt={task.reward_currency}
                  className="size-3.5"
                />
                +{task.reward_value}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-neutral-500">Пока нет активных заданий</span>
      )}
    </Card>
  );
}, "PlayerTasks");

const PlayerReferrals = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { referrals.stats(ctx) }, []);

  const stats = ctx.spy(referrals.stats.dataAtom);
  const pending = ctx.spy(referrals.createLink.statusesAtom).isPending;

  const copyLink = () => {
    spawn(ctx, async (spawnCtx) => {
      try {
        const link = await referrals.createLink(spawnCtx);
        if (!link) return;

        await navigator.clipboard.writeText(referralLinkUrl(link.token));
        toast.success("Ссылка скопирована");
      } catch {
        toast.error("Ссылку сейчас выдать нельзя");
      }
    });
  };

  return (
    <Card>
      <CardTitle action={<Link href="/referrals" className="text-xs text-green-400 hover:text-green-300">Подробнее</Link>}>
        Рефералы
      </CardTitle>
      <span className="text-2xl font-semibold">
        {stats ? `${stats.remaining} / ${stats.limit}` : "—"}
      </span>
      <span className="text-xs text-neutral-500">осталось за 12 месяцев</span>
      <Button
        background="default"
        className="h-8 w-fit text-xs font-semibold"
        disabled={pending || stats?.remaining === 0}
        onClick={copyLink}
      >
        Скопировать ссылку
      </Button>
    </Card>
  );
}, "PlayerReferrals");

const PlayerLand = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { home.myLand(ctx) }, []);

  const land = ctx.spy(home.myLand.dataAtom);
  const pending = ctx.spy(home.myLand.statusesAtom).isPending;

  return (
    <Card>
      <CardTitle action={<Link href="/lands" className="text-xs text-green-400 hover:text-green-300">Земли</Link>}>
        Твоя земля
      </CardTitle>
      {pending ? (
        <Skeleton className="h-10 w-full" />
      ) : land ? (
        <div className="flex flex-col gap-0.5">
          <span className="truncate text-lg font-semibold">{land.title || land.name}</span>
          <span className="text-xs text-neutral-500">Уровень {land.level}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-neutral-400">Ты пока без земли</span>
          <Link href="/lands" className="w-fit">
            <Button background="default" className="h-8 text-xs font-semibold">Создать землю</Button>
          </Link>
        </div>
      )}
    </Card>
  );
}, "PlayerLand");

export const PlayerPanel = reatomComponent(() => {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <PlayerBalance />
      <PlayerTasks />
      <PlayerReferrals />
      <PlayerLand />
    </div>
  );
}, "PlayerPanel");

const GuestSteps = () => (
  <Card>
    <CardTitle>Как начать за 3 шага</CardTitle>
    <ol className="flex flex-col gap-2 text-sm">
      {[
        ["1", "Создай аккаунт", "Ник и пароль - всё, что нужно."],
        ["2", "Поставь лаунчер", "Версия 1.20.x, клиентские моды по желанию."],
        ["3", "Открой лаунчер", "Войди под своим аккаунтом и выбери сервер."],
      ].map(([step, title, text]) => (
        <li key={step} className="flex gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-xs font-semibold text-green-300">
            {step}
          </span>
          <span className="flex flex-col">
            <span className="font-semibold text-neutral-100">{title}</span>
            <span className="text-xs text-neutral-400">{text}</span>
          </span>
        </li>
      ))}
    </ol>
    <Link href="/auth?type=register" className="text-xs text-green-400 hover:text-green-300">
      Создать аккаунт
    </Link>
  </Card>
);

const GuestTopPlayers = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { home.topPlayers(ctx) }, []);

  const players = ctx.spy(home.topPlayers.dataAtom);
  const pending = ctx.spy(home.topPlayers.statusesAtom).isPending;

  return (
    <Card>
      <CardTitle action={<Link href="/ratings" className="text-xs text-green-400 hover:text-green-300">Рейтинг</Link>}>
        Топ по онлайну
      </CardTitle>
      {pending && !players ? (
        <Skeleton className="h-24 w-full" />
      ) : players?.length ? (
        <ul className="flex flex-col gap-1.5">
          {players.map((player, index) => (
            <li key={player.nickname} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-xs text-neutral-500">{index + 1}</span>
              <Avatar url={player.avatar} nickname={player.nickname} className="size-5" />
              <span className="truncate">{player.nickname}</span>
              <span className="ms-auto shrink-0 text-xs text-neutral-500">{formatDuration(player.total)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-neutral-500">Рейтинг пока пуст</span>
      )}
    </Card>
  );
}, "GuestTopPlayers");

const GuestStore = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { home.storeItems(ctx) }, []);

  const items = ctx.spy(home.storeItems.dataAtom);

  return (
    <Card>
      <CardTitle action={<Link href="/store" className="text-xs text-green-400 hover:text-green-300">Магазин</Link>}>
        Поддержать проект
      </CardTitle>
      {items?.length ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={`/store/i/${item.id}`} className="flex items-center gap-2 text-sm hover:text-neutral-100">
                <img src={item.imageUrl} alt="" className="size-8 rounded object-cover" loading="lazy" />
                <span className="truncate">{item.title}</span>
                <span className="ms-auto flex shrink-0 items-center gap-1 text-xs text-green-300">
                  <img
                    src={item.currency === "CHARISM" ? charismImage : belkoinImage}
                    alt={item.currency}
                    className="size-3.5"
                  />
                  {formatNumber(item.price)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-neutral-500">Витрина скоро появится</span>
      )}
    </Card>
  );
}, "GuestStore");

const FAQ = [
  ["Нужна ли лицензия Minecraft?", "Нет, сервер работает в offline-режиме: нужен только ник."],
  ["Какие версии поддерживаются?", "Java Edition 1.20.1-1.20.4, вход через наш лаунчер."],
  ["Это платный сервер?", "Играть можно бесплатно. Донат ускоряет прогресс, но не даёт преимуществ в бою."],
  ["Что такое земли?", "Своя территория с защитой, участниками и статистикой - основа выживания."],
] as const;

const GuestFaq = () => (
  <Card>
    <CardTitle>Частые вопросы</CardTitle>
    <div className="flex flex-col divide-y divide-neutral-800">
      {FAQ.map(([question, answer]) => (
        <details key={question} className="group py-2">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium">
            {question}
            <Icon name="sprite:chevron-down" className="size-4 shrink-0 text-neutral-500 group-open:rotate-180" />
          </summary>
          <p className="pt-1 text-xs text-neutral-400">{answer}</p>
        </details>
      ))}
    </div>
  </Card>
);

const GuestSeason = reatomComponent(({ ctx }) => {
  const news = ctx.spy(newsState.data);
  const events = ctx.spy(eventsState.data);
  const latestNews = news[0];
  const latestEvent = events[0];

  return (
    <Card>
      <CardTitle>Что происходит</CardTitle>
      <ul className="flex flex-col gap-2 text-sm">
        {latestNews ? (
          <li className="flex flex-col">
            <Link href={createLink("news", latestNews.id)} className="truncate font-medium hover:text-neutral-100">
              {latestNews.title}
            </Link>
            <span className="text-xs text-neutral-500">Последняя новость</span>
          </li>
        ) : null}
        {latestEvent ? (
          <li className="flex flex-col">
            <span className="truncate font-medium">{latestEvent.title}</span>
            <span className="text-xs text-neutral-500">Последнее событие</span>
          </li>
        ) : null}
      </ul>
      <Link href="/news" className="text-xs text-green-400 hover:text-green-300">
        Все новости
      </Link>
    </Card>
  );
}, "GuestSeason");

export const GuestPanel = reatomComponent(() => {
  return (
    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <GuestSteps />
      <GuestTopPlayers />
      <GuestStore />
      <GuestSeason />
      <GuestFaq />
    </div>
  );
}, "GuestPanel");
