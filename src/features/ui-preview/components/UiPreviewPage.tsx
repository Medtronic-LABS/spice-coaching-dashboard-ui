import { useState } from 'react';
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
  LoadingState,
  SearchInput,
  SectionHeader,
  Select,
  StatCard,
  StatusBadge,
  getTabsA11yIds,
  Tabs,
} from '@/components/ui';

export const UiPreviewPage = () => {
  const tabsIdBase = 'ui-preview-sections';
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const activeTabA11y = getTabsA11yIds(tabsIdBase, activeTab);
  const handleResetFilters = () => {
    setSelectedRegion('all');
    setSearchQuery('');
    setActiveTab('summary');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="UI Components Preview"
        subtitle="Reusable components with variants and edge states"
      />

      <Card variant="elevated" className="space-y-4">
        <SectionHeader title="Cards and Headers" />
        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default">Default card surface</Card>
          <Card variant="bordered">Bordered card surface</Card>
          <Card variant="elevated">Elevated card surface</Card>
        </div>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title="Stats and Info" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Completion Rate" value="68%" change={5} />
          <StatCard label="AI Usage" value="54%" change={-3} />
          <StatCard label="Monthly Sessions" value={1204} />
          <InfoCard
            title="Long content"
            description="This card demonstrates handling long descriptions safely without breaking layouts in narrow containers."
            tone="info"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Success"
            description="Performance improved this week."
            tone="success"
          />
          <InfoCard
            title="Warning"
            description="Drop detected in one district."
            tone="warning"
          />
          <InfoCard
            title="Critical"
            description="Data sync failure needs attention."
            tone="critical"
          />
        </div>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title="Filters and Inputs" />
        <FilterBar>
          <Select
            value={selectedRegion}
            onChange={setSelectedRegion}
            options={[
              { label: 'All Regions', value: 'all' },
              { label: 'North', value: 'north' },
              { label: 'South', value: 'south' },
            ]}
            aria-label="Region filter"
          />
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search CHW or district"
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleResetFilters}>
            Reset
          </Button>
        </FilterBar>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title="Badges, List, and KeyValue" />
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default Badge</Badge>
          <StatusBadge status="success" label="Active" />
          <StatusBadge status="warning" label="At Risk" />
          <StatusBadge status="critical" label="Blocked" />
          <StatusBadge status="info" label="Pending" />
        </div>
        <Divider />
        <dl className="space-y-2">
          <KeyValue label="Region" value="Dhaka" />
          <KeyValue label="Cluster" value="North 03" />
          <KeyValue label="Supervisor" value={null} />
        </dl>
        <div className="space-y-2">
          <ListItem
            title="Anika Rahman"
            subtitle="12 completions this week"
            rightContent={<StatusBadge status="success" label="Active" />}
          />
          <ListItem
            title="Extremely Long Name To Validate Text Truncation In Narrow Rows"
            subtitle="Subtitle with long metadata that should truncate safely"
            rightContent={<Badge>New</Badge>}
          />
        </div>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title="Actions, Tabs, and States" />
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>

        <Tabs
          items={[
            { label: 'Summary', value: 'summary' },
            { label: 'Details', value: 'details' },
            { label: 'History', value: 'history' },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          idBase={tabsIdBase}
        />
        <div
          role="tabpanel"
          id={activeTabA11y.panelId}
          aria-labelledby={activeTabA11y.tabId}
          className="rounded-md border border-slate-200 bg-white p-3"
        >
          <p className="text-sm text-slate-600">Active tab: {activeTab}</p>
        </div>

        <Banner tone="warning">
          This is a warning banner for high-priority communication.
        </Banner>

        <div className="grid gap-4 md:grid-cols-3">
          <EmptyState
            title="No records found"
            description="Try broadening your filters."
            action={<Button variant="secondary">Clear filters</Button>}
          />
          <LoadingState label="Loading dashboard metrics..." />
          <ErrorState
            title="Could not load data"
            description="Please try again in a few minutes."
            action={<Button variant="secondary">Retry</Button>}
          />
        </div>
      </Card>
    </div>
  );
};
