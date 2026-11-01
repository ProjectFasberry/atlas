import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

type SidebarLinksProps = {
  back: string;
  account: string;
};

const LINKS = [
  {
    key: 'back',
    href: 'https://fasberry.fun',
    icon: IconArrowLeft,
  },
  {
    key: 'account',
    href: 'https://app.fasberry.fun',
    icon: IconArrowRight,
  },
] as const;

/** Shortcuts above the page tree: back to the site and straight to the account. */
export function SidebarLinks({ back, account }: SidebarLinksProps) {
  const labels = { back, account };

  return (
    <div className="mb-3 flex flex-col gap-1.5">
      {LINKS.map(({ key, href, icon: Icon }) => (
        <a
          key={key}
          href={href}
          className="flex items-center gap-2 rounded-lg border border-fd-border px-2.5 py-1.5 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground"
        >
          <Icon size={16} stroke={2} aria-hidden />
          <span className="truncate">{labels[key]}</span>
        </a>
      ))}
    </div>
  );
}
