import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { App } from '@/App';
import { store } from '@/store/store';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { initObservability } from '@/observability/initObservability';
import '@/i18n/i18n';
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import '@/styles/index.css';

initObservability();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <MantineProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MantineProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
