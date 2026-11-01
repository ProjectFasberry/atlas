import type { ComponentPropsWithRef } from "react";
import { tv } from "tailwind-variants";
import { usePageContext } from "vike-react/usePageContext";

type LinkProps = ComponentPropsWithRef<"a"> & {
  href: string,
  locale?: string,
  active?: boolean;
}

const normalize = (p: string) => (p || "/").replace(/\/+$/, "") || "/";

export const Link = ({ href, locale, className, active, ...props }: LinkProps) => {
  const pageCtx = usePageContext();
  const pathname = pageCtx.urlPathname ?? "/";

  const finalHref =
    href.startsWith("/")
      ? locale
        ? `/${locale}${href}`
        : href
      : locale
        ? `/${locale}/${href}`
        : `/${href}`;

  const normalizedPathname = normalize(pathname);
  const normalizedHref = normalize(finalHref);

  const isActive =
    active ?? normalizedPathname === normalizedHref;

  const isIdentity = normalizedPathname === normalizedHref;

  return (
    <a
      href={finalHref}
      data-state={isActive ? "active" : "inactive"}
      aria-current={isActive ? "page" : undefined}
      onClick={(e) => {
        if (isIdentity) {
          e.preventDefault();
        }
      }}
      className={tv({
        base: "data-[state=active]:is-active flex items-center gap-2"
      })({ className })}
      {...props}
    />
  );
}
