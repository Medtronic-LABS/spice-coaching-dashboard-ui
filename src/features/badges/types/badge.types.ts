import type { LocalizedString } from '@/types/localized';

/** Admin badge catalog row from `/admin/badges`. */
export interface AdminBadgeModuleRef {
  id: string;
  title: LocalizedString;
}

export interface AdminBadge {
  id: string;
  name: string;
  domain: string;
  image_storage_path: string;
  module_ids: string[];
  modules: AdminBadgeModuleRef[];
  status: string;
  sequence: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface AdminBadgeListResponse {
  badges: AdminBadge[];
  total: number;
  total_pages: number;
  limit: number;
  offset: number;
}

export interface AdminBadgeWriteBody {
  name: string;
  domain: string;
  image_storage_path: string;
  module_ids: string[];
  sequence?: number | null;
}

export interface AdminBadgeListQuery {
  domain?: string;
  created_by?: string[];
  created_from?: string;
  created_to?: string;
  module_title?: string[];
  q?: string;
  sort_by?: 'created_at' | 'sequence';
  sort_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface BadgeManagementFilters {
  domain: string;
  createdBy: string;
  createdFrom: string;
  createdTo: string;
  moduleTitle: string;
}

export const EMPTY_BADGE_FILTERS: BadgeManagementFilters = {
  domain: '',
  createdBy: '',
  createdFrom: '',
  createdTo: '',
  moduleTitle: '',
};
