import { Navigate, useLocation } from 'react-router-dom';

/** Client redirect that keeps query string and hash from the current location. */
export const PreserveSearchRedirect = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
};
