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
        <ToolbarButton label="Отменить" disabled={!editorState.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Icon name='sprite:arrow-back-up' className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Повторить" disabled={!editorState.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Icon name="sprite:arrow-forward-up" className="size-4" />
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton label="Жирный" title="Жирный (Ctrl+B)" active={editorState.isBold} disabled={!editorState.canBold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton label="Курсив" title="Курсив (Ctrl+I)" active={editorState.isItalic} disabled={!editorState.canItalic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolbarButton>
        <ToolbarButton label="Зачёркнутый" title="Зачёркнутый" active={editorState.isStrike} disabled={!editorState.canStrike} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <span className="line-through">S</span>
        </ToolbarButton>
        <ToolbarButton label="Код" title="Инлайн-код" active={editorState.isCode} disabled={!editorState.canCode} onClick={() => editor.chain().focus().toggleCode().run()}>
          {"</>"}
        </ToolbarButton>

        <ToolbarSeparator />

        <Menu.Root>
          <Menu.Trigger asChild>
            <button
              type="button"
              aria-label="Стиль абзаца"
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
                  Обычный текст
                </Menu.Item>
                {HEADING_LEVELS.map((level) => (
                  <Menu.Item
                    key={level}
                    value={`heading-${level}`}
                    className={menuVariant.item()}
                    onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                  >
                    Заголовок {level}
                  </Menu.Item>
                ))}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>

        <ToolbarSeparator />

        <ToolbarButton label="Маркированный список" active={editorState.isBulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          {"•—"}
        </ToolbarButton>
        <ToolbarButton label="Нумерованный список" active={editorState.isOrderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          {"1."}
        </ToolbarButton>
        <ToolbarButton label="Цитата" active={editorState.isBlockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          {"❝"}
        </ToolbarButton>
        <ToolbarButton label="Блок кода" active={editorState.isCodeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          {"{ }"}
        </ToolbarButton>
        <ToolbarButton label="Разделитель" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          {"—"}
        </ToolbarButton>

        <ToolbarSeparator />

        <ToolbarButton
          label="Ссылка"
          title="Ссылка"
          active={editorState.isLink || panel === "link"}
          onClick={() => openUrl("link")}
        >
          <Icon name="sprite:link" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Изображение" active={panel === "image"} onClick={() => openUrl("image")}>
          <Icon name="sprite:picture-in-picture" className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Таблица" active={isTable} onClick={() => editorBar.toggleTable(ctx)}>
          {"▦"}
        </ToolbarButton>

        <ToolbarSeparator />

        <Menu.Root>
          <Menu.Trigger asChild>
            <button type="button" aria-label="Очистить форматирование" className={controlVariant()}>
              <Icon name="sprite:settings" className="size-4" />
            </button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content className={menuVariant.content()}>
              <Menu.Item value="clear_marks" className={menuVariant.item()} onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                Убрать форматирование
              </Menu.Item>
              <Menu.Item value="clear_nodes" className={menuVariant.item()} onClick={() => editor.chain().focus().clearNodes().run()}>
                Сбросить блоки
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
            aria-label={panel === "link" ? "Адрес ссылки" : "Адрес изображения"}
            placeholder={panel === "link" ? "https://fasberry.su/wiki" : "https://volume.fasberry.fun/..."}
            className="h-8 min-w-48 flex-1 text-sm"
          />
          <ToolbarButton label="Применить" onClick={() => editorBar.submitUrl(ctx, editor)}>
            Применить
          </ToolbarButton>
          {panel === "link" && editorState.isLink ? (
            <ToolbarButton label="Удалить ссылку" onClick={() => editorBar.removeLink(ctx, editor)}>
              Удалить
            </ToolbarButton>
          ) : null}
          <ToolbarButton label="Закрыть" onClick={() => editorBar.closeUrl(ctx)}>
            Отмена
          </ToolbarButton>
          {urlError ? <span className="text-[11px] text-red-400">{urlError}</span> : null}
        </form>
      ) : null}

      {isTable ? (
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton label="Вставить таблицу" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
            + Таблица
          </ToolbarButton>
          <ToolbarButton label="Добавить колонку слева" onClick={() => editor.chain().focus().addColumnBefore().run()}>
            + Колонка ←
          </ToolbarButton>
          <ToolbarButton label="Добавить колонку справа" onClick={() => editor.chain().focus().addColumnAfter().run()}>
            + Колонка →
          </ToolbarButton>
          <ToolbarButton label="Удалить колонку" onClick={() => editor.chain().focus().deleteColumn().run()}>
            − Колонка
          </ToolbarButton>
          <ToolbarButton label="Добавить строку сверху" onClick={() => editor.chain().focus().addRowBefore().run()}>
            + Строка ↑
          </ToolbarButton>
          <ToolbarButton label="Добавить строку снизу" onClick={() => editor.chain().focus().addRowAfter().run()}>
            + Строка ↓
          </ToolbarButton>
          <ToolbarButton label="Удалить строку" onClick={() => editor.chain().focus().deleteRow().run()}>
            − Строка
          </ToolbarButton>
          <ToolbarButton label="Удалить таблицу" onClick={() => editor.chain().focus().deleteTable().run()}>
            − Таблица
          </ToolbarButton>
          <ToolbarButton label="Объединить ячейки" onClick={() => editor.chain().focus().mergeCells().run()}>
            Объединить
          </ToolbarButton>
          <ToolbarButton label="Разъединить ячейку" onClick={() => editor.chain().focus().splitCell().run()}>
            Разъединить
          </ToolbarButton>
          <ToolbarButton label="Заголовок строки" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
            Header row
          </ToolbarButton>
          <ToolbarButton label="Заголовок колонки" onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
            Header col
          </ToolbarButton>
        </div>
      ) : null}
    </div>
  )
}, "EditorMenuBar")
