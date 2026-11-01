import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { navigate } from "vike/client/router"
import { translate } from "@/shared/locales/helpers"

export const TopUpButton = () => {
  return (
    <div className="flex grow justify-end h-full items-center">
      <Button className="self-end" background="default" onClick={() => navigate("/store/cart/topup")}>
        <Typography className="text-neutral-50 font-semibold">
          {translate["store.topup.button"]()}
        </Typography>
      </Button>
    </div>
  )
}