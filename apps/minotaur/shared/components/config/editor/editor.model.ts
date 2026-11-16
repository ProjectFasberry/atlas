import { TableKit } from '@tiptap/extension-table'
import { TextStyleKit } from "@tiptap/extension-text-style"
import Image from '@tiptap/extension-image'
import StarterKit from "@tiptap/starter-kit"
import { env } from '@/shared/env';
import { action, atom, withAssign } from '@reatom/framework';
import type { Editor, EditorStateSnapshot } from '@tiptap/react';

const DEFAULT_SELECTORS = {
  isBold: false,
  canBold: false,
  isItalic: false,
  canItalic: false,
  isStrike: false,
  canStrike: false,
  isCode: false,
  canCode: false,
  canClearMarks: false,
  isParagraph: false,
  isHeading1: false,
  isHeading2: false,
  isHeading3: false,
  isHeading4: false,
  isHeading5: false,
  isHeading6: false,
  isBulletList: false,
  isOrderedList: false,
  isCodeBlock: false,
  isBlockquote: false,
  canUndo: false,
  canRedo: false,
  isLink: false,
};

/**
 * Hosts allowed in links and images. Project domains are always allowed with
 * any subdomain (`fasberry.su`, `volume.fasberry.fun`, ...), so the public site
 * links used in news keep working.
 */
export const ALLOWED_DOMAINS = [
  "fasberry.fun",
  "fasberry.su",
  "google.com",
  "github.com",
  "stackoverflow.com",
  "wikipedia.org",
  "mozilla.org",
  "apple.com",
  "amazon.com",
  "linkedin.com",
  "discord.gg",
  "t.me",
  "youtube.com",
  "youtu.be",
  "twitch.tv",
  "vk.com",
];

const domainPattern = ALLOWED_DOMAINS.map((domain) => domain.replace(/\./g, "\\.")).join("|");

const ALLOWED_HOSTNAME_RE = new RegExp(`^(?:[a-z0-9-]+\\.)*(?:${domainPattern})$`, "i");

export function isHostnameAllowed(rawHostname: string) {
  if (!rawHostname || typeof rawHostname !== "string") return false;

  return ALLOWED_HOSTNAME_RE.test(rawHostname.trim().toLowerCase());
}

type UriOptions = {
  defaultProtocol?: string;
  protocols?: string[];
  defaultValidate?: (url: string) => boolean;
};

const BLOCKED_PROTOCOLS = ["ftp", "file", "mailto"];

export function isAllowedUri(rawUrl: string, options: UriOptions = {}) {
  const defaultProtocol = options.defaultProtocol ?? "https";
  const protocols = options.protocols ?? ["http", "https"];

  try {
    const parsed = rawUrl.includes(":") ? new URL(rawUrl) : new URL(`${defaultProtocol}://${rawUrl}`);

    if (options.defaultValidate && !options.defaultValidate(parsed.href)) return false;

    const protocol = parsed.protocol.replace(":", "");
    if (BLOCKED_PROTOCOLS.includes(protocol)) return false;
    if (!protocols.includes(protocol)) return false;

    return isHostnameAllowed(parsed.hostname);
  } catch {
    return false;
  }
}

export type LinkValidation =
  | { ok: true; url: string }
  | { ok: false; reason: "empty" | "invalid" | "protocol" | "domain" };

export const LINK_ERROR_MESSAGES: Record<Exclude<LinkValidation, { ok: true }>["reason"], string> = {
  empty: "Введите ссылку",
  invalid: "Не удалось разобрать ссылку",
  protocol: "Разрешены только http и https",
  domain: "Домен не входит в список разрешённых",
};

/** Adds `https://` when the scheme is missing and validates the result. */
export function validateLinkUrl(raw: string): LinkValidation {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "empty" };

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, reason: "invalid" };
  }

  const protocol = parsed.protocol.replace(":", "");
  if (BLOCKED_PROTOCOLS.includes(protocol) || !["http", "https"].includes(protocol)) {
    return { ok: false, reason: "protocol" };
  }

  if (!isHostnameAllowed(parsed.hostname)) return { ok: false, reason: "domain" };

  return { ok: true, url: parsed.href };
}

/**
 * Applies a link to the current selection. With an empty selection the URL is
 * inserted as its own linked text, which is what authors expect from a toolbar
 * button.
 */
export function applyLink(editor: Editor, raw: string): LinkValidation {
  const result = validateLinkUrl(raw);
  if (!result.ok) return result;

  if (editor.state.selection.empty) {
    editor
      .chain()
      .focus()
      .insertContent({ type: "text", text: result.url, marks: [{ type: "link", attrs: { href: result.url } }] })
      .run();

    return result;
  }

  editor.chain().focus().extendMarkRange("link").setLink({ href: result.url }).run();

  return result;
}

/** Removes the link mark from the whole link under the cursor, not one character. */
export function removeLink(editor: Editor) {
  return editor.chain().focus().extendMarkRange("link").unsetLink().run();
}

/** Fresh instances: Tiptap binds an extension to its editor, so tests and each
 * editor get their own copy. */
