import { action, atom, reatomAsync } from '@reatom/framework';
import { withAssign } from '@reatom/primitives';
import { http } from '@/lib/http';

export type PageDraft = {
  slug: string;
  title: string;
  description: string;
  html: string;
};

/** Message keys, translated at render time so the model stays locale-agnostic. */
export type SaveError = 'no-permission' | 'save-error' | 'upload-error';

export type SaveState = {
  status: 'idle' | 'saving' | 'error';
  error: SaveError | null;
};

/**
 * Article editor state: `null` means read mode.
 * The scope atoms below derive flags from this nullable state.
 */
export const $saveState = atom<SaveState>({ status: 'idle', error: null }, 'wikiPage.saveState');

export const $draft = atom<PageDraft | null>(null, 'wikiPage.draft').pipe(
  withAssign((_, name) => ({
    start: action((ctx, draft: PageDraft) => {
      $draft(ctx, draft);
      $saveState(ctx, { status: 'idle', error: null });
    }, `${name}.start`),

    patch: action((ctx, patch: Partial<PageDraft>) => {
      const draft = ctx.get($draft);
      if (!draft) return;

      $draft(ctx, { ...draft, ...patch });
    }, `${name}.patch`),

    cancel: action((ctx) => {
      $draft(ctx, null);
      $saveState(ctx, { status: 'idle', error: null });
    }, `${name}.cancel`),

    fail: action((ctx, error: SaveError) => {
      $saveState(ctx, { status: 'error', error });
    }, `${name}.fail`),

    save: reatomAsync(
      async (ctx, html: string) => {
        const draft = ctx.get($draft);
        if (!draft) return false;

        $saveState(ctx, { status: 'saving', error: null });

        const response = await http
          .put(`/api/wiki/pages${draft.slug ? `/${draft.slug}` : ''}`, {
            json: { title: draft.title, description: draft.description, html },
            throwHttpErrors: false,
          })
          .catch(() => null);

        if (!response?.ok) {
          throw new Error(response?.status === 403 ? 'no-permission' : 'save-error');
        }

        return true;
      },
      {
        name: `${name}.save`,
        onFulfill: (ctx, saved) => {
          if (!saved) return;

          $draft(ctx, null);
          $saveState(ctx, { status: 'idle', error: null });
          // the title may have changed and it is also shown in the sidebar
          window.location.reload();
        },
        onReject: (ctx, error) => {
          $saveState(ctx, {
            status: 'error',
            error:
              error instanceof Error && error.message === 'no-permission'
                ? 'no-permission'
                : 'save-error',
          });
        },
      },
    ),
  })),
);

export const $isEditing = atom((ctx) => ctx.spy($draft) !== null, 'wikiPage.isEditing');

/** Uploads an image for the editor: returns the URL from `/api/images/<id>`. */
export async function uploadImage(file: File) {
  const body = new FormData();
  body.append('file', file);

  const data = await http
    .post('/api/wiki/upload', { body })
    .json<{ url: string }>()
    .catch(() => {
      throw new Error('upload-error');
    });

  return data.url;
}
