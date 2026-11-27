import { mergeProps, splitProps, type JSX } from 'solid-js';
import { tv, type VariantProps } from 'tailwind-variants';

const overlayVariants = tv({
  base: `block absolute right-0 left-0 bg-gradient-to-tr from-black/80 to-transparent h-full`,
  variants: {
    variant: {
      default: "to-75%",
      over: "to-90%",
      mini: "to-20%",
      screen: "top-0 right-0 left-0 z-10 bg-black/30 min-h-screen"
    }
  },
  defaultVariants: {
    variant: "default"
  }
});

type OverlayVariantsProps = JSX.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof overlayVariants>

export const Overlay = (props: OverlayVariantsProps) => {
  const merged = mergeProps({ variant: "default" }, props);
  const [local, rest] = splitProps(merged, ['variant', 'class']);

  return (
    <div
      class={overlayVariants({
        variant: local.variant as OverlayVariantsProps["variant"],
        className: local.class
      })}
      {...rest}
    />
  );
};
