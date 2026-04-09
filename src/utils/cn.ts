type ClassValue = string | false | null | undefined;

/**
 * Minimal class name combiner similar to clsx.
 */
export const cn = (...values: ClassValue[]): string =>
  values.filter(Boolean).join(' ');
