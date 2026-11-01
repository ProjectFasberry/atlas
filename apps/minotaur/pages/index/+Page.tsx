import { Typography } from "@/shared/ui/typography";
import { Intro } from "@/shared/components/app/intro/components/intro";
import { EventsList } from "@/shared/components/app/events/components/events";
import { reatomComponent } from "@reatom/npm-react";
import { LandsListShorted } from "@/shared/components/app/lands/components/lands-list";
import { NewsList } from "@/shared/components/app/news/components/news-main-list";
import { translate } from "@/shared/locales/helpers";
import { Icon } from "@/shared/ui/icon"
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

export default function Page() {
  return (
    <div className='flex flex-col gap-8 w-full h-full'>
      <Intro />
      <div id="news" className="flex flex-col gap-4 w-full h-full">
        <Typography variant="title">
          {translate["index.news"]()}
        </Typography>
        <div className="flex flex-col sm:flex-row scrollbar-h-2 overflow-x-auto gap-4 pb-2">
          <NewsList />
        </div>
      </div>
      <div id="last-events" className="flex flex-col gap-4 w-full h-full">
        <Typography variant="title">
          {translate["index.latest-events"]()}
        </Typography>
        <div className="flex flex-col sm:flex-row scrollbar-h-2 overflow-x-auto gap-4 pb-2">
          <EventsList />
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
