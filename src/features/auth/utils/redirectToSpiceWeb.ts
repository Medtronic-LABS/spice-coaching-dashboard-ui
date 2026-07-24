import { spiceWebLoginUrl } from '@/config/spiceConfig';

export function redirectToSpiceWeb(): void {
  window.location.assign(spiceWebLoginUrl);
}
