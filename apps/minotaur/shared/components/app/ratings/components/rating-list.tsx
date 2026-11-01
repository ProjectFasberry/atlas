import {
  type RatingBelkoin,
  type RatingCharism,
  type RatingLands,
  type RatingParkour,
  type RatingPlaytime,
  type RatingReputation
} from "@/shared/schemas/rating"
import { reatomComponent } from "@reatom/npm-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { type ReactNode } from "react";
import { type AtomState } from "@reatom/framework";
import { ratingsState, ratings } from "../models/ratings.model";
import { Icon } from "@/shared/ui/icon"
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table"
import { Avatar } from "../../../../ui/avatar";
import { Link } from "@/shared/components/config/link/link";
import { dayjs } from "@/shared/lib/dayjs"
import { PageLoader } from "@/shared/ui/page-loader";
import { Noop } from "@/shared/ui/noop";
import { ErrorBlock } from "@/shared/ui/error-block";
import { createLink } from "@/shared/components/config/link/link.model";
import { translate } from "@/shared/locales/helpers";

const RatingListParkourHeaderU = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">#</TableHead>
      <TableHead className="capitalize">
        {translate["parkour.player"]()}
      </TableHead>
      <TableHead className="capitalize">
        {translate["parkour.map"]()}
      </TableHead>
      <TableHead className="text-right capitalize">
        {translate["parkour.score"]()}
      </TableHead>
    </TableRow>
  )
}

const RatingListCharismHeaderU = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">#</TableHead>
      <TableHead className="capitalize">
        {translate["parkour.player"]()}
      </TableHead>
      <TableHead className="text-right capitalize">
        {translate["parkour.charism"]()}
      </TableHead>
    </TableRow>
  )
}

const RatingListBelkoinHeaderU = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">#</TableHead>
      <TableHead className="capitalize">
        {translate["parkour.player"]()}
      </TableHead>
      <TableHead className="text-right capitalize">
        {translate["parkour.belkoin"]()}
      </TableHead>
    </TableRow>
  )
}

const TableRowsSkeleton = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">
        <Skeleton className="h-8 w-8" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-10 w-24" />
      </TableHead>
      <TableHead>
        <Skeleton className="h-10 w-full" />
      </TableHead>
    </TableRow>
  )
}

const RatingListReputationHeaderU = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">#</TableHead>
      <TableHead className="capitalize">
        {translate["parkour.player"]()}
      </TableHead>
      <TableHead className="text-right capitalize">
        {translate["parkour.reputation"]()}
      </TableHead>
    </TableRow>
  )
}

const RatingListPlaytimeHeaderU = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">#</TableHead>
      <TableHead className="capitalize">
        {translate["parkour.player"]()}
      </TableHead>
      <TableHead className="text-right capitalize">
        {translate["parkour.playtime"]()}
      </TableHead>
    </TableRow>
  )
}

const RatingListLandsHeaderU = () => {
  return (
    <TableRow className="*:font-semibold *:text-base">
      <TableHead className="w-10">#</TableHead>
      <TableHead className="capitalize">
        {translate["parkour.lands"]()}
      </TableHead>
      <TableHead className="capitalize">
        {translate["parkour.chunks"]()}
      </TableHead>
      <TableHead className="text-right capitalize">
        {translate["parkour.type"]()}
      </TableHead>
    </TableRow>
  )
}

const RatingTableBodyParkour = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data) as RatingParkour[]
  if (!data) return null

  return (
    data.map((user, idx) => (
      <TableRow key={user.nickname}>
        <TableCell className="font-medium">{idx + 1}</TableCell>
        <TableCell>
          <UserHead nickname={user.nickname!} avatar={user.avatar} />
        </TableCell>
        <TableCell>{user.area}</TableCell>
        <TableHead className="text-right">{user.score}</TableHead>
      </TableRow>
    ))
  )
})

const RatingTableBodyBelkoin = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data) as RatingBelkoin[]
  if (!data) return null

  return (
    data.map((user, idx) => (
      <TableRow key={user.nickname}>
        <TableCell className="font-medium">{idx + 1}</TableCell>
        <TableCell>
          <UserHead nickname={user.nickname} avatar={user.avatar} />
        </TableCell>
        <TableHead className="text-right">{formatNumber(user.balance)}</TableHead>
      </TableRow>
    ))
  )
})

const RatingTableBodyReputation = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data) as RatingReputation[]
  if (!data) return null

  return (
    data.map((user, idx) => (
      <TableRow key={user.nickname}>
        <TableCell className="font-medium">{idx + 1}</TableCell>
        <TableCell>
          <UserHead nickname={user.nickname} avatar={user.avatar} />
        </TableCell>
        <TableHead className="text-right">{user.reputation}</TableHead>
      </TableRow>
    ))
  )
})

