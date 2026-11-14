'use client';

import { reatomComponent } from '@reatom/npm-react';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBlockquote,
  IconBold,
  IconCheck,
  IconCode,
  IconDeviceFloppy,
  IconH2,
  IconH3,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconPencil,
  IconPhotoPlus,
  IconStrikethrough,
  IconTable,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  DocsBody,
  DocsDescription,
  DocsTitle,
  MarkdownCopyButton,
} from 'fumadocs-ui/layouts/notebook/page';
import { type ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { m } from '@/paraglide/messages';
import { ArticleHtml } from '@/shared/components/wiki/article-html';
import { $locale } from '@/shared/models/locale.model';
import { $draft, $saveState, uploadImage } from '@/shared/models/wiki-page.model';

type Props = {
  server: string;
  slug: string;
  title: string;
  description: string;
  html: string;
  /** The Russian original: the editor always writes to it, never to a translation. */
  editSource: { title: string; description: string; html: string };
  markdownUrl: string;
  canEdit: boolean;
  icon?: ReactNode;
};

const extensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false },
  }),
  Image.configure({ allowBase64: false }),
  TableKit,
];

/**
 * Article with in-place editing: the state lives in the Reatom model,
 * the "Edit" button turns the title, description and body into a form.
 */
export const WikiPage = reatomComponent<Props>(({ ctx, ...props }) => {
  const locale = ctx.spy($locale);
  const t = (
    translate: (inputs: Record<string, never>, options: { locale: typeof locale }) => string,
  ) => translate({}, { locale });

  const errorText = {
    'no-permission': t(m['editor.no-permission']),
    'save-error': t(m['editor.save-error']),
    'upload-error': t(m['editor.upload-error']),
  } as const;
  const { server, slug, title, description, html, markdownUrl, canEdit, icon, editSource } = props;

  const stored = ctx.spy($draft);
  // the draft atom outlives navigation: ignore a draft that belongs to another page
  const draft = stored?.server === server && stored.slug === slug ? stored : null;
  const saveState = ctx.spy($saveState);
  const editing = draft !== null;
  const fileInput = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions,
    content: html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'wiki-editor-content',
      },
    },
  });

  function startEdit() {
    editor?.commands.setContent(editSource.html);
    $draft.start(ctx, { server, slug, ...editSource });
  }

  function cancelEdit() {
    editor?.commands.setContent(html);
    $draft.cancel(ctx);
  }

  async function insertImage(file: File) {
    try {
      const url = await uploadImage(file);
      editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      $draft.fail(ctx, 'upload-error');
    }
  }

  function setLink() {
    if (!editor) return;

    const previous = editor.getAttributes('link').href || 'https://';
    const href = window.prompt(t(m['editor.link-prompt']), previous);
    if (href === null) return;

    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
  }

  return (
    <>
      {editing ? (
        <input
          data-testid="page-title"
          value={draft.title}
          onChange={(event) => $draft.patch(ctx, { title: event.target.value })}
          aria-label={t(m['editor.title-label'])}
          className="mb-2 w-full rounded-lg border bg-fd-card px-3 py-2 text-[1.75em] font-semibold leading-tight outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        />
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <DocsTitle>
            <span className="inline-flex items-center gap-2.5">
              {icon ? <span className="shrink-0 text-fd-primary">{icon}</span> : null}
              {title}
            </span>
          </DocsTitle>
          {canEdit ? (
            <button
              type="button"
              data-testid="edit-page"
              onClick={startEdit}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              <IconPencil size={14} stroke={1.75} aria-hidden />
              {t(m['editor.edit'])}
            </button>
          ) : null}
        </div>
      )}

      {editing ? (
        <input
          data-testid="page-description"
          value={draft.description}
          onChange={(event) => $draft.patch(ctx, { description: event.target.value })}
          aria-label={t(m['editor.description-label'])}
          placeholder={t(m['editor.description-placeholder'])}
          className="mb-4 w-full rounded-lg border bg-fd-card px-3 py-2 text-sm text-fd-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        />
      ) : description ? (
        <DocsDescription className="mb-0">{description}</DocsDescription>
      ) : null}

      {editing ? (
        <div className="mt-4 flex flex-col gap-3">
          {locale !== 'ru' ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
              {t(m['editor.source-locale'])}
            </p>
          ) : null}
          <div className="sticky top-20 z-10 flex flex-wrap items-center gap-1 rounded-lg border bg-fd-card/95 p-1.5 backdrop-blur">
            <ToolButton
              label={t(m['editor.undo'])}
              disabled={!editor?.can().chain().focus().undo().run()}
              onClick={() => editor?.chain().focus().undo().run()}
            >
              <IconArrowBackUp />
            </ToolButton>
            <ToolButton
              label={t(m['editor.redo'])}
              disabled={!editor?.can().chain().focus().redo().run()}
              onClick={() => editor?.chain().focus().redo().run()}
            >
              <IconArrowForwardUp />
            </ToolButton>

            <Divider />

            <ToolButton
              label={t(m['editor.bold'])}
              active={editor?.isActive('bold') ?? false}
              onClick={() => editor?.chain().focus().toggleBold().run()}
            >
              <IconBold />
            </ToolButton>
            <ToolButton
              label={t(m['editor.italic'])}
              active={editor?.isActive('italic') ?? false}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
            >
              <IconItalic />
            </ToolButton>
            <ToolButton
              label={t(m['editor.strike'])}
              active={editor?.isActive('strike') ?? false}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
            >
              <IconStrikethrough />
            </ToolButton>
            <ToolButton
              label={t(m['editor.code'])}
              active={editor?.isActive('code') ?? false}
              onClick={() => editor?.chain().focus().toggleCode().run()}
            >
              <IconCode />
            </ToolButton>

            <Divider />

            <ToolButton
              label={t(m['editor.h2'])}
              active={editor?.isActive('heading', { level: 2 }) ?? false}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <IconH2 />
            </ToolButton>
            <ToolButton
              label={t(m['editor.h3'])}
              active={editor?.isActive('heading', { level: 3 }) ?? false}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <IconH3 />
            </ToolButton>
            <ToolButton
              label={t(m['editor.bullet-list'])}
              active={editor?.isActive('bulletList') ?? false}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            >
              <IconList />
            </ToolButton>
            <ToolButton
              label={t(m['editor.ordered-list'])}
              active={editor?.isActive('orderedList') ?? false}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            >
              <IconListNumbers />
            </ToolButton>
            <ToolButton
              label={t(m['editor.quote'])}
              active={editor?.isActive('blockquote') ?? false}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            >
              <IconBlockquote />
            </ToolButton>

            <Divider />

            <ToolButton
              label={t(m['editor.link'])}
              active={editor?.isActive('link') ?? false}
              onClick={setLink}
            >
              <IconLink />
            </ToolButton>
            <ToolButton label={t(m['editor.image'])} onClick={() => fileInput.current?.click()}>
              <IconPhotoPlus />
            </ToolButton>
            <ToolButton
              label={t(m['editor.table'])}
              active={editor?.isActive('table') ?? false}
              onClick={() =>
                editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
            >
              <IconTable />
            </ToolButton>
            <ToolButton
              label={t(m['editor.table-remove'])}
              disabled={!(editor?.isActive('table') ?? false)}
              onClick={() => editor?.chain().focus().deleteTable().run()}
            >
              <IconTrash />
            </ToolButton>

            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void insertImage(file);
              }}
            />
          </div>

          <div data-testid="editor-content" className="rounded-lg border bg-fd-card px-4 py-3">
            <EditorContent editor={editor} />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {saveState.error ? (
              <span className="mr-auto text-xs text-red-500">{errorText[saveState.error]}</span>
            ) : null}
            <span className="mr-auto text-xs text-fd-muted-foreground">{t(m['editor.hint'])}</span>
            <button
              type="button"
              data-testid="cancel-edit"
              onClick={cancelEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              <IconX size={16} stroke={1.75} aria-hidden />
              {t(m['editor.cancel'])}
            </button>
            <button
              type="button"
              data-testid="save-page"
              onClick={() => $draft.save(ctx, editor?.getHTML() ?? editSource.html)}
              disabled={saveState.status === 'saving'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saveState.status === 'saving' ? (
                <IconDeviceFloppy size={16} stroke={1.75} aria-hidden />
              ) : (
                <IconCheck size={16} stroke={1.75} aria-hidden />
              )}
              {saveState.status === 'saving' ? t(m['editor.saving']) : t(m['editor.save'])}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-row flex-wrap items-center gap-2 border-b pb-6">
            <MarkdownCopyButton markdownUrl={markdownUrl} />
          </div>
          <DocsBody>
            <ArticleHtml html={html} />
          </DocsBody>
        </>
      )}
    </>
  );
});

function Divider() {
  return <span className="mx-1 h-5 w-px bg-fd-border" />;
}

function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground disabled:opacity-40',
        active && 'bg-fd-accent text-fd-accent-foreground',
        '[&_svg]:size-4',
      )}
    >
      {children}
    </button>
  );
}
