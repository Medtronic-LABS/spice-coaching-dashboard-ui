import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BadgeSequenceReorderList } from '@/features/badges/components/BadgeSequenceReorderList';
import type { AdminBadge } from '@/features/badges/types/badge.types';
import { renderWithProviders } from '@/test-utils/render';

function buildBadge(
  overrides: Partial<AdminBadge> & Pick<AdminBadge, 'id' | 'name'>,
): AdminBadge {
  return {
    domain: 'hypertension',
    image_storage_path: 'microcoaching-uploads/badges/test.png',
    module_ids: [],
    modules: [],
    status: 'active',
    sequence: 1,
    created_at: '2026-04-01T10:00:00.000Z',
    updated_at: '2026-04-10T12:00:00.000Z',
    created_by: 'alice',
    updated_by: 'alice',
    ...overrides,
  };
}

function setElementWidth(
  element: HTMLElement,
  clientWidth: number,
  scrollWidth: number,
) {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
  });
}

describe('BadgeSequenceReorderList', () => {
  it('renders table-style column headers', () => {
    renderWithProviders(
      <BadgeSequenceReorderList
        badges={[
          buildBadge({
            id: 'b1',
            name: 'Milestone A',
            module_ids: ['m1'],
            modules: [
              { id: 'm1', title: { en: 'Module One', bn: 'Module One' } },
            ],
          }),
        ]}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByText('Seq')).toBeInTheDocument();
    expect(screen.getByText('Milestone')).toBeInTheDocument();
    expect(screen.getByText('Modules')).toBeInTheDocument();
  });

  it('uses TruncatedText for modules and reveals the full list on hover', () => {
    renderWithProviders(
      <BadgeSequenceReorderList
        badges={[
          buildBadge({
            id: 'b-many',
            name: 'Many Modules',
            module_ids: ['m1', 'm2', 'm3'],
            modules: [
              { id: 'm1', title: { en: 'Alpha', bn: 'Alpha' } },
              { id: 'm2', title: { en: 'Beta', bn: 'Beta' } },
              { id: 'm3', title: { en: 'Gamma', bn: 'Gamma' } },
            ],
          }),
        ]}
        onReorder={vi.fn()}
      />,
    );

    const label = 'Alpha, Beta, Gamma';
    const content = screen.getByText(label);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 120, 360);

    fireEvent.mouseEnter(trigger!);
    expect(screen.getByRole('tooltip')).toHaveTextContent(label);
  });

  it('does not show a tooltip when the module list fits', () => {
    renderWithProviders(
      <BadgeSequenceReorderList
        badges={[
          buildBadge({
            id: 'b-two',
            name: 'Two Modules',
            module_ids: ['m1', 'm2'],
            modules: [
              { id: 'm1', title: { en: 'Alpha', bn: 'Alpha' } },
              { id: 'm2', title: { en: 'Beta', bn: 'Beta' } },
            ],
          }),
        ]}
        onReorder={vi.fn()}
      />,
    );

    const label = 'Alpha, Beta';
    const content = screen.getByText(label);
    const trigger = content.parentElement;
    expect(trigger).not.toBeNull();
    setElementWidth(content, 120, 120);

    fireEvent.mouseEnter(trigger!);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders an em dash when a milestone has no modules', () => {
    renderWithProviders(
      <BadgeSequenceReorderList
        badges={[buildBadge({ id: 'b-empty', name: 'Empty Modules' })]}
        onReorder={vi.fn()}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
