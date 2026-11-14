'use client';

import { Menu } from '@ark-ui/react/menu';
import { Portal } from '@ark-ui/react/portal';
import { reatomComponent } from '@reatom/npm-react';
import { IconPencil } from '@tabler/icons-react';
import { Avatar, Chip } from '@repo/ui';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { $userMenuOpen, $viewer, setUserMenuOpen } from '@/shared/models/viewer.model';

/**
 * Signed-in user badge: the head of the player skin, and the trigger of the content menu
 * (ark-ui, the same one the app uses). Readers see nothing here.
 */
export const UserMenu = reatomComponent(({ ctx }) => {
  const viewer = ctx.spy($viewer);
  const open = ctx.spy($userMenuOpen);
  const locale = ctx.spy($locale);
  if (!viewer) return null;

  return (
    <Menu.Root open={open} onOpenChange={({ open: next }) => setUserMenuOpen(ctx, next)}>
      <Menu.Trigger
        data-testid="user-menu"
        aria-label={m['user.menu']({}, { locale })}
        className="
          relative block size-8 rounded-md transition hover:opacity-90
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring
        "
      >
        <Avatar
          url={viewer.avatar}
          nickname={viewer.nickname}
          className="size-8 border-fd-border bg-fd-muted"
        />
      </Menu.Trigger>

      <Portal>
        <Menu.Positioner>
          <Menu.Content
            className="
              z-50 min-w-56 rounded-lg border border-fd-border bg-fd-popover p-1.5
              text-fd-popover-foreground shadow-lg outline-none
              data-[state=open]:animate-in data-[state=open]:fade-in
              data-[state=closed]:animate-out data-[state=closed]:fade-out
            "
          >
            <div className="truncate px-2.5 py-2 text-sm font-semibold">{viewer.nickname}</div>
            {viewer.canEdit ? (
              <Menu.Item
                value="editor"
                closeOnSelect={false}
                className="outline-none"
                aria-label={m['layout.editor-badge']({}, { locale })}
              >
                <Chip data-testid="editor-chip" className="border-fd-primary/30 bg-fd-primary/10 text-fd-primary">
                  <IconPencil size={13} stroke={2} aria-hidden />
                  {m['layout.editor-badge']({}, { locale })}
                </Chip>
              </Menu.Item>
            ) : null}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
});
