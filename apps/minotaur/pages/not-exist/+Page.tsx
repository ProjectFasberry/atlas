import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { getStaticImage } from "@/shared/lib/helpers";
import { useData } from "vike-react/useData";
import { type Data } from "./+data";
import { translate } from "@/shared/locales/helpers";

const allayImage = getStaticImage("gifs/allay.gif")

export default function Page() {
  const title = useData<Data>().title;

  return (
    <div className="flex flex-col items-center h-[80vh] justify-center gap-4 w-full">
      <img src={allayImage} height={102} width={102} alt="Allay" />
      <Typography className="font-semibold text-xl">
        {title}
      </Typography>
      <div className="flex items-center justify-center gap-2">
        <Button
          className='bg-neutral-50 w-fit'
          onClick={() => window.history.back()}
        >
          <Typography color="black" className="font-semibold px-6">
            {translate["shared.error-page.to-back"]()}
          </Typography>
        </Button>
      </div>
    </div>
  )
}
