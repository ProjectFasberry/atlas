import { Button } from "@/shared/ui/button"
import { Icon, type IconName } from "@/shared/ui/icon"
import { navigate } from "vike/client/router"
import { translate } from "@/shared/locales/helpers"

type BackButtonProps = {
  event?: "history" | "custom",
  href?: string,
  onClick?: () => void,
  icon?: IconName
}

export const BackButton = ({
  href,
  onClick,
  event = "history",
  icon = "sprite:arrow-left"
}: BackButtonProps) => {
  const handle = () => {
    if (event === 'history') {
      return href ? navigate(href) : window.history.back()
    }

    if (!onClick) {
      console.warn(BackButton.name, "Event is not defined")
      return;
    }

    onClick()
  }

  return (
    <Button
      background="default"
      aria-label={translate["shared.back"]()}
      onClick={handle}
      size="headless"
      className="size-10 shrink-0"
    >
      <Icon name={icon} className="size-4 text-neutral-400" />
    </Button>
  )
}
