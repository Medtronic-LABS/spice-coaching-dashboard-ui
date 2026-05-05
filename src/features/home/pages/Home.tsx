import { SupervisorDashboard } from '../components/SupervisorDashboard';
import { getCurrentRole } from '@/constants/role';
import { ProgramOverviewPage } from '@/features/program-manager/pages/ProgramOverviewPage';

export const Home = () => {
  const role = getCurrentRole();
  if (role === 'programManager') {
    return <ProgramOverviewPage />;
  }
  return <SupervisorDashboard />;
};
