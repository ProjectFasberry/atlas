import { NewsList } from "@/shared/components/app/news/components/news-list";
import { NewsFilters } from "@/shared/components/app/news/components/news-list-filters";
import { news, NewsViewer } from "@/shared/components/app/news/models/news-list.model";
import { createPageModel } from "@/shared/lib/events";
import { Typography } from "@/shared/ui/typography"
import { useAtom } from "@reatom/npm-react";
import { translate } from "@/shared/locales/helpers"

const page = createPageModel({
  name: "news-list",
  hooks: {
    onConnect: (ctx) => {
      news.fetch(ctx)
    },
  }
})

export default function Page() {
  const [_] = useAtom(page.dataAtom);

  return (
    <div className="flex flex-col w-full h-full gap-6">
      <Typography className="text-3xl font-semibold">
        {translate["news.heading"]()}
      </Typography>
      <div className="flex flex-col gap-4 h-full w-full">
        <NewsFilters />
        <div className="flex flex-col w-full h-full">
          <NewsList />
          <NewsViewer />
        </div>
      </div>
    </div>
  )
}
