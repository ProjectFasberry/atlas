import { atom } from "@reatom/framework";
import { reatomComponent } from "@reatom/npm-react";
import { generateJSON, type JSONContent } from "@tiptap/react";
import type { Atom, AtomMut } from "@reatom/framework";
import type { ReactNode } from "react";
import { env } from "@/shared/env";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { Typography } from "@/shared/ui/typography";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { editorExtensions } from "@/shared/components/config/editor/editor.model";
import { EditorMenuBar } from "@/shared/components/config/editor/editor";
import { translate } from "@/shared/locales/helpers"

const CONTENT_LIMIT = 1024;

type NewsFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

export const NewsField = ({ label, value, onChange, placeholder, required }: NewsFieldProps) => (
  <label className="flex w-full flex-col gap-1">
    <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
      {label}
      {required ? <span className="text-red-400"> *</span> : null}
    </span>
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ?? label}
      className="h-9"
    />
  </label>
);

type NewsEditorProps = {
  initValue?: unknown;
  tempContentAtom: AtomMut<string>;
  isValidAtom: Atom<boolean>;
  saveAction: (json: JSONContent) => void;
};

/**
 * Inline editor for the news body. It writes HTML into `tempContentAtom` while
 * typing and only turns it into JSON when the author applies it, so a partially
 * typed document never reaches the model.
 */
export const NewsEditor = reatomComponent<NewsEditorProps>(({ ctx, tempContentAtom, isValidAtom, saveAction, initValue }) => {
  const editor = useEditor({
    extensions: [
      ...editorExtensions,
      CharacterCount,
      Placeholder.configure({ placeholder: translate["panel.type-something"]() }),
    ],
    content: initValue as JSONContent | undefined,
    onUpdate: ({ editor }) => {
      tempContentAtom(ctx, editor.getHTML());
    },
  });

  const { charactersCount, wordsCount } = useEditorState({
    editor,
    selector: (state) => {
      if (state.editor.isDestroyed) return { charactersCount: 0, wordsCount: 0 };

      return {
        charactersCount: state.editor.storage.characterCount.characters(),
        wordsCount: state.editor.storage.characterCount.words(),
      };
    },
  });

  const overLimit = charactersCount > CONTENT_LIMIT;
  const isDisabled = !ctx.spy(isValidAtom) || overLimit;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
          {translate["panel.content-2"]()}<span className="text-red-400"> *</span>
        </span>
        <span className={`text-[11px] ${overLimit ? "text-red-400" : "text-neutral-500"}`}>
          {charactersCount}/{CONTENT_LIMIT} {translate["panel.characters"]()}{wordsCount} {translate["panel.words"]()}</span>
      </div>
      <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-800">
        <EditorMenuBar editor={editor} />
        <EditorContent
          editor={editor}
          className="tiptap min-h-40 w-full bg-neutral-800/40 px-3 py-2 text-base"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-500">
          {overLimit ? translate["panel.the-text-is-too-long-shorten-it"]() : translate["panel.links-lists-and-tables-are-supported"]()}
        </span>
        <Button
          type="button"
          background="white"
          className="h-8 gap-1 text-sm font-semibold"
          disabled={isDisabled}
          onClick={() => {
            const html = ctx.get(tempContentAtom);
            if (!html) return;

            saveAction(generateJSON(html, editorExtensions));
          }}
        >
          <Icon name="sprite:check" className="size-4" />
          {translate["panel.apply"]()}</Button>
      </div>
    </div>
  );
}, "NewsEditor");

const linkErrorAtom = atom(false, "news.imageLinkError");

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

/** Bucket keys are stored as `news/art.webp`; pasted links stay absolute. */
export const resolveVolumeUrl = (value: string) =>
  isAbsoluteUrl(value) ? value : `${env.VITE_VOLUME_URL}/${value}`;

type NewsImagePanelProps = {
  url: string;
  onUrlChange: (value: string) => void;
  onClear: () => void;
  storage: ReactNode;
  loading?: boolean;
};

export const NewsImagePanel = reatomComponent<NewsImagePanelProps>(({ ctx, url, onUrlChange, onClear, storage, loading }) => {
  const linkError = ctx.spy(linkErrorAtom);
  const fullUrl = url ? resolveVolumeUrl(url) : "";

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{translate["panel.image"]()}</span>
        {url ? (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-neutral-400 underline hover:text-red-300"
          >
            {translate["panel.delete"]()}</button>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-800 sm:w-44">
          {url ? (
            <img
              src={fullUrl}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Typography className="px-2 text-center text-[11px] text-neutral-500">
              {loading ? translate["panel.loading"]() : translate["panel.no-image-selected"]()}
            </Typography>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <form
            className="flex items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              const value = String(new FormData(event.currentTarget).get("url") ?? "").trim();

              if (!isAbsoluteUrl(value)) {
                linkErrorAtom(ctx, true);
                return;
              }

              linkErrorAtom(ctx, false);
              onUrlChange(value);
            }}
          >
            <Input
              name="url"
              defaultValue={isAbsoluteUrl(url) ? url : ""}
              placeholder="https://..."
              aria-label={translate["panel.image-link"]()}
              className="h-8 text-sm"
            />
            <Button type="submit" background="default" className="h-8 shrink-0 text-sm font-semibold">
              {translate["panel.apply"]()}</Button>
          </form>
          {linkError ? (
            <span className="text-[11px] text-red-400">{translate["panel.the-link-must-start-with-http-or-https"]()}</span>
          ) : null}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">{translate["panel.or"]()}</span>
            {storage}
          </div>
        </div>
      </div>
    </div>
  );
}, "NewsImagePanel");
