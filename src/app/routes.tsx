import { createBrowserRouter } from 'react-router';
import { Root } from './components/layout/Root';
import { LandingPage } from './components/screens/LandingPage';
import { ChatScreen } from './components/screens/ChatScreen';
import { TaxOptimizer } from './components/screens/TaxOptimizer';
import { FirePlanner } from './components/screens/FirePlanner';
import { MoneyHealth } from './components/screens/MoneyHealth';
import { PortfolioXRay } from './components/screens/PortfolioXRay';
import { ProfilePage } from './components/screens/ProfilePage';
import { UIEffects } from './components/UIEffects';
import { Outlet } from 'react-router';

function AppLayout() {
  return (
    <>
      <UIEffects />
      <Outlet />
    </>
  );
}

export const router = createBrowserRouter([
  {
    Component: AppLayout,
    children: [
      // Landing page — standalone, no sidebar
      {
        path: '/',
        Component: LandingPage,
      },
      // App — sidebar layout
      {
        Component: Root,
        children: [
          { path: 'chat', Component: ChatScreen },
          { path: 'tax', Component: TaxOptimizer },
          { path: 'fire', Component: FirePlanner },
          { path: 'health', Component: MoneyHealth },
          { path: 'portfolio', Component: PortfolioXRay },
          { path: 'profile', Component: ProfilePage },
        ],
      },
    ],
  }
]);
