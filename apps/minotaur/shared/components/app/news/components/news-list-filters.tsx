import { Button } from "@/shared/ui/button"
import { news, newsState } from "../models/news-list.model"
import { reatomComponent } from "@reatom/npm-react"
import { Input } from "@/shared/ui/input"
import { Icon } from "@/shared/ui/icon"
import { translate } from "@/shared/locales/helpers"

const NewsFilterSearch = reatomComponent(({ ctx }) => {
  return (
    <div className="flex items-center w-full h-10 relative">
      <Icon name='sprite:search' className="size-5 text-neutral-400 absolute z-1 left-4" />
      <Input
        className="w-full h-10 pl-12"
        placeholder="Название"
        onChange={e => newsState.filters.searchQuery.onChangeEvent(ctx, e)}
        value={ctx.spy(newsState.filters.searchQuery)}
        maxLength={1024}
      />
    </div>
  )
}, "TasksFilterSearch")

const NewsFilterAsc = reatomComponent(({ ctx }) => {
  return (
    <Button
      background="compound"
      aria-label={translate["news.sort"]()}
      className="aspect-square rounded-xl text-neutral-400 h-11 w-11 p-0 *:size-5"
      onClick={() => newsState.filters.asc(ctx, (state) => !state)}
      disabled={ctx.spy(news.fetch.statusesAtom).isPending}
    >
      {ctx.spy(newsState.filters.asc)
        ? <Icon name="sprite:arrow-up" />
        : <Icon name="sprite:arrow-down" />
      }
    </Button>
  )
}, "TasksFilterAsc")

export const NewsFilters = () => {
  return (
    <div className="flex justify-between items-center gap-2 w-full">
      <NewsFilterSearch />
      <NewsFilterAsc />
    </div>
  )
}
