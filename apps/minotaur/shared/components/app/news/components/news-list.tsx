import { news, newsAllDataArrAtom, newsNotFoundTitleAtom } from "../models/news-list.model"
import { NotFound } from "@/shared/ui/not-found"
import { reatomComponent } from "@reatom/npm-react"
import { PageLoader } from "@/shared/ui/page-loader"
import { isEmptyArray } from "@/shared/lib/utils"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/config/link/link"
import { ErrorBlock } from "@/shared/ui/error-block"
import { createLink } from "@/shared/components/config/link/link.model"

const NewsListNotFound = reatomComponent(({ ctx }) =>
  <NotFound title={ctx.spy(newsNotFoundTitleAtom)} />
)

export const NewsList = reatomComponent(({ ctx }) => {
  if (ctx.spy(news.fetch.statusesAtom).isPending) return <PageLoader />

  const error = ctx.spy(news.fetch.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const data = ctx.spy(newsAllDataArrAtom);

  if (!data || isEmptyArray(data)) {
    return <NewsListNotFound />
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-auto gap-2 sm:gap-4 w-full h-full">
      {data.map((news) => (
        <div key={news.id} className="flex flex-col gap-4 bg-neutral-900 w-full rounded-xl p-3 sm:p-4">
          <div className="h-20 sm:h-36 w-full overflow-hidden rounded-lg">
            <img src={news.imageUrl} loading="lazy" alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <Typography className="text-lg leading-5 font-semibold truncate">
              {news.title}
            </Typography>
            <Link href={createLink("news", news.id)}>
              <Typography className="text-neutral-400 font-semibold text-sm">
                прочитать
              </Typography>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}, "NewsList")
