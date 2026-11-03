import type { MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  title?: string;
};

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onSelect: (value: T, event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  testId?: string;
};

/**
 * Apple-like segmented control: a rounded track, equal segments and a thumb that
 * slides to the active one. Used by the theme and language switches, so both look
 * the same.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onSelect,
  className,
  testId,
}: SegmentedProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <fieldset
      data-testid={testId}
      aria-label={label}
      className={cn(
        'relative m-0 inline-grid min-w-0 auto-cols-fr grid-flow-col items-center rounded-full bg-[var(--seg-track)] p-[3px]',
        className,
      )}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-[3px] left-[3px] rounded-full bg-[var(--seg-thumb)] shadow-[var(--seg-shadow)] transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          aria-pressed={option.value === value}
          onClick={(event) => onSelect(option.value, event)}
          className={cn(
            'relative z-10 inline-flex h-7 min-w-10 items-center justify-center gap-1 rounded-full px-1.5 text-[13px] font-semibold transition-colors duration-200',
            option.value === value
              ? 'text-[var(--seg-thumb-foreground)]'
              : 'text-[var(--seg-muted)] hover:text-fd-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}
