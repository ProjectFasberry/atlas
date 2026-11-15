import { useState } from "react";
import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { playerActivity, type PlayerActivityDailyPayload } from "../models/activity.model";
import { playerState } from "../models/player.model";
import { pageState } from "@/shared/models/page-context.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { Typography } from "@/shared/ui/typography";
import { ErrorBlock } from "@/shared/ui/error-block";
import { translate } from "@/shared/locales/helpers";
import { dayjs } from "@/shared/lib/dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

const CHART_DAYS = 365;
const CELL_CLASS = "size-2.5 sm:size-3 rounded-[3px]";

const LEVEL_CLASSES = [
  "bg-neutral-800",
  "bg-green-900",
  "bg-green-700",
  "bg-green-500",
  "bg-green-400",
  "bg-green-300",
] as const;

const levelClass = (minutes: number) => {
  if (minutes <= 0) return LEVEL_CLASSES[0];
  if (minutes < 30) return LEVEL_CLASSES[1];
  if (minutes < 60) return LEVEL_CLASSES[2];
  if (minutes < 120) return LEVEL_CLASSES[3];
  if (minutes < 240) return LEVEL_CLASSES[4];

  return LEVEL_CLASSES[5];
};

const formatHours = (minutes: number) => {
  const hours = minutes / 60;

  return hours >= 10 ? hours.toFixed(0) : hours.toFixed(1);
};

const buildWeeks = (payload: PlayerActivityDailyPayload) => {
  const minutesByDate = new Map(payload.days.map((day) => [day.date, day.minutes]));
  const today = dayjs.utc().startOf("day");
  const firstDay = today.subtract(CHART_DAYS - 1, "day");
  const gridStart = firstDay.subtract(firstDay.day(), "day");
  const totalDays = today.diff(gridStart, "day") + 1;
  const weeks = Math.ceil(totalDays / 7);

  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, dayOfWeek) => {
      const date = gridStart.add(week * 7 + dayOfWeek, "day");
      const key = date.format("YYYY-MM-DD");

      return {
        key,
        date,
        minutes: minutesByDate.get(key) ?? 0,
        isFuture: date.isAfter(today),
      };
    }),
  );
};

const ActivityChartSkeleton = () => (
  <div className="flex flex-col gap-3 w-full bg-neutral-900 rounded-xl p-4">
    <Skeleton className="h-6 w-40" />
    <div className="overflow-hidden">
      <div className="grid grid-flow-col grid-rows-7 gap-1 w-max">
        {Array.from({ length: 53 * 7 }).map((_, index) => (
          <div key={index} className={`${CELL_CLASS} bg-neutral-800/70`} />
        ))}
      </div>
    </div>
    <Skeleton className="h-4 w-56" />
  </div>
);

const ActivityChart = ({ payload }: { payload: PlayerActivityDailyPayload }) => {
  const weeks = buildWeeks(payload);
  const cells = weeks.flat();
  const [hovered, setHovered] = useState<Nullable<{
    x: number;
    y: number;
    label: string;
  }>>(null);

  return (
    <div className="flex flex-col gap-3 w-full bg-neutral-900 rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="font-semibold text-lg">
          {translate["player.activity.chart.title"]()}
        </Typography>
        <Typography className="text-sm text-neutral-400">
          {translate["player.activity.chart.total"]({ hours: formatHours(payload.totalMinutes) })}
        </Typography>
      </div>
      <div className="overflow-x-auto pb-1">
        <div
          className="grid grid-flow-col grid-rows-7 gap-1 w-max"
          role="img"
          aria-label={translate["player.activity.chart.title"]()}
        >
          {cells.map((cell) => {
            const label = cell.isFuture
              ? null
              : translate["player.activity.chart.tooltip"]({
                date: cell.date.format("DD.MM.YYYY"),
                hours: formatHours(cell.minutes),
              });

            return (
              <div
                key={cell.key}
                role="img"
                className={`${CELL_CLASS} ${cell.isFuture ? "bg-transparent" : levelClass(cell.minutes)}`}
                aria-label={label ?? undefined}
                onMouseEnter={label
                  ? (event) => setHovered({
                    x: event.clientX,
                    y: event.clientY,
                    label,
                  })
                  : undefined}
                onMouseLeave={label ? () => setHovered(null) : undefined}
              />
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
        <span>
          {payload.totalMinutes > 0
            ? translate["player.activity.chart.active-days"]({ days: payload.activeDays })
            : translate["player.activity.chart.empty"]()}
        </span>
        <div className="flex items-center gap-1">
          <span>{translate["player.activity.chart.less"]()}</span>
          {LEVEL_CLASSES.map((className) => (
            <span key={className} className={`${CELL_CLASS} ${className}`} />
          ))}
          <span>{translate["player.activity.chart.more"]()}</span>
        </div>
      </div>
      {hovered && (
        <div
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-full rounded-lg
            border border-neutral-700 bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-100 shadow-lg"
          style={{ left: hovered.x, top: hovered.y - 8 }}
        >
          {hovered.label}
        </div>
      )}
    </div>
  );
};

export const PlayerActivityChart = reatomComponent(({ ctx }) => {
  const nickname = ctx.spy(playerState.nickname);

  useUpdate((ctx) => {
    if (!nickname) return;

    playerActivity.daily.fetch(ctx, nickname);
  }, [nickname]);

  if (!ctx.spy(pageState.isClientside) || !nickname) {
    return <ActivityChartSkeleton />;
  }

  const status = ctx.spy(playerActivity.daily.fetch.statusesAtom);

  if (status.isFirstPending) return <ActivityChartSkeleton />;

  const error = ctx.spy(playerActivity.daily.fetch.errorAtom);
  if (error) return <ErrorBlock title={error.message} />;

  const data = ctx.spy(playerActivity.daily.fetch.dataAtom);
  if (!data) return <ActivityChartSkeleton />;

  return <ActivityChart payload={data} />;
}, "PlayerActivityChart");
