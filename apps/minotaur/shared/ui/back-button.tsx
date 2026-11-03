import { Button } from "@/shared/ui/button"
import { Icon, type IconName } from "@/shared/ui/icon"
import { translate } from "@/shared/locales/helpers"
import { navigate } from "vike/client/router"

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
      className="min-h-11 h-11 sm:min-h-11 sm:h-11 aspect-square w-11"
    >
      <Icon name={icon} className="size-4 sm:size-5 text-neutral-400" />
    </Button>
  )
}
