import { locales } from "@/paraglide/runtime"
import { EditorMenuBar } from "@/shared/components/config/editor/editor"
import { EDITOR_DEFAULT_CONTENT, editorExtensions, editorState } from "@/shared/components/config/editor/editor.model"
import { Link } from "@/shared/components/config/link/link"
import { translate } from "@/shared/locales/helpers"
import { Typography } from "@/shared/ui/typography"
import { reatomComponent } from "@reatom/npm-react"
import { EditorContent, useEditor } from "@tiptap/react"
import { usePageContext } from "vike-react/usePageContext"

const EditorTest = reatomComponent(({ ctx }) => {
  const editor = useEditor({
    extensions: editorExtensions,
    content: EDITOR_DEFAULT_CONTENT,
    onUpdate: ({ editor }) => {
      let value = editor.getHTML();
      editorState.content(ctx, value)
    },
  })

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <EditorMenuBar editor={editor} />
      <EditorContent editor={editor} />
      <button onClick={() => console.log(editor.getJSON())}>
        get JSON
      </button>
    </div>
  )
}, "EditorPreview")

export default function Page() {
  const pageCtx = usePageContext()

  return (
    <>
      <Typography>
        {translate["shared.change-lang.title"]()}
      </Typography>
      <div className="flex flex-col w-full gap-1">
        {locales.map((locale) => (
          <Link
            key={locale}
            locale={locale}
            href={pageCtx.urlPathname}
            data-state={pageCtx.locale === locale}
            className="data-[state=true]:bg-neutral-600 data-[state=false]:bg-neutral-800 rounded-lg px-2 py-1"
          >
            {locale.toUpperCase()}
          </Link>
        ))}
      </div>
      <div className="bg-neutral-900 rounded-xl">
        <EditorTest />
      </div>
    </>
  )
}
