import { Accordion } from "@ark-ui/solid/accordion";
import { For, type JSX } from "solid-js";
import { Link } from "@/shared/components/link";
import { getStaticObject } from "@/shared/lib/helpers";
import { Typography } from "@/shared/ui/typography";
import { Button } from "@/shared/ui/button";
import { translate } from "@/shared/locales/helpers";
import {
  copySupportLink,
  setSupportFaq,
  supportFaqItems,
  supportState,
  telegramShareLink
} from "../(models)/support.model";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";

const voteUrl = "https://hotmc.ru/vote-259308"
const voteIcon = getStaticObject("minecraft", "icons/experience_big.webp")
const shareIcon = getStaticObject("minecraft", "icons/bell.webp")
const helpIcon = getStaticObject("minecraft", "icons/book_big.webp")
const steveImage = getStaticObject("support", "steve.webp")
const alexImage = getStaticObject("support", "alex.webp")

const whereItems = () => [
  {
    title: translate["support.where.items.hosting.title"](),
    description: translate["support.where.items.hosting.description"]()
  },
  {
    title: translate["support.where.items.development.title"](),
    description: translate["support.where.items.development.description"]()
  },
  {
    title: translate["support.where.items.content.title"](),
    description: translate["support.where.items.content.description"]()
  },
  {
    title: translate["support.where.items.events.title"](),
    description: translate["support.where.items.events.description"]()
  }
]

const SupportCard = (props: {
  icon: string
  title: string
  description: string
  children: JSX.Element
}) => (
  <div class="transparent-achievement-panel flex flex-col gap-3 p-4 sm:p-5">
    <span class="raised-slot flex h-12 w-12 shrink-0 items-center justify-center">
      <img
        src={props.icon}
        alt=""
        width={32}
        height={32}
        loading="lazy"
        draggable={false}
      />
    </span>
    <div class="flex flex-col gap-1">
      <h3 class="text-xl">
        {props.title}
      </h3>
      <Typography color="gray" class="text-sm leading-5">
        {props.description}
      </Typography>
    </div>
    <div class="mt-auto flex flex-col gap-2 pt-1">
      {props.children}
    </div>
  </div>
)

const ActionButton = (props: { children: JSX.Element; onClick?: () => void; href?: string }) => {
  const content = (
    <Button class="w-full justify-center px-4 py-1" onClick={props.onClick}>
      <Typography color="white" class="text-sm sm:text-base">
        {props.children}
      </Typography>
    </Button>
  )

  return props.href
    ? <a href={props.href} target="_blank" rel="noreferrer" class="w-full">{content}</a>
    : <div class="w-full">{content}</div>
}

