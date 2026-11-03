import { Link } from "@/shared/components/config/link/link"
import { createHeaderLinks } from "../models/navigation.model"
import { Icon } from "@/shared/ui/icon";
import { usePageContext } from "vike-react/usePageContext";

export const MobileBottomBar = () => {
  const pageCtx = usePageContext()
  const pathname = pageCtx.urlPathname ?? "/"
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <div
      className="
        fixed flex items-center rounded-t-xl justify-center z-[50] bottom-0 px-4
        border-t border-neutral-800 bg-neutral-900 h-[calc(4rem+env(safe-area-inset-bottom))]
        pb-[env(safe-area-inset-bottom)] w-full
      "
    >
      <div className="flex items-center justify-between w-full gap-1">
        {createHeaderLinks().map(link => (
          <Link
            key={link.title}
            active={isActive(link.href)}
            aria-label={link.label}
            href={link.href}
            className="
              flex flex-col items-center gap-0.5 justify-center truncate min-w-0
              data-[state=inactive]:text-neutral-50 data-[state=active]:text-green-400
            "
          >
            <Icon name={link.icon} className="size-[26px]" />
            <span className="font-semibold text-[13px]">{link.title}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
