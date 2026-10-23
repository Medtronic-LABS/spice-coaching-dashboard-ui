import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { App } from '@/App';
import { SnackbarProvider } from '@/components/ui/Snackbar/SnackbarProvider';
import { store } from '@/store/store';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { normalizeAppPath } from '@/bootstrap/normalizeAppPath';
import { initObservability } from '@/observability/initObservability';
import '@/i18n/i18n';
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import '@/styles/index.css';

normalizeAppPath();
initObservability();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <MantineProvider>
          <SnackbarProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </SnackbarProvider>
        </MantineProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
