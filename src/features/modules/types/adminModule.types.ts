import type { RichBlock } from '@/features/modules/types/richText.types';
import type { LocalizedRichBody, LocalizedString } from '@/types/localized';

export interface AdminModuleCard {
  id: string;
  card_family_id?: string;
  card_order?: number;
  title: LocalizedString;
  body: LocalizedRichBody;
  previous_practice?: LocalizedString;
  current_practice?: LocalizedString;
}

export type { RichBlock };
