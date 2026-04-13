import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind-aware class name combiner.
 */
export const cn = (...values: ClassValue[]): string => twMerge(clsx(values));