function formatNumber(n: number): number | string | null {
  try {
    return Number.isInteger(n) ? n : n.toFixed(2);
  } catch (e) {
    console.error('formatNumber error:', e);
    return null;
  }
}

const RatingTableBodyCharism = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data) as RatingCharism[]
  if (!data) return null

  return (
    data.map((user, idx) => (
      <TableRow key={user.nickname}>
        <TableCell className="font-medium">{idx + 1}</TableCell>
        <TableCell>
          <UserHead nickname={user.nickname} avatar={user.avatar} />
        </TableCell>
        <TableHead className="text-right">{formatNumber(user.balance)}</TableHead>
      </TableRow>
    ))
  )
}, "RatingTableBodyCharism")

const RatingTableBodyLands = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data) as RatingLands[]
  if (!data) return null

  return (
    data.map((land, idx) => (
      <TableRow key={idx}>
        <TableCell className="font-medium">{idx + 1}</TableCell>
        <TableCell>
          <Link href={createLink("land", land.ulid)}>
            {land.name}
          </Link>
        </TableCell>
        <TableCell>{land.chunks_amount}</TableCell>
        <TableHead className="text-right">{land.type}</TableHead>
      </TableRow>
    ))
  )
}, "RatingTableBodyLands")

const RatingsFilter = reatomComponent(({ ctx }) => {
  const current = ctx.spy(ratingsState.filters.asc);

  return (
    <Button
      className='bg-neutral-800 hover:bg-neutral-700 aspect-square text-neutral-400 h-8 w-8 p-1'
      onClick={() => ratingsState.filters.asc(ctx, (state) => !state)}
    >
      {current ? <Icon name="sprite:arrow-down" /> : <Icon name="sprite:arrow-up" />}
    </Button>
  )
}, "RatingsFilter")

const RatingsHeader = () => {
  return (
    <div className="flex items-center justify-between w-full">
      <RatingsFilter />
    </div>
  )
}

const UserHead = ({ nickname, avatar }: { nickname: string, avatar: string }) => {
  return (
    <Link href={createLink("player", nickname)} className="flex items-center gap-2">
      <Avatar
        nickname={nickname}
        className="w-6 h-6"
        url={avatar}
      />
      <span className="font-semibold text-base truncate min-w-0">
        {nickname}
      </span>
    </Link>
  )
}

const RatingTableBodyPlaytime = reatomComponent(({ ctx }) => {
  const data = ctx.spy(ratingsState.data) as RatingPlaytime[]
  if (!data) return null

  return (
    data.map((user, idx) => (
      <TableRow key={user.nickname}>
        <TableCell className="font-medium">{idx + 1}</TableCell>
        <TableCell>
          <UserHead nickname={user.nickname} avatar={user.avatar} />
        </TableCell>
        <TableHead className="text-right">
          {Math.floor(dayjs.duration(user.total ?? 0).asHours())} часа(-ов)
        </TableHead>
      </TableRow>
    ))
  )
}, "RatingTableBodyPlaytime")

const HEADERS: Record<AtomState<typeof ratingsState.filters.by>, ReactNode> = {
  "lands": <RatingListLandsHeaderU />,
  "parkour": <RatingListParkourHeaderU />,
  "playtime": <RatingListPlaytimeHeaderU />,
  "belkoin": <RatingListBelkoinHeaderU />,
  "reputation": <RatingListReputationHeaderU />,
  "charism": <RatingListCharismHeaderU />
}

export const COMPONENTS: Record<AtomState<typeof ratingsState.filters.by>, ReactNode> = {
  "playtime": <RatingTableBodyPlaytime />,
  "lands": <RatingTableBodyLands />,
  "reputation": <RatingTableBodyReputation />,
  "charism": <RatingTableBodyCharism />,
  "belkoin": <RatingTableBodyBelkoin />,
  "parkour": <RatingTableBodyParkour />
}

const RatingTableHeader = reatomComponent(({ ctx }) => HEADERS[ctx.spy(ratingsState.filters.by)], "RatingTableHeader")
const RatingTableBody = reatomComponent(({ ctx }) => {
  if (ctx.spy(ratings.update.statusesAtom).isPending) {
    return Array.from({ length: 32 }).map((_, idx) => <TableRowsSkeleton key={idx} />)
  }

  return COMPONENTS[ctx.spy(ratingsState.filters.by)]
}, "RatingTableBody")

export const Ratings = reatomComponent(({ ctx }) => {
  if (ctx.spy(ratings.fetch.statusesAtom).isPending) return <PageLoader />

  const error = ctx.spy(ratings.fetch.errorAtom);
  if (error) return <ErrorBlock title={error.message} />

  if (!ctx.spy(ratingsState.data)) return <Noop />

  return (
    <Table>
      <TableCaption>Рейтинг</TableCaption>
      <TableHeader>
        <RatingTableHeader />
      </TableHeader>
      <TableBody>
        <RatingTableBody />
      </TableBody>
    </Table>
  )
}, "Ratings")
