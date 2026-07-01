import type { ReactNode } from 'react';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import { UnAuthorizedPage } from '@/features/auth/pages/UnAuthorizedPage';
import { getAuthSession } from '@/features/auth/services/authSession';

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  useAuthBootstrap();

  if (import.meta.env.PROD && !getAuthSession()) {
    return <UnAuthorizedPage />;
  }

  return children;
};
