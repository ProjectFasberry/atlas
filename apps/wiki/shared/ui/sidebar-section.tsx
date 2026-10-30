'use client';

import type { Separator } from 'fumadocs-core/page-tree';

export function SidebarSection({ item }: { item: Separator }) {
  return (
    <p className="mt-6 mb-1 flex items-center gap-1.5 px-5 text-[11px] font-semibold uppercase tracking-[0.09em] text-fd-muted-foreground/90">
      {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
      {item.name}
    </p>
  );
}
