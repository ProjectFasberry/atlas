import { Link } from "@/shared/components/config/link/link";
import { translate } from "@/shared/locales/helpers";
import { Auth } from "./auth";
import { AuthBrand } from "./auth-brand";

export const AuthScreen = () => {
  return (
    <div className="grid w-full max-w-6xl gap-6 px-4 py-6 sm:py-10 lg:grid-cols-[1fr_28rem] lg:gap-10 lg:items-start">
      <AuthBrand />

      <div className="flex flex-col gap-4 w-full max-w-lg mx-auto lg:mx-0 lg:justify-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {translate["auth.page.heading"]()}
          </h1>
          <p className="text-sm text-neutral-400">
            {translate["auth.page.subheading"]()}
          </p>
        </div>

        <Auth />

        <p className="text-sm text-neutral-500">
          {translate["auth.page.support"]()}:{" "}
          <Link
            href="/report"
            className="text-green-400 duration-150 hover:text-green-300"
          >
            {translate["shared.footer.about.report"]()}
          </Link>
        </p>
      </div>
    </div>
  )
}
