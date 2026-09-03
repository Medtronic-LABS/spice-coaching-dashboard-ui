/**
 * Canonical typography class strings for the dashboard.
 * Prefer shared components (`PageTitle`, `ModalTitle`, etc.) over copying these.
 */
export const typographyClasses = {
  pageTitle: 'text-[24px] font-semibold leading-[32px] text-spice-text-primary',
  pageSubtitle: 'mt-1 text-sm text-spice-text-muted',
  sectionTitle: 'text-base font-semibold text-spice-text-primary',
  sectionSubtitle: 'text-[13px] text-spice-text-muted',
  modalTitle: 'text-lg font-semibold text-spice-text-primary',
  cardTitle: 'text-sm font-semibold text-spice-text-primary',
  fieldGroupLabel:
    'text-xs font-semibold uppercase tracking-wider text-spice-text-muted',
  formLabelDefault: 'text-sm font-semibold text-spice-text-primary',
  formLabelCompact:
    'text-xs font-semibold tracking-wide text-spice-text-medium',
  formHelper: 'text-xs text-spice-text-muted',
  body: 'text-sm text-spice-text-medium',
  bodyPrimary: 'text-sm text-spice-text-primary',
  caption: 'text-xs text-spice-text-muted',
  tableHeader:
    'text-xs font-medium uppercase tracking-wider text-spice-text-medium',
  /** Default table cell text — inherited from `<Table>` compact density. */
  tableCell: 'text-[13px] text-spice-text-medium',
  /** Title / hero column in tables — one step larger than default cell text. */
  tableCellPrimary: 'text-[15px] font-medium text-spice-text-primary',
  /** Secondary line under primary text in the same table cell (e.g. filename under title). */
  tableCellSecondary: 'text-xs text-spice-text-muted',
  kpiLabel:
    'text-[18px] font-semibold uppercase tracking-wider leading-snug text-spice-text-muted',
  kpiValue: 'text-[38px] font-semibold leading-tight text-spice-text-primary',
  kpiOutOf: 'text-[28px] font-medium text-spice-text-muted',
  microBadge: 'text-xs font-semibold',
} as const;
