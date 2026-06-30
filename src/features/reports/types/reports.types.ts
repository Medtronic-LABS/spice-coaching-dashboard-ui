export interface ReportCard {
  id: string;
  title: string;
  description: string;
  cadenceLabel: string;
  formatsLabel: string;
  actionLabel: string;
}

export interface ReportStats {
  activeChws: number;
  locationLabel: string;
  modulesPublished: number;
  modulesTotal: number;
  modulesDrafts: number;
  overallPassRateLabel: string;
  overallPassRateMeta: string;
  avgCompletionLabel: string;
  avgCompletionMeta: string;
}

export interface CustomReportCard {
  title: string;
  subtitle: string;
}

export interface ReportsResponse {
  stats: ReportStats;
  available: ReportCard[];
  customCards: CustomReportCard[];
}
