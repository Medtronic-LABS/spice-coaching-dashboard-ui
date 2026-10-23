export type SnackbarTone = 'info' | 'success' | 'warning' | 'critical';

export type SnackbarItem = {
  id: string;
  message: string;
  tone: SnackbarTone;
};

export type ShowSnackbarOptions = {
  message: string;
  tone?: SnackbarTone;
  durationMs?: number;
};

export type SnackbarApi = {
  show: (options: ShowSnackbarOptions) => string;
  showSuccess: (message: string) => string;
  showError: (message: string) => string;
  showWarning: (message: string) => string;
  showInfo: (message: string) => string;
  showApiError: (error: unknown) => string;
  dismiss: (id: string) => void;
};
