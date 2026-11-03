import { getStaticImage } from "../lib/helpers"
import { translate } from "@/shared/locales/helpers"

const loaderImage = getStaticImage("gifs/loading.webp")

export const PageLoader = () => {
  return (
    <div className="flex items-center justify-center w-full min-h-[80vh]">
      <img
        src={loaderImage}
        width={96}
        height={96}
        alt={translate["shared.loading"]()}
        loading="eager"
      />
    </div>
  )
}
