import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean>
  | ClassValue[];

export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values as unknown[]));
}
