// Workaround for TS "bundler" moduleResolution + Mantine conditional types export.
// Some TS tooling fails to follow `@mantine/core` re-exports to the provider types,
// even though runtime exports are correct.
declare module '@mantine/core' {
  export { MantineProvider } from '@mantine/core/lib/core/MantineProvider/MantineProvider';
  export type { MantineProviderProps } from '@mantine/core/lib/core/MantineProvider/MantineProvider';

  export { Menu } from '@mantine/core/lib/components/Menu';
  export type { MenuProps } from '@mantine/core/lib/components/Menu';
}
