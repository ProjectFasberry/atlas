import { getStaticImage } from "@/shared/lib/helpers";
import { type PropsWithChildren } from "react";
import { PageHeaderImage } from "@/shared/ui/header-image";
import { BackButton } from "@/shared/ui/back-button";
import { Link } from "@/shared/components/config/link/link";
import { usePageContext } from "vike-react/usePageContext";
import { translate } from "@/shared/locales/helpers";
import { getRatingTypeLabel, getServerLabel } from "@/shared/components/app/ratings/labels";

const ratingsImage = getStaticImage("arts/sand-camel.jpg")

const RatingsHeader = () => {
  const pageCtx = usePageContext();
  const server = pageCtx.routeParams.server as string | undefined;
  const type = pageCtx.routeParams.type as string | undefined;
  const isList = !!server && !!type;

  if (!isList) {
    return (
      <h1 className="font-semibold text-3xl">
        {translate["ratings.title"]()}
      </h1>
    )
  }

  return (
    <div className="flex items-center gap-3 min-w-0">
      <BackButton href="/ratings" />
      <div className="flex flex-col min-w-0">
        <nav className="text-xs text-neutral-500 truncate">
          <Link href="/ratings" className="duration-150 hover:text-neutral-300">
            {translate["ratings.title"]()}
          </Link>
          <span className="mx-1">/</span>
          <span>{getServerLabel(server)}</span>
        </nav>
        <h1 className="font-semibold text-2xl sm:text-3xl truncate">
          {getRatingTypeLabel(type)}
        </h1>
      </div>
    </div>
  )
}

export default function Layout({ children }: PropsWithChildren) {
  const pageCtx = usePageContext();
  const isList = !!pageCtx.routeParams.server && !!pageCtx.routeParams.type;

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-24 sm:pb-20">
      <PageHeaderImage
        img={ratingsImage}
        imgAlign="center"
        className={isList ? "hidden sm:flex h-[120px]!" : undefined}
      />
      <div className="flex flex-col gap-4 h-full w-full">
        <RatingsHeader />
        {children}
      </div>
    </div>
  )
}
