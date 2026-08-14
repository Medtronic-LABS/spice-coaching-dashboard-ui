import type { ReactNode } from 'react';
import { Loader } from '@/components/ui/Loader';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';

interface AuthGateProps {
  children: ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const status = useAuthBootstrap();

  if (status !== 'ready') {
    return <Loader />;
  }

  return children;
};
