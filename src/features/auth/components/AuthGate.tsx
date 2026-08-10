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

function isPublicAuthPath(pathname: string): boolean {
  return pathname === paths.login || pathname === paths.unauthorized;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const status = useAuthBootstrap();
  const location = useLocation();

  if (isLoginEnabled()) {
    const session = getAuthSession();
    const isPublicPath = isPublicAuthPath(location.pathname);
    const isLoginPage = location.pathname === paths.login;

    if (!session && !isPublicPath) {
      return <Navigate to={paths.login} replace state={{ from: location }} />;
    }

    if (session && isLoginPage) {
      return <Navigate to={paths.home} replace />;
    }

    // Login / unauthorized pages own unauthenticated auth UX.
    if (isPublicPath) {
      return children;
    }
  }

  if (status !== 'ready') {
    return <Loader />;
  }

  return children;
};
