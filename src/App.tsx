import { Suspense } from 'react';
import { Loader } from '@/components/ui/Loader';
import { AuthGate } from '@/features/auth/components/AuthGate';
import { AppRoutes } from '@/routes/AppRoutes';

export const App = () => (
  <AuthGate>
    <Suspense fallback={<Loader label="Loading…" />}>
      <AppRoutes />
    </Suspense>
  </AuthGate>
);
