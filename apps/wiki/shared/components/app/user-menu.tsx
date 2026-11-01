'use client';

import { reatomComponent } from '@reatom/npm-react';
import { IconPencil } from '@tabler/icons-react';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { $userMenuOpen, $viewer, toggleUserMenu } from '@/shared/models/viewer.model';

/**
 * Signed-in user badge: the head of the player skin. It is also the trigger of the
 * dropdown that holds the editor chip, so the header stays quiet for readers.
 */
export const UserMenu = reatomComponent(({ ctx }) => {
  const viewer = ctx.spy($viewer);
  const open = ctx.spy($userMenuOpen);
  const locale = ctx.spy($locale);
  if (!viewer) return null;

  return (
    <div className="relative" data-user-menu="">
      <button
        type="button"
        onClick={() => toggleUserMenu(ctx)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={m['user.menu']({}, { locale })}
        className="
          relative flex size-8 items-center justify-center overflow-hidden rounded-full
          bg-fd-muted ring-1 ring-fd-border transition hover:ring-fd-primary
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring
        "
      >
        {viewer.avatar ? (
          <img
            src={viewer.avatar}
            alt=""
            width={32}
            height={32}
            className="size-8 object-cover [image-rendering:pixelated]"
          />
        ) : (
          <span className="text-sm font-semibold uppercase text-fd-muted-foreground">
            {viewer.nickname.slice(0, 1)}
          </span>
        )}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={viewer.nickname}
          className="
            absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border
            border-fd-border bg-fd-popover p-1.5 text-fd-popover-foreground shadow-lg
          "
        >
          <div className="truncate px-2.5 py-2 text-sm font-semibold">{viewer.nickname}</div>
          {viewer.canEdit ? (
            <div className="flex items-center px-1 pb-1">
              <span
                className="
                  inline-flex items-center gap-1.5 rounded-full border border-fd-primary/30
                  bg-fd-primary/10 px-2.5 py-1 text-xs font-medium text-fd-primary
                "
              >
                <IconPencil size={13} stroke={2} aria-hidden />
                {m['layout.editor-badge']({}, { locale })}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
