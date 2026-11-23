import { Show, createEffect } from "solid-js"

type EditableTextProps = {
  value: string
  onInput: (value: string) => void
  multiline?: boolean
  class?: string
  placeholder?: string
}

const base = `w-full border border-dashed border-green-400/45 bg-black/40 px-1 text-inherit
  outline-none placeholder:text-neutral-400 focus:border-green-400`

/**
 * A text field that keeps the surrounding typography, used only in edit mode.
 * Empty text is meaningful: the site hides a description panel when it is empty.
 */
export const EditableText = (props: EditableTextProps) => (
  <Show
    when={props.multiline}
    fallback={
      <input
        type="text"
        value={props.value}
        placeholder={props.placeholder}
        onInput={(event) => props.onInput(event.currentTarget.value)}
        class={`${base} ${props.class ?? ""}`}
      />
    }
  >
    <MultilineField {...props} />
  </Show>
)

/**
 * `value` on a hydrated `<textarea>` is not applied when the SSR attribute is
 * present, so the property is synced explicitly.
 */
const MultilineField = (props: EditableTextProps) => {
  let element: HTMLTextAreaElement | undefined

  createEffect(() => {
    const value = props.value
    if (element && element.value !== value) element.value = value
  })

  return (
    <textarea
      ref={element}
      placeholder={props.placeholder}
      rows={Math.min(10, Math.max(2, Math.ceil((props.value.length || 1) / 70)))}
      onInput={(event) => props.onInput(event.currentTarget.value)}
      class={`${base} resize-y leading-inherit ${props.class ?? ""}`}
    />
  )
}
