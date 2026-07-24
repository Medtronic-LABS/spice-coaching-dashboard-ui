import { fireEvent, render, screen } from '@testing-library/react';
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

  it('supports controlled inputs (Select, SearchInput)', () => {
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

    fireEvent.change(screen.getByLabelText('Region'), {
      target: { value: 'b' },
    });
    expect(screen.getByLabelText('Region')).toHaveClass('select-arrow');
    expect(onSelect).toHaveBeenCalledWith('b');

    fireEvent.change(screen.getByLabelText('Search'), {
      target: { value: 'hi' },
    });
    expect(onSearch).toHaveBeenCalledWith('hi');
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
});