export const createEditorExtensions = () => [
  TextStyleKit,
  Image.configure({
    resize: {
      enabled: true,
      directions: ["top", "bottom", "left", "right"],
      minWidth: 50,
      minHeight: 50,
      alwaysPreserveAspectRatio: true,
    },
  }),
  TableKit.configure({
    table: { resizable: true },
  }),
  StarterKit.configure({
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["http", "https"],
      isAllowedUri: (url, ctx) =>
        isAllowedUri(url, {
          defaultProtocol: ctx.defaultProtocol,
          protocols: ctx.protocols.map((protocol) =>
            typeof protocol === "string" ? protocol : protocol.scheme,
          ),
          defaultValidate: ctx.defaultValidate,
        }),
      shouldAutoLink: (url) => isAllowedUri(url),
    },
  }),
];

export const editorExtensions = createEditorExtensions();

export type EditorUrlPanel = "link" | "image";

export const editorBarState = atom(null, "editorBarState").pipe(
  withAssign((_, name) => ({
    isTable: atom(false, `${name}.isTable`),
    panel: atom<Nullable<EditorUrlPanel>>(null, `${name}.panel`),
    url: atom("", `${name}.url`),
    urlError: atom<Nullable<string>>(null, `${name}.urlError`),
  })),
);

export const editorBar = atom(null, "bar").pipe(
  withAssign((_, name) => ({
    toggleTable: action((ctx) => editorBarState.isTable(ctx, (state) => !state), `${name}.toggleTable`),
    openUrl: action((ctx, editor: Editor, panel: EditorUrlPanel) => {
      const href = panel === "link" ? (editor.getAttributes("link").href ?? "") : "";

      editorBarState.url(ctx, typeof href === "string" ? href : "");
      editorBarState.urlError(ctx, null);
      editorBarState.panel(ctx, panel);
    }, `${name}.openUrl`),
    closeUrl: action((ctx) => {
      editorBarState.panel(ctx, null);
      editorBarState.urlError(ctx, null);
    }, `${name}.closeUrl`),
    setUrl: action((ctx, value: string) => {
      editorBarState.url(ctx, value);
      editorBarState.urlError(ctx, null);
    }, `${name}.setUrl`),
    submitUrl: action((ctx, editor: Editor) => {
      const panel = ctx.get(editorBarState.panel);
      if (!panel) return;

      const raw = ctx.get(editorBarState.url);

      if (panel === "image") {
        const result = validateLinkUrl(raw);
        if (!result.ok) {
          editorBarState.urlError(ctx, LINK_ERROR_MESSAGES[result.reason]);
          return;
        }

        editor.chain().focus().setImage({ src: result.url }).run();
        editorBarState.panel(ctx, null);
        return;
      }

      const result = applyLink(editor, raw);
      if (!result.ok) {
        editorBarState.urlError(ctx, LINK_ERROR_MESSAGES[result.reason]);
        return;
      }

      editorBarState.panel(ctx, null);
    }, `${name}.submitUrl`),
    removeLink: action((ctx, editor: Editor) => {
      removeLink(editor);
      editorBarState.panel(ctx, null);
    }, `${name}.removeLink`),
  })),
);

export const editorSelectors = (editor: EditorStateSnapshot<Editor>["editor"]) => {
  if (!editor || editor.isDestroyed) {
    return DEFAULT_SELECTORS;
  }

  return {
    isBold: editor.isActive('bold') ?? false,
    canBold: editor.can().chain().toggleBold().run() ?? false,
    isItalic: editor.isActive('italic') ?? false,
    canItalic: editor.can().chain().toggleItalic().run() ?? false,
    isStrike: editor.isActive('strike') ?? false,
    canStrike: editor.can().chain().toggleStrike().run() ?? false,
    isCode: editor.isActive('code') ?? false,
    canCode: editor.can().chain().toggleCode().run() ?? false,
    canClearMarks: editor.can().chain().unsetAllMarks().run() ?? false,
    isParagraph: editor.isActive('paragraph') ?? false,
    isHeading1: editor.isActive('heading', { level: 1 }) ?? false,
    isHeading2: editor.isActive('heading', { level: 2 }) ?? false,
    isHeading3: editor.isActive('heading', { level: 3 }) ?? false,
    isHeading4: editor.isActive('heading', { level: 4 }) ?? false,
    isHeading5: editor.isActive('heading', { level: 5 }) ?? false,
    isHeading6: editor.isActive('heading', { level: 6 }) ?? false,
    isBulletList: editor.isActive('bulletList') ?? false,
    isOrderedList: editor.isActive('orderedList') ?? false,
    isCodeBlock: editor.isActive('codeBlock') ?? false,
    isBlockquote: editor.isActive('blockquote') ?? false,
    canUndo: editor.can().chain().undo().run() ?? false,
    canRedo: editor.can().chain().redo().run() ?? false,
    isLink: editor.isActive('link'),
  }
}

export const EDITOR_DEFAULT_CONTENT = `<h2>Контент</h2>`;

export const editorState = atom(null, "editorState").pipe(
  withAssign((_, name) => ({
    content: atom(EDITOR_DEFAULT_CONTENT, `${name}.content`)
  }))
)
