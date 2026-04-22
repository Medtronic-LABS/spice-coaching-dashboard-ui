export type SupportedLanguage = 'en' | 'hi' | 'bn';

export const LANGUAGE_OPTIONS: ReadonlyArray<{
  value: SupportedLanguage;
  label: string;
}> = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
] as const;
