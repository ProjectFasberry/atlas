import { scrollableVariant } from "@/shared/consts/style-variants"
import { BackButton } from "@/shared/ui/back-button"
import { buttonVariants } from "@/shared/ui/button"
import { Link } from "@/shared/components/config/link/link"
import { clsx } from "cnfast"
import { translate } from "@/shared/locales/helpers"

const BADGES = [
  { title: "cart.nav.cart", href: "/store/cart" },
  { title: "cart.nav.orders", href: "/store/cart/orders" },
] as const

export const CartNavigation = () => (
  <div className={scrollableVariant({ className: "flex items-center overflow-x-auto scrollbar-h-2 gap-1 w-full" })}>
    <BackButton href="/store" />
    {BADGES.map((badge) => (
      <Link
        key={badge.href}
        href={badge.href}
        className={clsx(
          buttonVariants({ background: "default", className: "h-10 text-sm text-nowrap font-semibold" }),
          "data-[state=active]:bg-neutral-200 data-[state=active]:text-neutral-950",
        )}
      >
        {translate[badge.title]()}
      </Link>
    ))}
  </div>
)
