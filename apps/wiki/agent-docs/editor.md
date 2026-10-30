# Editor

There is a single client component - `shared/components/wiki/wiki-page.tsx`. There is no separate editing
page: edits happen in place on the article, and the state lives in the Reatom model
`shared/models/wiki-page.model.ts`.

## State

`shared/models/wiki-page.model.ts`:

- `$draft: PageDraft | null` - `null` means read mode; actions are `start`, `patch`, `cancel`,
  `fail`, `save`.
- `$saveState` - `{ status: 'idle' | 'saving' | 'error', error }`.
- `$isEditing` - a derived flag (`$draft !== null`).
- `uploadImage(file)` - `POST /api/wiki/upload`, returns `/api/images/<id>`.

`$draft.save` is a `reatomAsync`: it takes the HTML from TipTap, sends `PUT` to
`/api/wiki/pages[/<slug>]`, and on success closes the draft and calls `window.location.reload()`
(the title may have changed and it is also used in the sidebar and in `<title>`). 403 ->
"No permission to edit", anything else -> "Could not save the page".

## Component

`WikiPage` is a `reatomComponent`; props: `slug`, `title`, `description`, `html`, `markdownUrl`,
`canEdit`, `icon`.

Read mode: `DocsTitle` with the icon, `DocsDescription`, an "Edit" button (only when `canEdit`),
`MarkdownCopyButton` and the article HTML inside `DocsBody` via `dangerouslySetInnerHTML`.

Edit mode: inline title and description fields, a sticky toolbar (`top-16`) and `EditorContent`
in a card, and at the bottom an error, a hint and the "Cancel" / "Save" buttons.

Toolbar: undo/redo, bold, italic, strikethrough, code, h2, h3, lists, quote, link, image,
table (3x3 insert and delete). The link is asked for via `window.prompt`; an empty string removes
the link. An image is a hidden `<input type=file>` (png/jpeg/webp/gif), after upload it is
inserted with `setImage({ src, alt: file.name })`.

Extensions: `StarterKit` (h2/h3 headings only, `link.openOnClick: false`),
`Image` (`allowBase64: false`), `TableKit`.

## API

`PUT /api/wiki/pages/[[...slug]]`
- no editor -> 403; no such page -> 404; no `html` -> 400;
- `title` is required, up to 200 characters, `description` is trimmed to 500;
- `savePage` sanitizes the HTML (`sanitize-html`), rebuilds markdown (turndown), writes
  `pages` + `revisions`, then calls `revalidatePath`.

`POST /api/wiki/upload`
- images from the MIME allowlist only, up to 8 MB, otherwise 415/413;
- id = `randomUUID()` + extension, the bytes go into `images`, the response is `{ url }`.

## Sanitizing

`lib/html.ts`, `sanitizeContent`: a tag allowlist (paragraphs, h2-h4, inline formatting, code/pre,
blockquote, lists, links, img, hr, figure, tables, sup/sub). Attributes are only `href/title/
target/rel` on links and `src/alt/width/height/loading` on images, schemes are `http/https/mailto/tel`.
External links get `target="_blank"` and `rel="noopener noreferrer"`.

`withHeadingIds` adds `id` to headings (TipTap does not set them), disambiguates duplicates with
`-1`, `-2` suffixes and builds the `toc` for `DocsPage`.

## Limitations

- There is no revision rollback in the UI, only the `revisions` table.
- Pages cannot be created or deleted: the set of slugs is defined by the database (seed / sync).
- Saving reloads the page - that is how the sidebar and the title get updated.
