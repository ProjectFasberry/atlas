import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { playerSLPState } from "../../player/models/player-seems-like.model";
import { SettingsContentWrapper } from "./ui";
import { Switch } from "@/shared/ui/switch";
import { translate } from "@/shared/locales/helpers";
import { balanceState } from "../../wallet/models/balance.model";
import {
  appearanceState,
  isStoreView,
  STORE_VIEWS,
  type StoreView,
} from "../models/settings-appearance.model";
import { Icon, type IconName } from "@/shared/ui/icon";
import { clsx } from "cnfast";

const SettingsToggle = ({
  id, title, description, checked, onChange,
}: {
  id: string
  title: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) => {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-lg leading-5 font-semibold">{title}</label>
        <Typography color="gray" className="text-sm">{description}</Typography>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={({ checked }) => onChange(checked)} />
    </div>
  )
}

const ReduceMotionSetting = reatomComponent(({ ctx }) => {
  return (
    <SettingsToggle
      id="appearance-reduce-motion"
      title={translate["settings.appearance.sections.reduce-motion.title"]()}
      description={translate["settings.appearance.sections.reduce-motion.description"]()}
      checked={ctx.spy(appearanceState.reduceMotion)}
      onChange={(checked) => appearanceState.reduceMotion(ctx, checked)}
    />
  )
}, "ReduceMotionSetting")

const SoundsSetting = reatomComponent(({ ctx }) => {
  return (
    <SettingsToggle
      id="appearance-sounds"
      title={translate["settings.appearance.sections.sounds.title"]()}
      description={translate["settings.appearance.sections.sounds.description"]()}
      checked={ctx.spy(appearanceState.soundsEnabled)}
      onChange={(checked) => appearanceState.soundsEnabled(ctx, checked)}
    />
  )
}, "SoundsSetting")

const HideHeaderBalanceSetting = reatomComponent(({ ctx }) => {
  return (
    <SettingsToggle
      id="appearance-hide-header-balance"
      title={translate["settings.appearance.sections.hide-header-balance.title"]()}
      description={translate["settings.appearance.sections.hide-header-balance.description"]()}
      checked={ctx.spy(appearanceState.hideHeaderBalance)}
      onChange={(checked) => appearanceState.hideHeaderBalance(ctx, checked)}
    />
  )
}, "HideHeaderBalanceSetting")

const StaticSkinSetting = reatomComponent(({ ctx }) => {
  return (
    <SettingsToggle
      id="appearance-static-skin"
      title={translate["settings.appearance.sections.static-skin.title"]()}
      description={translate["settings.appearance.sections.static-skin.description"]()}
      checked={ctx.spy(appearanceState.staticSkin)}
      onChange={(checked) => appearanceState.staticSkin(ctx, checked)}
    />
  )
}, "StaticSkinSetting")

const STORE_VIEW_ICONS: Record<StoreView, IconName> = {
  grid: "sprite:category",
  list: "sprite:menu-2",
}

const STORE_VIEW_LABELS: Record<StoreView, "settings.appearance.sections.store-view.grid"
  | "settings.appearance.sections.store-view.list"> = {
  grid: "settings.appearance.sections.store-view.grid",
  list: "settings.appearance.sections.store-view.list",
}

const StoreViewSetting = reatomComponent(({ ctx }) => {
  const current = ctx.spy(appearanceState.storeView)

  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Typography className="text-lg leading-5 font-semibold">
          {translate["settings.appearance.sections.store-view.title"]()}
        </Typography>
        <Typography color="gray" className="text-sm">
          {translate["settings.appearance.sections.store-view.description"]()}
        </Typography>
      </div>
      <div className="flex shrink-0 items-center gap-1 rounded-xl bg-neutral-800 p-1">
        {STORE_VIEWS.map((view) => {
          const isActive = current === view

          return (
            <button
              key={view}
              type="button"
              aria-pressed={isActive}
              onClick={() => appearanceState.storeView(ctx, isStoreView(view) ? view : "grid")}
              className={clsx(
                "flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold duration-150",
                isActive
                  ? "bg-neutral-50 text-neutral-950"
                  : "text-neutral-300 hover:bg-neutral-700",
              )}
            >
              <Icon name={STORE_VIEW_ICONS[view]} className="size-4" />
              {translate[STORE_VIEW_LABELS[view]]()}
            </button>
          )
        })}
      </div>
    </div>
  )
}, "StoreViewSetting")

const SeemsLikeVisibility = reatomComponent(({ ctx }) => {
  return (
    <SettingsToggle
      id="appearance-seems-like"
      title={translate["settings.appearance.sections.seems-like-players.title"]()}
      description={translate["settings.appearance.sections.seems-like-players.description"]()}
      checked={ctx.spy(playerSLPState.settings.isShow)}
      onChange={(checked) => playerSLPState.settings.isShow.toggle(ctx, checked)}
    />
  )
}, "SeemsLikeVisibility")

const BalanceSettings = reatomComponent(({ ctx }) => {
  return (
    <SettingsToggle
      id="appearance-balance-animation"
      title={translate["player.balance.settings.variants.animation"]()}
      description={translate["settings.appearance.sections.balance-animation.description"]()}
      checked={ctx.spy(balanceState.settings.animateBalance)}
      onChange={(checked) => balanceState.settings.animateBalance(ctx, checked)}
    />
  )
}, "BalanceSettings")

export const SettingsAppearance = () => {
  return (
    <SettingsContentWrapper title={translate["settings.appearance.personalization"]()}>
      <div className="flex flex-col gap-8 w-full h-full">
        <StoreViewSetting />
        <StaticSkinSetting />
        <HideHeaderBalanceSetting />
        <ReduceMotionSetting />
        <SoundsSetting />
        <SeemsLikeVisibility />
        <BalanceSettings />
      </div>
    </SettingsContentWrapper>
  )
}
