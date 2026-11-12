import { getStaticImage } from "@/shared/lib/helpers";
import { type PropsWithChildren } from "react";
import { PageHeaderImage } from "@/shared/ui/header-image";
import { translate } from "@/shared/locales/helpers";

const ratingsImage = getStaticImage("arts/sand-camel.jpg")

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col gap-6 w-full h-full pb-24 sm:pb-20">
      <PageHeaderImage
        img={ratingsImage}
        imgAlign="center"
        className="hidden sm:flex h-[120px]!"
      />
      <div className="flex flex-col gap-4 h-full w-full">
        <h1 className="font-semibold text-3xl">
          {translate["ratings.title"]()}
        </h1>
        {children}
      </div>
    </div>
  )
}
