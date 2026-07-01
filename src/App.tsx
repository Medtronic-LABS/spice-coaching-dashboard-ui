import { AuthGate } from '@/features/auth/components/AuthGate';
import { AppRoutes } from '@/routes/AppRoutes';

export const App = () => (
  <AuthGate>
    <AppRoutes />
  </AuthGate>
);
