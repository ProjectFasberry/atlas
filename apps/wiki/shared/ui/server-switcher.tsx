'use client';

import { Menu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import { reatomComponent } from '@reatom/npm-react';
import { IconCheck, IconChevronDown, IconWorld } from '@tabler/icons-react';
import { usePathname } from 'next/navigation';
import { pageUrl, resolveRoute } from '@/lib/content/default-server';
import { cn } from '@/lib/utils/cn';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { $servers, $serverSlugs } from '@/shared/models/servers.model';

/**
 * Server switcher: the wiki holds a separate page tree per server, the list comes
 * from the api and is seeded into Reatom by the layout. Switching is a normal
 * navigation to `pageUrl(server, slug)`.
 */
export const ServerSwitcher = reatomComponent(({ ctx }) => {
  const locale = ctx.spy($locale);
  const servers = ctx.spy($servers);
  const slugs = ctx.spy($serverSlugs);

  const pathname = usePathname() ?? '/';
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment));
  const current = resolveRoute(segments, servers);
  const active = servers.find((server) => server.id === current.server);

  if (servers.length < 2) {
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-fd-border bg-fd-secondary/40 px-2 text-sm text-fd-muted-foreground">
        <IconWorld size={15} stroke={1.75} aria-hidden />
        {active?.name ?? current.server}
      </span>
    );
  }

  return (
    <Menu.Root>
      <Menu.Trigger
        data-testid="server-switcher"
        aria-label={m['server.switch']({}, { locale })}
        className="
          inline-flex h-8 items-center gap-1.5 rounded-lg border border-fd-border bg-fd-secondary/40 px-2
          text-sm font-medium transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring
        "
      >
        <IconWorld size={15} stroke={1.75} className="text-fd-muted-foreground" aria-hidden />
        <span className="max-w-24 truncate">{active?.name ?? current.server}</span>
        <IconChevronDown size={13} stroke={2} className="text-fd-muted-foreground" aria-hidden />
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            className="
              z-[60] min-w-48 rounded-lg border border-fd-border bg-fd-popover p-1
              text-fd-popover-foreground shadow-lg outline-none
              data-[state=open]:animate-in data-[state=open]:fade-in
              data-[state=closed]:animate-out data-[state=closed]:fade-out
            "
          >
            {servers.map((server) => {
              const pages = slugs[server.id] ?? [];
              const samePage = pages.includes(current.slug);
              const href = pageUrl(server.id, samePage ? current.slug : '');
              const selected = server.id === current.server;

              return (
                <Menu.Item key={server.id} value={server.id} asChild>
                  <a
                    href={href}
                    data-active={selected}
                    className="
                      flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none
                      transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground
                      data-[active=true]:text-fd-primary
                    "
                  >
                    <IconCheck
                      size={14}
                      stroke={2}
                      className={selected ? 'opacity-100' : 'opacity-0'}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{server.name}</span>
                    {pages.length === 0 ? (
                      <span className="text-[11px] text-fd-muted-foreground">
                        {m['server.empty.badge']({}, { locale })}
                      </span>
                    ) : null}
                  </a>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}, 'ServerSwitcher');