export const SupportContent = reatomComponent(({ ctx }) => {
  const faqOpen = useAtomAccessor(supportState.faqOpen)

  return (
    <div class="responsive mx-auto flex flex-col gap-10 sm:gap-12">
      <header class="flex max-w-3xl flex-col gap-2">
        <Typography class="text-xs uppercase tracking-[0.2em] text-gold">
          {translate["support.eyebrow"]()}
        </Typography>
        <h2 class="text-2xl sm:text-3xl lg:text-4xl">
          {translate["support.heading"]()}
        </h2>
        <Typography color="gray" class="text-sm leading-6 sm:text-base">
          {translate["support.description"]()}
        </Typography>
      </header>
      <div class="grid gap-3 lg:grid-cols-3">
        <SupportCard
          icon={voteIcon}
          title={translate["support.cards.vote.title"]()}
          description={translate["support.cards.vote.description"]()}
        >
          <ActionButton href={voteUrl}>
            {translate["support.cards.vote.action"]()}
          </ActionButton>
          <Typography color="gray" class="text-center text-xs">
            {translate["support.cards.vote.note"]()}
          </Typography>
        </SupportCard>
        <SupportCard
          icon={shareIcon}
          title={translate["support.cards.share.title"]()}
          description={translate["support.cards.share.description"]()}
        >
          <ActionButton href={telegramShareLink()}>
            {translate["support.cards.share.telegram"]()}
          </ActionButton>
          <ActionButton onClick={() => copySupportLink(ctx)}>
            {translate["support.cards.share.copy"]()}
          </ActionButton>
        </SupportCard>
        <SupportCard
          icon={helpIcon}
          title={translate["support.cards.help.title"]()}
          description={translate["support.cards.help.description"]()}
        >
          <Link href="/discord" class="text-sm text-green-400 underline-offset-4 hover:underline">
            {translate["support.cards.help.bugs"]()} →
          </Link>
          <Link href="/discord" class="text-sm text-green-400 underline-offset-4 hover:underline">
            {translate["support.cards.help.ideas"]()} →
          </Link>
          <a
            href="https://wiki.fasberry.fun/"
            target="_blank"
            rel="noreferrer"
            class="text-sm text-green-400 underline-offset-4 hover:underline"
          >
            {translate["support.cards.help.content"]()} →
          </a>
        </SupportCard>
      </div>
      <div class="grid gap-3 lg:grid-cols-[1.1fr_.9fr]">
        <section class="transparent-achievement-panel flex flex-col gap-4 p-4 sm:p-5">
          <h3 class="text-xl sm:text-2xl">
            {translate["support.where.title"]()}
          </h3>
          <div class="flex flex-col gap-4">
            <For each={whereItems()}>
              {(item, index) => (
                <div class="flex items-start gap-3">
                  <span class="raised-slot flex h-8 w-8 shrink-0 items-center justify-center text-xs text-neutral-800">
                    {String(index() + 1).padStart(2, "0")}
                  </span>
                  <div class="flex min-w-0 flex-col gap-0.5">
                    <Typography color="white" class="text-sm sm:text-base">
                      {item.title}
                    </Typography>
                    <Typography color="gray" class="text-xs leading-5 sm:text-sm">
                      {item.description}
                    </Typography>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
        <section class="transparent-achievement-panel flex flex-col gap-4 p-4 sm:p-5">
          <h3 class="text-xl sm:text-2xl">
            {translate["support.thanks.title"]()}
          </h3>
          <div class="flex items-center gap-2">
            <img
              src={steveImage}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              draggable={false}
              class="h-20 w-20 border border-neutral-700 bg-neutral-900 object-cover p-1"
            />
            <img
              src={alexImage}
              alt=""
              width={96}
              height={96}
              loading="lazy"
              draggable={false}
              class="h-20 w-20 border border-neutral-700 bg-neutral-900 object-cover p-1"
            />
            <Typography color="gray" class="text-xs leading-5">
              {translate["support.thanks.caption"]()}
            </Typography>
          </div>
          <Typography color="gray" class="text-sm leading-6">
            {translate["support.thanks.description"]()}
          </Typography>
          <div class="mt-auto">
            <ActionButton href="/discord">
              {translate["support.thanks.action"]()}
            </ActionButton>
          </div>
        </section>
      </div>
      <section class="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-10">
        <div class="flex flex-col gap-1">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl">
            {translate["support.faq.title"]()}
          </h2>
          <Typography color="gray" class="text-sm sm:text-base">
            {translate["support.faq.subtitle"]()}
          </Typography>
        </div>
        <Accordion.Root
          multiple
          collapsible
          value={faqOpen()}
          onValueChange={(details) => setSupportFaq(ctx, details.value)}
          class="flex w-full flex-col gap-2"
        >
          <For each={supportFaqItems()}>
            {(item) => (
              <Accordion.Item value={item.value} class="transparent-achievement-panel">
                <Accordion.ItemTrigger class="flex w-full cursor-pointer items-center justify-between gap-4 p-3 text-left sm:p-4">
                  <Typography color="white" class="text-sm sm:text-base">
                    {item.question}
                  </Typography>
                  <Accordion.ItemIndicator class="shrink-0 text-lg text-green-400 transition-transform duration-200 data-[state=open]:rotate-45">
                    +
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent class="px-3 pb-3 sm:px-4 sm:pb-4">
                  <Typography color="gray" class="text-xs leading-5 sm:text-sm sm:leading-6">
                    {item.answer}
                  </Typography>
                </Accordion.ItemContent>
              </Accordion.Item>
            )}
          </For>
        </Accordion.Root>
      </section>
      <section class="transparent-achievement-panel flex flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:p-5">
        <div class="flex flex-col gap-1">
          <h2 class="text-xl">
            {translate["support.cta.title"]()}
          </h2>
          <Typography color="gray" class="text-sm">
            {translate["support.cta.description"]()}
          </Typography>
        </div>
        <div class="flex w-full gap-2 sm:w-auto">
          <Link href="/discord" class="flex-1 sm:flex-none">
            <Button class="w-full px-5 py-1">
              <Typography color="white" class="text-sm sm:text-base">
                {translate["support.cta.discord"]()}
              </Typography>
            </Button>
          </Link>
          <Link href="/telegram" class="flex-1 sm:flex-none">
            <Button class="w-full px-5 py-1">
              <Typography color="white" class="text-sm sm:text-base">
                {translate["support.cta.telegram"]()}
              </Typography>
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}, "SupportContent")
