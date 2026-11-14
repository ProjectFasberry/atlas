'use client';

import { DrawerContent, DrawerPrimitives, DrawerRoot } from '@repo/ui';
import { reatomComponent } from '@reatom/npm-react';
import { IconX } from '@tabler/icons-react';
import {
  SidebarFolder,
  SidebarFolderContent,
  SidebarFolderLink,
  SidebarFolderTrigger,
  SidebarItem,
  SidebarSeparator,
  useFolderDepth,
  useSidebar,
} from 'fumadocs-ui/components/sidebar/base';
import { createPageTreeRenderer } from 'fumadocs-ui/components/sidebar/page-tree';
import { Sidebar as FumadocsSidebar } from 'fumadocs-ui/layouts/notebook/slots/sidebar';
import { createElement, type ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';
import { m } from '@/paraglide/messages';
import { $locale } from '@/shared/models/locale.model';
import { HeaderControls } from '@/shared/ui/header-controls';

/** Same item look as the fumadocs notebook sidebar, which keeps these wrappers private. */
const ITEM =
  'relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere [&_svg]:size-4 [&_svg]:shrink-0 transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground/80 data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary';

const offset = (depth: number) => `calc(${2 + 3 * depth} * var(--spacing))`;

function TreeItem(props: ComponentProps<typeof SidebarItem>) {
  return <SidebarItem className={ITEM} {...props} />;
}

function TreeFolderTrigger({ className, style, ...props }: ComponentProps<typeof SidebarFolderTrigger>) {
  const depth = useFolderDepth();

  return (
    <SidebarFolderTrigger
      className={cn(ITEM, 'w-full', className)}
      style={{ paddingInlineStart: offset(depth - 1), ...style }}
      {...props}
    />
  );
}

function TreeFolderLink({ className, style, ...props }: ComponentProps<typeof SidebarFolderLink>) {
  const depth = useFolderDepth();

  return (
    <SidebarFolderLink
      className={cn(
        ITEM,
        'w-full',
        depth > 1 &&
          "data-[active=true]:before:content-[''] data-[active=true]:before:absolute data-[active=true]:before:w-px data-[active=true]:before:inset-y-2.5 data-[active=true]:before:start-2.5 data-[active=true]:before:bg-fd-primary",
        className,
      )}
      style={{ paddingInlineStart: offset(depth - 1), ...style }}
      {...props}
    />
  );
}

function TreeFolderContent({ className, children, ...props }: ComponentProps<typeof SidebarFolderContent>) {
  const depth = useFolderDepth();

  return (
    <SidebarFolderContent
      className={cn(
        'relative flex flex-col gap-0.5 pt-0.5',
        depth === 1 &&
          "before:absolute before:inset-y-1 before:start-2.5 before:w-px before:bg-fd-border before:content-['']",
        className,
      )}
      {...props}
    >
      {children}
    </SidebarFolderContent>
  );
}

const PageTree = createPageTreeRenderer({
  SidebarFolder,
  SidebarFolderContent: TreeFolderContent,
  SidebarFolderLink: TreeFolderLink,
  SidebarFolderTrigger: TreeFolderTrigger,
  SidebarSeparator,
  SidebarItem: TreeItem,
});

type Props = ComponentProps<typeof FumadocsSidebar>;

/**
 * The fumadocs sidebar on desktop, and the shared bottom sheet on mobile. The
 * built-in right-side drawer is hidden in `global.css`; both the header trigger
 * and the sheet read the same fumadocs sidebar context.
 */
export const WikiSidebar = reatomComponent<Props>(({ ctx, banner, footer, components, ...rest }) => {
  const locale = ctx.spy($locale);
  const { open, setOpen } = useSidebar();
  const bannerNode = typeof banner === 'function' ? createElement(banner, {}) : banner;

  return (
    <>
      <FumadocsSidebar banner={banner} footer={footer} components={components} {...rest} />

      <DrawerRoot open={open} onOpenChange={setOpen}>
        <DrawerContent side="bottom" className="bg-fd-background border-fd-border text-sm">
          <DrawerPrimitives.CloseTrigger
            aria-label={m['sidebar.close']({}, { locale })}
            className="absolute end-2 top-3 inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
          >
            <IconX size={16} stroke={2} aria-hidden />
          </DrawerPrimitives.CloseTrigger>

          <div
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto"
            onClickCapture={(event) => {
              // a link means a route change: close the sheet before the page swaps
              if (event.target instanceof Element && event.target.closest('a[href]')) {
                setOpen(false);
              }
            }}
          >
            {bannerNode}
            <div className="flex flex-col gap-0.5">
              <PageTree {...components} />
            </div>
          </div>
          <div className="shrink-0 border-t border-fd-border pt-3">
            <HeaderControls />
          </div>
        </DrawerContent>
      </DrawerRoot>
    </>
  );
}, 'WikiSidebar');
