import { createBrowserRouter, redirect } from 'react-router';
import { Root } from './components/layout/Root';
import { ChatScreen } from './components/screens/ChatScreen';
import { TaxOptimizer } from './components/screens/TaxOptimizer';
import { FirePlanner } from './components/screens/FirePlanner';
import { MoneyHealth } from './components/screens/MoneyHealth';
import { PortfolioXRay } from './components/screens/PortfolioXRay';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      {
        index: true,
        loader: () => redirect('/chat'),
      },
      { path: 'chat', Component: ChatScreen },
      { path: 'tax', Component: TaxOptimizer },
      { path: 'fire', Component: FirePlanner },
      { path: 'health', Component: MoneyHealth },
      { path: 'portfolio', Component: PortfolioXRay },
    ],
  },
]);
