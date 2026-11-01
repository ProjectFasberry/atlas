import { reatomComponent } from "@reatom/npm-react";
import { tv, type VariantProps } from "tailwind-variants";
import { landBannerAtom } from "../models/land.model";
import { useRef } from "react";
import { bannerEditIsAllowedAtom, landEditing, landEditingState } from "../models/edit-land.model";
import { Icon } from "@/shared/ui/icon"

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
  const ref = useRef<HTMLInputElement | null>(null);

  const currentBanner = ctx.spy(landBannerAtom)
  const newBanner = ctx.spy(landEditingState.personalization.bannerUrl)
  const editIsAllow = ctx.spy(bannerEditIsAllowedAtom)

  return (
    <div
      id="banner"
      data-mode={editIsAllow ? "edit" : "watch"}
      onClick={() => editIsAllow && ref.current?.click()}
      className={bannerVariants({ className: "data-[mode=edit]:cursor-pointer min-w-[144px]" })}
    >
      {editIsAllow ? (
        <div className="flex items-center justify-center z-1 absolute h-full w-full bg-black/60">
          <Icon name="sprite:color-picker" className="size-[26px]" />
        </div>
      ) : (
        currentBanner ? (
          <img
            src={currentBanner}
            className={imageBannerVariant()}
            alt="Banner"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full" />
        )
      )}
      {newBanner && (
        <img
          draggable={false}
          src={newBanner}
          className={imageBannerVariant()}
          alt="Banner"
        />
      )}
      <input
        ref={ref}
        className="hidden"
        type="file"
        multiple={false}
        onChange={(e) => landEditing.banner.apply(ctx, e)}
      />
    </div>
  )
}, "LandBannerWithEditing")
