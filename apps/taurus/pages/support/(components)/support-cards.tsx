import { For, Show, type JSX } from "solid-js"
import { Link } from "@/shared/components/link"
import { getStaticObject } from "@/shared/lib/helpers"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { translate } from "@/shared/locales/helpers"
import { copySupportLink, telegramShareLink } from "../(models)/support.model"
import { reatomComponent } from "@/shared/lib/reatom"
import {
  BlockControls, BlockSubtitle, BlockTitle, useBlockHidden
} from "@/shared/components/edit/section-block"

const voteUrl = "https://hotmc.ru/vote-259308"
const voteIcon = getStaticObject("minecraft", "icons/experience_big.webp")
const shareIcon = getStaticObject("minecraft", "icons/bell.webp")
const helpIcon = getStaticObject("minecraft", "icons/book_big.webp")

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

export const ActionButton = (props: { children: JSX.Element; onClick?: () => void; href?: string }) => {
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

/** Intro copy plus the three ways to help the project. */
export const SupportCards = reatomComponent(({ ctx }) => {
  const hidden = useBlockHidden("support-help")

  return (
    <Show when={!hidden()}>
      <header class="flex max-w-3xl flex-col gap-2">
        <Typography class="text-xs uppercase tracking-[0.2em] text-gold">
          {translate["support.eyebrow"]()}
        </Typography>
        <BlockTitle
          id="support-help"
          fallback={translate["support.heading"]()}
          class="text-2xl sm:text-3xl lg:text-4xl"
        />
        <BlockSubtitle
          id="support-help"
          fallback={translate["support.description"]()}
          class="text-sm leading-6 sm:text-base"
        />
        <BlockControls id="support-help" />
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
    </Show>
  )
}, "SupportCards")
