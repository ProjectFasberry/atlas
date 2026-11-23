import { mergeProps, splitProps, type JSX } from "solid-js";
import { tv, type VariantProps } from "tailwind-variants";

const buttonVariants = tv({
  base: `inline-flex px-4 py-2 cursor-pointer items-center justify-center
    disabled:select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70 button
  `
});

type ButtonProps = JSX.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>

export const Button = (props: ButtonProps) => {
  const merged = mergeProps({ }, props);
  const [local, rest] = splitProps(merged, ["class","children"]);

  return (
    <button
      class={buttonVariants({ className: local.class })}
      {...rest}
    >
      {local.children}
    </button>
  );
};
