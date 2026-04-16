export const SUPERVISOR_DASHBOARD_CONSTANTS = {
  LOADING: {
    INITIAL_LABEL: 'Loading supervisor dashboard',
    SUMMARY_LABEL: 'Loading summary',
    LEADERBOARD_LABEL: 'Loading leaderboard',
    PERFORMANCE_LABEL: 'Loading CHW matrix',
    FLAGS_LABEL: 'Loading flags',
    MODULES_LABEL: 'Loading modules',
  },
  ERROR: {
    ALL_TITLE: 'Supervisor dashboard unavailable',
    ALL_DESCRIPTION: 'Please try again in a moment.',
    SUMMARY_DESCRIPTION: 'We couldn’t load KPIs.',
  },
  EMPTY: {
    TITLE: 'No supervisor data yet',
    DESCRIPTION:
      'Once activity is available, you’ll see KPIs, flags, and progress here.',
  },
  HEADER: {
    TITLE: 'Supervisor dashboard',
    SUBTITLE: 'Quick overview of performance, flags, and module progress.',
  },
  SECTIONS: {
    SUMMARY: 'Summary',
    LEADERBOARD: 'Leaderboard',
    PERFORMANCE: 'CHW matrix',
    FLAGS: 'Flags',
    MODULES: 'Module progress',
  },
  ACTIONS: {
    VIEW_ALL: 'View all',
  },
} as const;
