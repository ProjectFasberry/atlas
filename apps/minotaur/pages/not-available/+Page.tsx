import { Link } from "@/shared/components/config/link/link";
import { getStaticImage } from "@/shared/lib/helpers";
import { Button } from "@/shared/ui/button";
import { Typography } from "@/shared/ui/typography";
import { Icon } from "@/shared/ui/icon"
import { translate } from "@/shared/locales/helpers";

const Back = () => {
  return (
    <Link href="/">
      <Button className="gap-2 md:w-max bg-neutral-50 text-neutral-950">
        <Typography className='text-center font-semibold'>
          {translate["shared.error-page.to-back"]()}
        </Typography>
        <Icon name="sprite:arrow-up" className="size-4" />
      </Button>
    </Link>
  )
}

export default function Page() {
  return (
    <div className="flex flex-col h-[80vh] justify-center items-center gap-4">
      <div className="w-full lg:w-2/3 h-72 lg:h-96 rounded-xl overflow-hidden">
        <img
          src={getStaticImage("images/backrooms-art.webp")}
          fetchPriority="high"
          alt=""
          className="object-cover w-full h-full"
          draggable={false}
        />
      </div>
      <Typography className="text-xl lg:text-2xl text-center font-semibold">
        {translate["shared.error-page.not-available"]()}
      </Typography>
      <div className="flex items-center justify-center gap-2">
        <a href="https://status.fasberry.fun" target="_blank" rel="noopener noreferrer">
          <Button className="gap-2 md:w-max bg-neutral-800 text-neutral-50">
            <Typography className='text-center font-semibold'>
              {translate["shared.error-page.check-status"]()}
            </Typography>
          </Button>
        </a>
        <Back />
      </div>
    </div>
  )
}
