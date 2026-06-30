export type SupportedLanguage = 'en' | 'bn';

export const LANGUAGE_OPTIONS: ReadonlyArray<{
  value: SupportedLanguage;
  label: string;
}> = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'বাংলা' },
] as const;
