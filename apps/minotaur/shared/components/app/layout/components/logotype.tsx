import { Link } from "@/shared/components/config/link/link"
import { translate } from "@/shared/locales/helpers"
import { Typography } from "@/shared/ui/typography"

export const Logotype = () => {
  return (
    <Link
      aria-label={translate["shared.header.logotype"]()}
      href="/"
      className="flex h-full w-fit items-center gap-2"
    >
      <img src="/favicon-full.png" width={40} height={40} alt="" className="min-w-10 w-10 max-h-10 min-h-10" />
      <Typography className="font-[PIXY] self-end text-3xl">
        Fasberry
      </Typography>
    </Link>
  )
}
