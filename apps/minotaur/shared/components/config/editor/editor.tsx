import { type Editor, useEditorState } from "@tiptap/react"
import type { ReactNode } from "react"
import { Portal } from "@ark-ui/react/portal"
import { tv } from "tailwind-variants"
import { scrollableVariant } from "@/shared/consts/style-variants"
import { reatomComponent } from "@reatom/npm-react"
import { Icon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input"
import { Menu } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu"
import { editorBar, editorBarState, editorSelectors, type EditorUrlPanel } from "./editor.model"
import { translate } from "@/shared/locales/helpers"

const controlVariant = tv({
  base: `
    inline-flex shrink-0 items-center justify-center gap-1 rounded-md px-2 h-7 min-w-7 text-nowrap text-xs font-semibold
    bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100
    data-[state=active]:bg-neutral-600 data-[state=active]:text-neutral-50
    disabled:pointer-events-none disabled:opacity-50
  `
})

type ToolbarButtonProps = {
  label: string
  title?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children?: ReactNode
}

const ToolbarButton = ({ label, title, active, disabled, onClick, children }: ToolbarButtonProps) => (
  <button
    type="button"
    aria-label={label}
    aria-pressed={active}
    title={title ?? label}
    disabled={disabled}
    data-state={active ? "active" : "inactive"}
    // Keep the editor selection alive while a toolbar button is pressed.
    onMouseDown={(event) => event.preventDefault()}
    onClick={onClick}
    className={controlVariant()}
  >
    {children ?? label}
  </button>
)

const ToolbarSeparator = () => <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-neutral-700" />

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

export const EditorMenuBar = reatomComponent<{ editor: Editor }>(({ ctx, editor }) => {
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => editorSelectors(editor)
  })

  const isTable = ctx.spy(editorBarState.isTable);
  const panel = ctx.spy(editorBarState.panel);
  const url = ctx.spy(editorBarState.url);
  const urlError = ctx.spy(editorBarState.urlError);

  const headingFlags = [
    editorState.isHeading1,
    editorState.isHeading2,
    editorState.isHeading3,
    editorState.isHeading4,
    editorState.isHeading5,
    editorState.isHeading6,
  ];
  const headingIndex = headingFlags.indexOf(true);
  const headingLevel = headingIndex === -1 ? null : headingIndex + 1;

  const openUrl = (next: EditorUrlPanel) => editorBar.openUrl(ctx, editor, next);

  return (
    <div className="flex w-full flex-col gap-1 border-b border-neutral-800 pb-1">
      <div
        className={scrollableVariant({
          className: "flex flex-wrap items-center gap-1",
          variant: "hovered"
        })}
      >
        <ToolbarButton label={translate["editor.undo"]()} disabled={!editorState.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Icon name='sprite:arrow-back-up' className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={translate["editor.redo"]()} disabled={!editorState.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Icon name="sprite:arrow-forward-up" className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton label={translate["editor.bold"]()} title={translate["editor.bold-title"]()} active={editorState.isBold} disabled={!editorState.canBold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label={translate["editor.italic"]()} title={translate["editor.italic-title"]()} active={editorState.isItalic} disabled={!editorState.canItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton label={translate["editor.strike"]()} title={translate["editor.strike"]()} active={editorState.isStrike} disabled={!editorState.canStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton label={translate["editor.code"]()} title={translate["editor.code-title"]()} active={editorState.isCode} disabled={!editorState.canCode} onClick={() => editor.chain().focus().toggleCode().run()}>
          {"</>"}
        </ToolbarButton>

        <ToolbarSeparator />

        <Menu.Root>
          <Menu.Trigger asChild>
            <button
              type="button"
              aria-label={translate["editor.paragraph-style"]()}
              data-state={headingLevel ? "active" : "inactive"}
              className={controlVariant()}
            >
              {headingLevel ? `H${headingLevel}` : "P"}
            </button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className={menuVariant.content("min-w-32")}>
                <Menu.Item value="paragraph" className={menuVariant.item()} onClick={() => editor.chain().focus().setParagraph().run()}>
                  {translate["editor.paragraph"]()}
                </Menu.Item>
                {HEADING_LEVELS.map((level) => (
                  <Menu.Item
                    key={level}
                    value={`heading-${level}`}
                    className={menuVariant.item()}
                    onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                  >
                    {translate["editor.heading"]({ level })}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        <ToolbarSeparator />

        <ToolbarButton label={translate["editor.bullet-list"]()} active={editorState.isBulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          {"•—"}
        </ToolbarButton>
        <ToolbarButton label={translate["editor.ordered-list"]()} active={editorState.isOrderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          {"1."}
        </ToolbarButton>
        <ToolbarButton label={translate["editor.blockquote"]()} active={editorState.isBlockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          {"❝"}
        </ToolbarButton>
        <ToolbarButton label={translate["editor.code-block"]()} active={editorState.isCodeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {"{ }"}
        </ToolbarButton>
        <ToolbarButton label={translate["editor.divider"]()} onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          {"—"}
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          label={translate["editor.link"]()}
          title={translate["editor.link"]()}
          active={editorState.isLink || panel === "link"}
          onClick={() => openUrl("link")}
        >
          <Icon name="sprite:link" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={translate["editor.image"]()} active={panel === "image"} onClick={() => openUrl("image")}>
          <Icon name="sprite:picture-in-picture" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label={translate["editor.table"]()} active={isTable} onClick={() => editorBar.toggleTable(ctx)}>
          {"▦"}
        </ToolbarButton>

        <ToolbarSeparator />

        <Menu.Root>
          <Menu.Trigger asChild>
            <button type="button" aria-label={translate["editor.clear-format"]()} className={controlVariant()}>
              <Icon name="sprite:settings" className="size-4" />
            </button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className={menuVariant.content()}>
              <Menu.Item value="clear_marks" className={menuVariant.item()} onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                {translate["editor.remove-format"]()}
              </Menu.Item>
              <Menu.Item value="clear_nodes" className={menuVariant.item()} onClick={() => editor.chain().focus().clearNodes().run()}>
                {translate["editor.reset-blocks"]()}
              </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      </div>

      {panel ? (
        <form
          className="flex flex-wrap items-center gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            editorBar.submitUrl(ctx, editor);
          }}
        >
          <Input
            autoFocus
            value={url}
            onChange={(event) => editorBar.setUrl(ctx, event.target.value)}
            aria-label={panel === "link" ? translate["editor.link-url"]() : translate["editor.image-url"]()}
            placeholder={panel === "link" ? "https://fasberry.su/wiki" : "https://volume.fasberry.fun/..."}
            className="h-8 min-w-48 flex-1 text-sm"
          />
          <ToolbarButton label={translate["editor.apply"]()} onClick={() => editorBar.submitUrl(ctx, editor)}>
            {translate["editor.apply"]()}
          </ToolbarButton>
          {panel === "link" && editorState.isLink ? (
            <ToolbarButton label={translate["editor.remove-link"]()} onClick={() => editorBar.removeLink(ctx, editor)}>
              {translate["editor.remove"]()}
            </ToolbarButton>
          ) : null}
          <ToolbarButton label={translate["editor.close"]()} onClick={() => editorBar.closeUrl(ctx)}>
            {translate["editor.cancel"]()}
          </ToolbarButton>
          {urlError ? <span className="text-[11px] text-red-400">{urlError}</span> : null}
        </form>
      ) : null}

      {isTable ? (
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton label={translate["editor.insert-table"]()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            {translate["editor.insert-table-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.add-column-left"]()} onClick={() => editor.chain().focus().addColumnBefore().run()}>
            {translate["editor.add-column-left-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.add-column-right"]()} onClick={() => editor.chain().focus().addColumnAfter().run()}>
            {translate["editor.add-column-right-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.delete-column"]()} onClick={() => editor.chain().focus().deleteColumn().run()}>
            {translate["editor.delete-column-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.add-row-above"]()} onClick={() => editor.chain().focus().addRowBefore().run()}>
            {translate["editor.add-row-above-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.add-row-below"]()} onClick={() => editor.chain().focus().addRowAfter().run()}>
            {translate["editor.add-row-below-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.delete-row"]()} onClick={() => editor.chain().focus().deleteRow().run()}>
            {translate["editor.delete-row-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.delete-table"]()} onClick={() => editor.chain().focus().deleteTable().run()}>
            {translate["editor.delete-table-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.merge-cells"]()} onClick={() => editor.chain().focus().mergeCells().run()}>
            {translate["editor.merge-cells-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.split-cell"]()} onClick={() => editor.chain().focus().splitCell().run()}>
            {translate["editor.split-cell-action"]()}
          </ToolbarButton>
          <ToolbarButton label={translate["editor.header-row"]()} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
            Header row
          </ToolbarButton>
          <ToolbarButton label={translate["editor.header-column"]()} onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
            Header col
          </ToolbarButton>
        </div>
      ) : null}
    </div>
  )
}, "EditorMenuBar")
