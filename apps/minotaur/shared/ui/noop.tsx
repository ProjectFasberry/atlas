import { clsx } from "cnfast"
import { translate } from "../locales/helpers"
import { Typography } from "./typography"

type NoopProps = {
  title?: string,
  className?: string
}

export const Noop = ({
  title = translate["shared.empty"](), className
}: NoopProps) => {
  return (
    <Typography className={clsx("text-sm leading-4", className)} color='gray'>
      {title}
    </Typography>
  )
}
