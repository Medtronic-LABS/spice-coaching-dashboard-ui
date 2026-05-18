import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dashboard)'],
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        bengali: ['var(--font-bengali)'],
      },
      colors: {
        spice: {
          bg: {
            dashboard: 'var(--color-bg-dashboard)',
            surface: 'var(--color-surface)',
            tint: 'var(--color-blue-tint)',
            input: 'var(--color-bg-input)',
          },
          text: {
            primary: 'var(--color-text-primary)',
            medium: 'var(--color-text-medium)',
            muted: 'var(--color-text-muted)',
            subtle: 'var(--color-text-subtle)',
            body: 'var(--color-text-body)',
            placeholder: 'var(--color-text-placeholder)',
            onDark: {
              hi: 'var(--color-text-on-dark-hi)',
              mid: 'var(--color-text-on-dark-mid)',
              lo: 'var(--color-text-on-dark-lo)',
            },
          },
          border: {
            DEFAULT: 'var(--color-border)',
            mid: 'var(--color-border-mid)',
            input: 'var(--color-border-input)',
          },
          brand: {
            primary: 'var(--color-blue-supervisor)',
            pm: 'var(--color-blue-pm)',
            app: 'var(--color-blue-app)',
            appDark: 'var(--color-blue-app-dark)',
            navy: 'var(--color-navy-sidebar)',
          },
          neutral: {
            100: 'var(--color-neutral-100)',
            200: 'var(--color-neutral-200)',
            300: 'var(--color-neutral-300)',
            400: 'var(--color-neutral-400)',
            500: 'var(--color-neutral-500)',
            600: 'var(--color-neutral-600)',
            700: 'var(--color-neutral-700)',
            800: 'var(--color-neutral-800)',
          },
          accent: {
            blueLight: 'var(--color-accent-blue-light)',
            coral: 'var(--color-accent-coral)',
            lavender: 'var(--color-accent-lavender)',
            greenPale: 'var(--color-accent-green-pale)',
          },
          semantic: {
            success: 'var(--color-success)',
            successBg: 'var(--color-success-bg)',
            warning: 'var(--color-warning)',
            warningBg: 'var(--color-warning-bg)',
            error: 'var(--color-error)',
            errorBg: 'var(--color-error-bg)',
            info: 'var(--color-info)',
            infoBg: 'var(--color-info-bg)',
          },
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        '3xl': 'var(--radius-3xl)',
        full: 'var(--radius-pill)',
        badge: 'var(--radius-badge)',
        avatar: 'var(--radius-avatar)',
        icon: 'var(--radius-icon)',
      },
      boxShadow: {
        spiceCard: 'var(--shadow-card-dashboard)',
        spicePrimary: 'var(--shadow-btn-primary)',
        spiceAppCard: 'var(--shadow-card-app)',
        spiceHero: 'var(--shadow-hero-app)',
        spiceOverlay: 'var(--shadow-overlay)',
        spicePmPanel: 'var(--shadow-pm-panel)',
        spiceKpi: 'var(--shadow-kpi-card)',
      },
      spacing: {
        sp1: 'var(--space-1)',
        sp2: 'var(--space-2)',
        sp3: 'var(--space-3)',
        sp4: 'var(--space-4)',
        sp5: 'var(--space-5)',
        sp6: 'var(--space-6)',
        sp7: 'var(--space-7)',
        sp8: 'var(--space-8)',
        sp10: 'var(--space-10)',
        sp12: 'var(--space-12)',
        sp16: 'var(--space-16)',
      },
      fontSize: {
        'dash-title': [
          'var(--text-dash-title-size)',
          {
            lineHeight: 'var(--text-dash-title-lh)',
            fontWeight: 'var(--text-dash-title-weight)',
          },
        ],
        'dash-h1': [
          'var(--text-dash-h1-size)',
          {
            lineHeight: 'var(--text-dash-h1-lh)',
            letterSpacing: 'var(--text-dash-h1-ls)',
            fontWeight: 'var(--text-dash-h1-weight)',
          },
        ],
        'dash-h2': [
          'var(--text-dash-h2-size)',
          {
            lineHeight: 'var(--text-dash-h2-lh)',
            fontWeight: 'var(--text-dash-h2-weight)',
          },
        ],
        'dash-h3': [
          'var(--text-dash-h3-size)',
          {
            lineHeight: 'var(--text-dash-h3-lh)',
            fontWeight: 'var(--text-dash-h3-weight)',
          },
        ],
        'dash-body': [
          'var(--text-dash-body-size)',
          {
            lineHeight: 'var(--text-dash-body-lh)',
            fontWeight: 'var(--text-dash-body-weight)',
          },
        ],
        'dash-sm': [
          'var(--text-dash-sm-size)',
          {
            lineHeight: 'var(--text-dash-sm-lh)',
            fontWeight: 'var(--text-dash-sm-weight)',
          },
        ],
        'dash-xs': [
          'var(--text-dash-xs-size)',
          {
            lineHeight: 'var(--text-dash-xs-lh)',
            fontWeight: 'var(--text-dash-xs-weight)',
          },
        ],
      },
    },
  },
  plugins: [],
};

export default config;
