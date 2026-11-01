import type { ComponentProps } from 'react';
import { tv, type VariantProps } from 'tailwind-variants';

/**
 * Small label pill: the app passes the colour tokens, the kit owns the shape and rhythm.
 */
export const chipVariants = tv({
  base: 'inline-flex items-center gap-1.5 rounded-full border font-medium',
  variants: {
    size: {
      sm: 'px-2 py-0.5 text-[11px]',
      md: 'px-2.5 py-1 text-xs',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

type ChipProps = ComponentProps<'span'> & VariantProps<typeof chipVariants>;

export function Chip({ className, size, ...props }: ChipProps) {
  return <span className={chipVariants({ size, className })} {...props} />;
}
