import type { ReactNode } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { isLoginEnabled } from '@/config/authConfig';
import { paths } from '@/constants/routes';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import { getAuthSession } from '@/features/auth/services/authSession';

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const status = useAuthBootstrap();
  const location = useLocation();

  if (isLoginEnabled()) {
    const session = getAuthSession();
    const isLoginPage = location.pathname.endsWith('/login');

    if (!session && !isLoginPage) {
      return <Navigate to={paths.login} replace state={{ from: location }} />;
    }

    if (session && isLoginPage) {
      return <Navigate to={paths.home} replace />;
    }

    // Login page owns the unauthenticated state; skip Spice bootstrap wait.
    if (isLoginPage) {
      return children;
    }
  }

  if (status !== 'ready') {
    return <Loader />;
  }

  return children;
};
