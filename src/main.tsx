import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { App } from '@/App';
import { store } from '@/store/store';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import '@/i18n/i18n';
import '@/styles/index.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);
