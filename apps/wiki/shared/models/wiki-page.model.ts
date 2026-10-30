import { action, atom, reatomAsync } from '@reatom/framework';
import { withAssign } from '@reatom/primitives';
import ky from 'ky';

export type PageDraft = {
  slug: string;
  title: string;
  description: string;
  html: string;
};

export type SaveState = {
  status: 'idle' | 'saving' | 'error';
  error: string | null;
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

    fail: action((ctx, message: string) => {
      $saveState(ctx, { status: 'error', error: message });
    }, `${name}.fail`),

    save: reatomAsync(
      async (ctx, html: string) => {
        const draft = ctx.get($draft);
        if (!draft) return false;

        $saveState(ctx, { status: 'saving', error: null });

        const response = await ky
          .put(`/api/wiki/pages${draft.slug ? `/${draft.slug}` : ''}`, {
            json: { title: draft.title, description: draft.description, html },
            throwHttpErrors: false,
          })
          .catch(() => null);

        if (!response?.ok) {
          throw new Error(
            response?.status === 403
              ? 'Нет прав на редактирование'
              : 'Не удалось сохранить страницу',
          );
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
            error: error instanceof Error ? error.message : 'Не удалось сохранить страницу',
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

  const data = await ky
    .post('/api/wiki/upload', { body })
    .json<{ url: string }>()
    .catch(() => {
      throw new Error('Не удалось загрузить картинку');
    });

  return data.url;
}
