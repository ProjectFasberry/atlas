import { reatomComponent } from "@reatom/npm-react";
import { atom } from "@reatom/framework";
import { tv, type VariantProps } from "tailwind-variants";
import { landBannerAtom } from "../models/land.model";
import { landEditing, landEditingState } from "../models/edit-land.model";
import { Icon } from "@/shared/ui/icon"
import { translate } from "@/shared/locales/helpers"

const bannerInputAtom = atom<HTMLInputElement | null>(null, "landBannerInput")

const imageBannerVariant = tv({
  base: `select-none w-full h-full object-cover max-w-[144px]`
})

const bannerVariants = tv({
  base: `relative group rounded-lg overflow-hidden bg-neutral-600`,
  variants: {
    variant: {
      default: "w-[144px] h-44",
      small: "w-[86px] h-32",
      xs: "w-8 h-10"
    }
  },
  defaultVariants: {
    variant: "default"
  }
})

type DefaultBannerProps = VariantProps<typeof bannerVariants> & { banner: string | null, className?: string }

export const LandBanner = ({ banner, variant, className }: DefaultBannerProps) => {
  return (
    <div id="banner" className={bannerVariants({ variant, className })}>
      {banner ? (
        <img
          src={banner}
          className={imageBannerVariant()}
          alt="Banner"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full" />
      )}
    </div>
  )
}

export const LandBannerWithEditing = reatomComponent(({ ctx }) => {
  const mode = ctx.spy(landEditingState.mode)
  const currentBanner = ctx.spy(landBannerAtom)
  const removed = ctx.spy(landEditingState.bannerRemoved)
  const pending = ctx.spy(landEditingState.bannerFile)

  const editIsAllow = mode === 1
  const banner = pending?.preview ?? (removed ? null : currentBanner)

  return (
    <div
      id="banner"
      data-mode={editIsAllow ? "edit" : "watch"}
      onClick={() => editIsAllow && ctx.get(bannerInputAtom)?.click()}
      className={bannerVariants({ className: "data-[mode=edit]:cursor-pointer min-w-[144px]" })}
    >
      {banner ? (
        <img
          src={banner}
          className={imageBannerVariant()}
          alt="Banner"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full" />
      )}
      {editIsAllow && !pending && (
        <div className="flex items-center justify-center z-1 absolute inset-0 bg-black/60">
          <Icon name="sprite:color-picker" className="size-[26px]" />
        </div>
      )}
      {editIsAllow && banner && (
        <button
          type="button"
          title={translate["land.remove-banner"]()}
          className="absolute right-1 top-1 z-10 flex size-7 items-center justify-center rounded-lg bg-black/70 text-neutral-200 hover:text-white"
          onClick={(event) => {
            event.stopPropagation()
            landEditing.banner.remove(ctx)
          }}
        >
          <Icon name="sprite:x" className="size-4" />
        </button>
      )}
      <input
        ref={(element) => { bannerInputAtom(ctx, element) }}
        className="hidden"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={false}
        onChange={(e) => landEditing.banner.apply(ctx, e)}
      />
    </div>
  )
}, "LandBannerWithEditing")
