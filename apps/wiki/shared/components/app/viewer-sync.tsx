'use client';

import { reatomComponent } from '@reatom/npm-react';
import { $viewer, setViewer, type Viewer } from '@/shared/models/viewer.model';

function same(a: Viewer | null, b: Viewer | null) {
  if (a === b) return true;
  if (!a || !b) return false;

  return a.nickname === b.nickname && a.canEdit === b.canEdit && a.avatar === b.avatar;
}

/** Puts the server-resolved viewer into `$viewer`, so the header badge renders from an atom. */
export const ViewerSync = reatomComponent<{ viewer: Viewer | null }>(({ ctx, viewer }) => {
  if (!same(ctx.spy($viewer), viewer)) setViewer(ctx, viewer);
  return null;
});
