import { Link } from "@/shared/components/link";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { Typography } from "@/shared/ui/typography";
import { usePageContext } from "vike-solid/usePageContext";

const dirtImage = getStaticObject("minecraft/static", "dirt.webp")

const NotFound = () => {
  return (
    <>
      <Typography class="text-white text-base md:text-xl text-center font-normal">
        {translate["error-page.404"]()}
      </Typography>
      <Link href="/">
        <button
          class="md:w-max mt-6 raised-slot-button text-center text-neutral-800 text-base md:text-xl py-1 px-4 md:px-6"
        >
         {translate["error-page.to-safety-host"]()}
        </button>
      </Link>
    </>
  )
}

const Error = () => {
  return (
    <Link href="/">
      <button
        class="bg-neutral-600 md:w-max mt-6 raised-slot-button text-center text-base md:text-xl py-1 px-4 md:px-6"
      >
        {translate["error-page.to-safety-host"]()}
      </button>
    </Link>
  )
}

export default function Page() {
  const { is404 } = usePageContext();

  return (
    <div
      class="flex min-h-screen justify-center items-center px-8"
      style={{
        "background-image": `url('${dirtImage}')`
      }}
    >
      <div class="flex flex-col items-center gap-y-2">
        <Typography class="text-neutral-400 text-base md:text-xl font-normal">
          {translate["error-page.title"]()}
        </Typography>
        {is404 ? <NotFound /> : <Error />}
      </div>
    </div>
  );
}
