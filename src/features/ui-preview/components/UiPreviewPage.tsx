import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        variant="h2"
        title={t('uiPreview.title')}
        subtitle={t('uiPreview.subtitle')}
      />

      <Card variant="elevated" className="space-y-4">
        <SectionHeader title={t('uiPreview.cardsAndHeaders')} />
        <div className="grid gap-4 md:grid-cols-3">
          <Card variant="default">{t('uiPreview.defaultCardSurface')}</Card>
          <Card variant="bordered">{t('uiPreview.borderedCardSurface')}</Card>
          <Card variant="elevated">{t('uiPreview.elevatedCardSurface')}</Card>
        </div>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title={t('uiPreview.statsAndInfo')} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('uiPreview.completionRate')}
            value="68%"
            change={5}
          />
          <StatCard label={t('uiPreview.aiUsage')} value="54%" change={-3} />
          <StatCard label={t('uiPreview.monthlySessions')} value={1204} />
          <InfoCard
            title={t('uiPreview.longContentTitle')}
            description={t('uiPreview.longContentDescription')}
            tone="info"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard
            title={t('uiPreview.successTitle')}
            description={t('uiPreview.successDescription')}
            tone="success"
          />
          <InfoCard
            title={t('uiPreview.warningTitle')}
            description={t('uiPreview.warningDescription')}
            tone="warning"
          />
          <InfoCard
            title={t('uiPreview.criticalTitle')}
            description={t('uiPreview.criticalDescription')}
            tone="critical"
          />
        </div>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title={t('uiPreview.filtersAndInputs')} />
        <FilterBar>
          <Select
            value={selectedRegion}
            onChange={setSelectedRegion}
            options={[
              { label: t('uiPreview.allRegions'), value: 'all' },
              { label: t('uiPreview.north'), value: 'north' },
              { label: t('uiPreview.south'), value: 'south' },
            ]}
            aria-label={t('uiPreview.regionFilterAriaLabel')}
          />
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('uiPreview.searchPlaceholder')}
            className="flex-1"
          />
          <Button variant="secondary" onClick={handleResetFilters}>
            {t('common.reset')}
          </Button>
        </FilterBar>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title={t('uiPreview.badgesListKeyValue')} />
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{t('uiPreview.defaultBadge')}</Badge>
          <StatusBadge status="success" label={t('uiPreview.status.active')} />
          <StatusBadge status="warning" label={t('uiPreview.status.atRisk')} />
          <StatusBadge
            status="critical"
            label={t('uiPreview.status.blocked')}
          />
          <StatusBadge status="info" label={t('uiPreview.status.pending')} />
        </div>
        <Divider />
        <dl className="space-y-2">
          <KeyValue
            label={t('uiPreview.region')}
            value={t('uiPreview.regionValue')}
          />
          <KeyValue
            label={t('uiPreview.cluster')}
            value={t('uiPreview.clusterValue')}
          />
          <KeyValue label={t('uiPreview.supervisor')} value={null} />
        </dl>
        <div className="space-y-2">
          <ListItem
            title={t('uiPreview.personOneName')}
            subtitle={t('uiPreview.personOneSubtitle')}
            rightContent={
              <StatusBadge
                status="success"
                label={t('uiPreview.status.active')}
              />
            }
          />
          <ListItem
            title={t('uiPreview.personTwoName')}
            subtitle={t('uiPreview.personTwoSubtitle')}
            rightContent={<Badge>{t('uiPreview.newBadge')}</Badge>}
          />
        </div>
      </Card>

      <Card variant="bordered" className="space-y-4">
        <SectionHeader title={t('uiPreview.actionsTabsStates')} />
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">{t('uiPreview.button.primary')}</Button>
          <Button variant="secondary">{t('uiPreview.button.secondary')}</Button>
          <Button variant="ghost">{t('uiPreview.button.ghost')}</Button>
          <Button variant="primary" disabled>
            {t('uiPreview.button.disabled')}
          </Button>
        </div>

        <Tabs
          items={[
            { label: t('uiPreview.tabs.summary'), value: 'summary' },
            { label: t('uiPreview.tabs.details'), value: 'details' },
            { label: t('uiPreview.tabs.history'), value: 'history' },
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
          <p className="text-sm text-slate-600">
            {t('uiPreview.tabs.activeTab', { tab: activeTab })}
          </p>
        </div>

        <Banner tone="warning">{t('uiPreview.warningBanner')}</Banner>

        <div className="grid gap-4 md:grid-cols-3">
          <EmptyState
            title={t('uiPreview.emptyStateTitle')}
            description={t('uiPreview.emptyStateDescription')}
            action={
              <Button variant="secondary">{t('common.clearFilters')}</Button>
            }
          />
          <LoadingState label={t('uiPreview.loadingMetrics')} />
          <ErrorState
            title={t('uiPreview.errorStateTitle')}
            description={t('uiPreview.errorStateDescription')}
            action={<Button variant="secondary">{t('common.retry')}</Button>}
          />
        </div>
      </Card>
    </div>
  );
};
