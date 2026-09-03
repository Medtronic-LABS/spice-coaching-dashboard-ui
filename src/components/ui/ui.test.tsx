import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Badge,
  Banner,
  Button,
  Card,
  Divider,
  EmptyState,
  ErrorState,
  FilterBar,
  FormHelperText,
  FormLabel,
  FieldGroupLabel,
  CardTitle,
  ModalTitle,
  PageSubtitle,
  InfoCard,
  KeyValue,
  ListItem,
  Loader,
  SearchInput,
  SectionHeader,
  Select,
  StatCard,
  StatusBadge,
  Tabs,
  getTabsA11yIds,
} from '@/components/ui';
import { FIELD_LIMITS } from '@/constants/fieldLimits';

describe('ui components', () => {
  it('renders basic UI building blocks', () => {
    render(
      <div>
        <Card variant="elevated">Card</Card>
        <SectionHeader
          title="Header"
          subtitle="Sub"
          action={<Button>Act</Button>}
        />
        <Divider />
        <Badge>Badge</Badge>
        <StatusBadge status="success" label="Okay" />
        <Banner tone="warning">Banner</Banner>
        <InfoCard title="Info" description="Desc" tone="info" />
        <InfoCard title="Info2" description="Desc2" tone="info" />
        <KeyValue label="Key" value="Value" />
        <KeyValue label="Nil" value={null} />
        <ListItem
          title="Row"
          subtitle="Row subtitle"
          rightContent={<Badge>R</Badge>}
        />
        <ListItem title="Row2" />
        <StatCard label="Stat" value="42" change={5} supportingText="Helper" />
        <StatCard
          tone="pink"
          label="Active"
          value={127}
          outOf={155}
          tooltip="Active SKs"
        />
        <StatCard
          label="Last viewed"
          labelClassName="whitespace-nowrap"
          value={'Jul 21 2026\n• 5:34:34 PM'}
          valueClassName="text-sm whitespace-pre-line"
          allowValueWrap
        />
        <Loader label="Loading..." />
        <EmptyState
          title="Empty"
          description="Nothing here"
          action={<Button>CTA</Button>}
        />
        <EmptyState title="Empty2" />
        <ErrorState
          title="Error"
          description="Oops"
          action={<Button>Retry</Button>}
        />
        <ErrorState title="Error2" />
        <InfoCard title="InfoEmpty" description="" tone="info" />
      </div>,
    );

    expect(screen.getByText('Card')).toBeInTheDocument();
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();
    expect(screen.getByText('Badge')).toBeInTheDocument();
    expect(screen.getByText('Okay')).toBeInTheDocument();
    expect(screen.getByText('Banner')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Desc')).toBeInTheDocument();
    expect(screen.getByText('Info2')).toBeInTheDocument();
    expect(screen.getByText('Desc2')).toBeInTheDocument();
    expect(screen.getByText('Key')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Nil')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(screen.getByText('Row subtitle')).toBeInTheDocument();
    expect(screen.getByText('Row2')).toBeInTheDocument();
    expect(screen.getByText('Stat')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Helper')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('127')).toBeInTheDocument();
    expect(screen.getByText('/155')).toBeInTheDocument();
    expect(screen.getByLabelText('Active')).toBeInTheDocument();
    expect(screen.getByText('Last viewed')).toBeInTheDocument();
    expect(screen.getByText(/Jul 21 2026/)).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Empty2')).toBeInTheDocument();
    expect(screen.getByText('No data.')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Oops')).toBeInTheDocument();
    expect(screen.getByText('Error2')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByText('InfoEmpty')).toBeInTheDocument();
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  it('supports controlled inputs (Select, SearchInput)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn<(v: string) => void>();
    const onSearch = vi.fn<(v: string) => void>();

    render(
      <FilterBar>
        <Select
          aria-label="Region"
          value="a"
          onChange={onSelect}
          options={[
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ]}
        />
        <SearchInput
          value=""
          onChange={onSearch}
          placeholder="Search"
          aria-label="Search"
        />
      </FilterBar>,
    );

    await user.click(screen.getByRole('button', { name: 'Region' }));
    await user.click(screen.getByRole('option', { name: 'B' }));
    expect(onSelect).toHaveBeenCalledWith('b');

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'hi' },
    });
    expect(screen.getByTestId('search-input-icon')).toBeInTheDocument();
    expect(onSearch).toHaveBeenCalledWith('hi');
    expect(screen.getByLabelText('Search')).toHaveAttribute(
      'maxLength',
      String(FIELD_LIMITS.searchQuery),
    );
  });

  it('SearchInput defaults aria-label when not provided', () => {
    render(<SearchInput value="" onChange={() => undefined} />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('SearchInput does not force aria-label when aria-labelledby exists', () => {
    render(
      <div>
        <span id="lbl">Label</span>
        <SearchInput
          value=""
          onChange={() => undefined}
          aria-labelledby="lbl"
        />
      </div>,
    );

    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('aria-labelledby', 'lbl');
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('tabs expose stable a11y ids and call onChange', () => {
    expect(getTabsA11yIds('x', 'Summary')).toEqual({
      tabId: 'x-tab-summary',
      panelId: 'x-panel-summary',
    });

    const onChange = vi.fn<(v: string) => void>();
    render(
      <Tabs
        idBase="t"
        items={[
          { label: 'Summary', value: 'summary' },
          { label: 'Details', value: 'details' },
        ]}
        value="summary"
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Details' }));
    expect(onChange).toHaveBeenCalledWith('details');
  });

  it('tabs call onChange when value is not in items and support keyboard navigation', () => {
    const onChange = vi.fn<(v: string) => void>();
    render(
      <Tabs
        idBase="t2"
        items={[
          { label: 'Summary', value: 'summary' },
          { label: 'Details', value: 'details' },
          { label: 'History', value: 'history' },
        ]}
        value="missing"
        onChange={onChange}
      />,
    );

    // effect should normalize to first item
    expect(onChange).toHaveBeenCalledWith('summary');

    const active = screen.getByRole('tab', { name: 'Summary' });
    fireEvent.keyDown(active, { key: 'End' });
    expect(onChange).toHaveBeenCalledWith('history');

    fireEvent.keyDown(active, { key: 'Home' });
    expect(onChange).toHaveBeenCalledWith('summary');

    fireEvent.keyDown(active, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith('details');

    fireEvent.keyDown(active, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith('history');

    fireEvent.keyDown(active, { key: 'Enter' });
  });

  it('module library tabs use compact equal-height capsules', () => {
    render(
      <Tabs
        variant="moduleLibrary"
        idBase="library"
        items={[
          { label: 'Drafts', value: 'drafts' },
          { label: 'Published', value: 'published' },
          { label: 'All', value: 'all' },
        ]}
        value="drafts"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('tablist')).toHaveClass('items-center');
    for (const name of ['Drafts', 'Published', 'All']) {
      expect(screen.getByRole('tab', { name })).toHaveClass(
        'h-8',
        'items-center',
        'px-3',
        'py-0',
        'text-sm',
        'leading-none',
      );
    }
  });

  it('underline tabs are the default section navigation style', () => {
    render(
      <Tabs
        idBase="team"
        items={[
          { label: 'Area Managers', value: 'am' },
          { label: 'POs', value: 'po' },
        ]}
        value="am"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('tablist')).toHaveClass('border-b');
    expect(screen.getByRole('tab', { name: 'Area Managers' })).toHaveClass(
      'border-spice-palette-purple',
      'text-spice-palette-purple',
    );
  });

  it('supports Badge variants and sizes', () => {
    render(
      <div>
        <Badge variant="outline" size="sm">
          Outline
        </Badge>
        <Badge variant="subtle">Subtle</Badge>
      </div>,
    );

    expect(screen.getByText('Outline')).toHaveClass('ring-1', 'text-xs');
    expect(screen.getByText('Subtle')).toHaveClass('ring-1');
  });

  it('supports Button size presets', () => {
    render(
      <div>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="iconSm" aria-label="Refresh">
          R
        </Button>
      </div>,
    );

    expect(screen.getByRole('button', { name: 'Small' })).toHaveClass('h-8');
    expect(screen.getByRole('button', { name: 'Large' })).toHaveClass('h-10');
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveClass(
      'h-8',
      'w-8',
    );
  });

  it('renders StatCard with KPI typography tokens', () => {
    render(
      <StatCard
        tone="purple"
        label="Finished modules"
        value={127}
        outOf={155}
        tooltip="Modules completed"
      />,
    );

    expect(screen.getByText('Finished modules')).toHaveClass(
      'text-[18px]',
      'font-semibold',
      'uppercase',
      'tracking-wider',
      'text-spice-text-muted',
    );
    const valueParagraph = screen.getByText('127').closest('p');
    expect(valueParagraph).toHaveClass(
      'text-[38px]',
      'font-semibold',
      'leading-tight',
      'text-right',
    );
    expect(screen.getByText('127')).toHaveClass('text-spice-palette-purple');
    expect(screen.getByText('/155')).toHaveClass(
      'text-[28px]',
      'font-medium',
      'text-spice-text-muted',
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders FormLabel and FormHelperText with shared typography', () => {
    render(
      <div>
        <FormLabel htmlFor="title" required>
          Title
        </FormLabel>
        <FormHelperText>Helper copy</FormHelperText>
      </div>,
    );

    expect(screen.getByText('Title')).toHaveClass(
      'text-sm',
      'font-semibold',
      'text-spice-text-primary',
    );
    expect(screen.getByText('*')).toHaveClass('text-spice-semantic-error');
    expect(screen.getByText('Helper copy')).toHaveClass(
      'text-xs',
      'text-spice-text-muted',
    );
  });

  it('renders compact FormLabel for filter drawers', () => {
    render(
      <FormLabel htmlFor="status" size="compact">
        Status
      </FormLabel>,
    );

    expect(screen.getByText('Status')).toHaveClass(
      'text-xs',
      'font-semibold',
      'tracking-wide',
      'text-spice-text-medium',
    );
  });

  it('renders shared typography heading components', () => {
    render(
      <div>
        <PageSubtitle>Page helper</PageSubtitle>
        <ModalTitle>Modal heading</ModalTitle>
        <CardTitle>Card heading</CardTitle>
        <FieldGroupLabel>Field group</FieldGroupLabel>
      </div>,
    );

    expect(screen.getByText('Page helper')).toHaveClass(
      'text-sm',
      'text-spice-text-muted',
    );
    expect(screen.getByRole('heading', { name: 'Modal heading' })).toHaveClass(
      'text-lg',
      'font-semibold',
    );
    expect(screen.getByRole('heading', { name: 'Card heading' })).toHaveClass(
      'text-sm',
      'font-semibold',
    );
    expect(screen.getByText('Field group')).toHaveClass(
      'text-xs',
      'uppercase',
      'tracking-wider',
    );
  });
});
