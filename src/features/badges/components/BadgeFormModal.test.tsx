import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

import {
  BadgeFormModal,
  type BadgeFormState,
} from '@/features/badges/components/BadgeFormModal';
import type { PublishedModuleOption } from '@/features/badges/components/BadgeModuleMultiSelect';
import { renderWithProviders } from '@/test-utils/render';

const ALL_MODULES: PublishedModuleOption[] = [
  { id: 'm-htn', title: 'HTN Referral Thresholds', domain: 'htn' },
  { id: 'm-fbs', title: 'FBS vs RBS — Timing Rules', domain: 'diabetes' },
  {
    id: 'm-clinic',
    title: 'Community Clinic Referral Protocol',
    domain: 'htn',
  },
];

const baseForm: BadgeFormState = {
  name: 'Safe Motherhood Champion',
  moduleIds: ['m-htn', 'm-clinic'],
  imageStoragePath: 'badges/safe.png',
  imageObjectName: 'badges/safe.png',
  imagePreviewUrl: '',
  imageChanged: false,
  imagePendingUpload: false,
};

function renderModal(
  overrides: Partial<ComponentProps<typeof BadgeFormModal>> = {},
) {
  return renderWithProviders(
    <BadgeFormModal
      open
      mode="view"
      form={baseForm}
      imageResetKey="view-safe"
      formError=""
      isSaving={false}
      pickerModules={ALL_MODULES}
      modulesLoading={false}
      moduleSearchQuery=""
      onModuleSearchChange={vi.fn()}
      modulesHasMore
      onModulesLoadMore={vi.fn()}
      onFormChange={vi.fn()}
      onClose={vi.fn()}
      onSubmit={vi.fn()}
      onEditFromView={vi.fn()}
      onFormError={vi.fn()}
      {...overrides}
    />,
  );
}

describe('BadgeFormModal', () => {
  it('in view mode shows only selected modules and hides search', () => {
    renderModal({ mode: 'view' });

    expect(
      screen.getByRole('heading', { name: 'View milestone' }),
    ).toBeInTheDocument();
    expect(screen.getByText('HTN Referral Thresholds')).toBeInTheDocument();
    expect(
      screen.getByText('Community Clinic Referral Protocol'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('FBS vs RBS — Timing Rules'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('searchbox', { name: 'Search published modules' }),
    ).not.toBeInTheDocument();

    const checked = screen.getAllByRole('checkbox');
    expect(checked).toHaveLength(2);
    expect(checked.every((box) => (box as HTMLInputElement).checked)).toBe(
      true,
    );
  });

  it('in edit mode shows all picker modules and search', () => {
    renderModal({ mode: 'edit' });

    expect(
      screen.getByRole('heading', { name: 'Edit milestone' }),
    ).toBeInTheDocument();
    expect(screen.getByText('HTN Referral Thresholds')).toBeInTheDocument();
    expect(screen.getByText('FBS vs RBS — Timing Rules')).toBeInTheDocument();
    expect(
      screen.getByText('Community Clinic Referral Protocol'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('searchbox', { name: 'Search published modules' }),
    ).toBeInTheDocument();
  });
});
