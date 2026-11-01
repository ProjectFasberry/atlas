type ClassValue = string | false | null | undefined;

/** Joins class names, skips empty values. Not a merger: later classes win by CSS order. */
export const cn = (...values: ClassValue[]) => values.filter(Boolean).join(' ');
