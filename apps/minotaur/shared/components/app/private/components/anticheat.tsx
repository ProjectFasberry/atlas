import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { ErrorBlock } from "@/shared/ui/error-block"
import { PageLoader } from "@/shared/ui/page-loader"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/ui/table"
import { Typography } from "@/shared/ui/typography"
import { dayjs } from "@/shared/lib/dayjs"
import { anticheat, anticheatState, setAnticheatFilter, setAnticheatHours } from "../models/anticheat.model"
import { translate } from "@/shared/locales/helpers"

const HOURS = [6, 24, 72, 168]

const formatTime = (value: string) => {
  const date = dayjs(value)
  return date.isValid() ? date.format("DD.MM HH:mm:ss") : "—"
}

export const AnticheatPanel = reatomComponent(({ ctx }) => {
  const data = ctx.spy(anticheatState.data)
  const statuses = ctx.spy(anticheat.fetch.statusesAtom)
  const error = ctx.spy(anticheat.fetch.errorAtom)
  const nickname = ctx.spy(anticheatState.nickname)
  const check = ctx.spy(anticheatState.check)
  const server = ctx.spy(anticheatState.server)
  const hours = ctx.spy(anticheatState.hours)

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-40"
          placeholder={translate["panel.anticheat.nickname"]()}
          value={nickname}
          onChange={(event) => setAnticheatFilter(ctx, "nickname", event.currentTarget.value)}
        />
        <Input
          className="w-40"
          placeholder={translate["panel.anticheat.check"]()}
          value={check}
          onChange={(event) => setAnticheatFilter(ctx, "check", event.currentTarget.value)}
        />
        <Input
          className="w-32"
          placeholder={translate["panel.anticheat.server"]()}
          value={server}
          onChange={(event) => setAnticheatFilter(ctx, "server", event.currentTarget.value)}
        />
        <div className="ml-auto flex gap-1">
          {HOURS.map((value) => (
            <Button
              key={value}
              className={`h-8 px-2 text-xs ${hours === value ? "" : "opacity-60"}`}
              onClick={() => setAnticheatHours(ctx, value)}
            >
              {translate["panel.anticheat.hours"]({ hours: value })}
            </Button>
          ))}
          <Button className="h-8 px-2 text-xs" onClick={() => anticheat.fetch(ctx)}>
            ↻
          </Button>
        </div>
      </div>

      {data && data.summary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.summary.slice(0, 8).map((row) => (
            <span
              key={`${row.server}-${row.check_name}`}
              className="rounded-md border border-neutral-800 px-2 py-1 text-xs text-neutral-300"
            >
              {row.check_name} · {row.server} · <span className="tabular-nums text-white">{row.total}</span>
            </span>
          ))}
        </div>
      )}

      {error && <ErrorBlock title={error.message} />}

      {statuses.isPending && !data ? (
        <PageLoader />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{translate["panel.anticheat.nickname"]()}</TableHead>
              <TableHead>{translate["panel.anticheat.check"]()}</TableHead>
              <TableHead className="text-right">{translate["panel.anticheat.vl"]()}</TableHead>
              <TableHead className="text-right">{translate["panel.anticheat.suppressed"]()}</TableHead>
              <TableHead>{translate["panel.anticheat.server"]()}</TableHead>
              <TableHead className="text-right">{translate["panel.anticheat.time"]()}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.flags ?? []).map((flag) => (
              <TableRow key={flag.id}>
                <TableCell>
                  <Typography className="text-sm text-white">{flag.nickname}</Typography>
                </TableCell>
                <TableCell className="text-sm text-neutral-300">{flag.check_name}</TableCell>
                <TableCell className="text-right tabular-nums text-sm text-amber-300">{flag.violations}</TableCell>
                <TableCell className="text-right tabular-nums text-sm text-neutral-400">{flag.suppressed}</TableCell>
                <TableCell className="text-sm text-neutral-400">{flag.server}</TableCell>
                <TableCell className="text-right text-xs text-neutral-500">{formatTime(flag.created_at)}</TableCell>
              </TableRow>
            ))}
            {!statuses.isPending && (data?.flags ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-neutral-500">
                  {translate["panel.anticheat.empty"]()}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )
}, "AnticheatPanel")
