import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { UIEffects } from './components/UIEffects';

export default function App() {
  return (
    <AuthProvider>
      {/* Invisible side-effect component — injects cursor, context menu, etc. */}
      <UIEffects />
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
