import { type RatingItem as RatingItemProps, rating } from "@/shared/components/app/ratings/models/ratings.model"
import { Link } from "@/shared/components/config/link/link"
import { translate } from "@/shared/locales/helpers"
import { PageLoader } from "@/shared/ui/page-loader"
import { reatomComponent, useAtom } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { createPageModel } from "@/shared/lib/events"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Button } from "@/shared/ui/button"
import { getRatingTypeLabel, getServerLabel } from "@/shared/components/app/ratings/labels"

const RatingItem = ({
  title, parentValue, childs
}: Omit<RatingItemProps, "key"> & { parentValue: string }) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center border-t rounded-lg border-neutral-800 pt-2 px-2">
        <Typography className="font-bold text-2xl tracking-tight">
          {getServerLabel(parentValue, title)}
        </Typography>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
        {childs.map((child) => (
          <Link
            key={child.value}
            href={`/ratings/${parentValue}/${child.value}`}
            className="group relative flex duration-150 items-center justify-between p-4 bg-neutral-900 rounded-xl"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2.5 bg-neutral-50 rounded-xl transition-colors">
                <Icon
                  name="sprite:trophy"
                  className="size-[18px] duration-150 text-neutral-950 group-hover:fill-gold group-hover:text-gold"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-neutral-200 truncate">
                  {getRatingTypeLabel(child.value, child.title)}
                </span>
              </div>
            </div>
            <Icon
              name="sprite:chevron-right"
              className="size-[18px] text-neutral-600 group-hover:text-neutral-300"
            />
          </Link>
        ))}
      </div>
    </section>
  )
}

const RatingsList = reatomComponent(({ ctx }) => {
  if (ctx.spy(rating.fetch.statusesAtom).isPending) return <PageLoader />

  const error = ctx.spy(rating.fetch.errorAtom)
  if (error) {
    const isPending = ctx.spy(rating.fetch.statusesAtom).isPending

    return (
      <div className="flex flex-col gap-3">
        <ErrorBlock title={error.message || translate["ratings.error"]()} />
        <Button
          background="default"
          className="w-fit"
          disabled={isPending}
          withSpinner
          isLoading={isPending}
          onClick={() => rating.fetch(ctx)}
        >
          {translate["ratings.retry"]()}
        </Button>
      </div>
    )
  }

  const data = ctx.spy(rating.fetch.dataAtom)
  if (!data) return <PageLoader />;

  return (
    <div className="grid grid-cols-1 auto-rows-auto gap-10 min-w-0 w-full h-full">
      {data.map(({ key: parentValue, ...section }) => (
        <RatingItem key={parentValue} {...section} parentValue={parentValue} />
      ))}
    </div>
  )
}, "RatingsList")

const page = createPageModel({
  name: "rating",
  hooks: {
    onConnect: (ctx) => {
      rating.fetch(ctx)
    },
    onDisconnect: (ctx) => {
      rating.fetch.abort(ctx)
    }
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return <RatingsList />
}
