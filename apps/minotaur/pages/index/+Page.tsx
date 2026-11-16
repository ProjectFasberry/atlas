import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography";
import { LandsListShorted } from "@/shared/components/app/lands/components/lands-list";
import { NewsList } from "@/shared/components/app/news/components/news-main-list";
import { newsState } from "@/shared/components/app/news/models/news.model";
import { GuestPanel, HomeHero, PlayerPanel } from "@/shared/components/app/home/components/home";
import { home, homeState } from "@/shared/components/app/home/models/home.model";
import { currentUserState } from "@/shared/models/current-user/index.model";
import { translate } from "@/shared/locales/helpers";
import { Icon } from "@/shared/ui/icon";
import { socialsAtom } from "@/shared/models/shared.model";

const Socials = reatomComponent(({ ctx }) => {
  const data = ctx.spy(socialsAtom)
  if (!data) return null;

  return (
    <div
      id="socials"
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 auto-rows-auto gap-2 sm:gap-4 w-full"
    >
      {data.map((item, idx) => (
        <a
          href={item.href}
          key={idx}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center justify-between p-4 group rounded-xl`}
          style={{
            backgroundColor: item.color,
          }}
        >
          <div className="flex items-center gap-2 sm:gap-4">
            <img src={item.img} loading="lazy" alt="" width={36} height={36} />
            <Typography className="truncate font-semibold text-lg lg:text-xl">
              {item.title}
            </Typography>
          </div>
          <Icon name="sprite:arrow-right" className="size-5 duration-150 -rotate-45 group-hover:rotate-0" />
        </a>
      ))}
    </div>
  )
}, "Socials")

const HomeBranch = reatomComponent(({ ctx }) => {
  return ctx.spy(currentUserState) ? <PlayerPanel /> : <GuestPanel />
}, "HomeBranch")

const MarkRead = reatomComponent(({ ctx }) => {
  const news = ctx.spy(newsState.data)
  const read = ctx.spy(homeState.readNews)
  const unread = news.filter((item) => !read.includes(String(item.id)))

  if (unread.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => home.markNewsRead(ctx, news.map((item) => String(item.id)))}
      className="text-xs text-green-400 hover:text-green-300"
    >
      {unread.length} новых · отметить прочитанными
    </button>
  )
}, "MarkRead")

export default function Page() {
  return (
    <div className='flex flex-col gap-8 w-full h-full'>
      <HomeHero />
      <HomeBranch />
      <div id="news" className="flex flex-col gap-4 w-full h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="title">
            {translate["index.news"]()}
          </Typography>
          <MarkRead />
        </div>
        <div className="flex flex-col sm:flex-row scrollbar-h-2 overflow-x-auto gap-4 pb-2">
          <NewsList />
        </div>
      </div>
      <div id="last-lands" className="flex flex-col gap-4 h-full w-full">
        <Typography variant="title">
          {translate["index.lands"]()}
        </Typography>
        <LandsListShorted />
      </div>
      <Socials />
    </div>
  )
}
