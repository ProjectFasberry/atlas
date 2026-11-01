import { Button } from "@/shared/ui/button"
import { Icon, type IconName } from "@/shared/ui/icon"
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
      onClick={handle}
      size="headless"
      className="min-h-8 h-8 sm:min-h-8 sm:h-8 aspect-square w-fit"
    >
      <Icon name={icon} className="size-4 sm:size-5 text-neutral-400" />
    </Button>
  )
}
