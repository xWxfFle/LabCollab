import { RouterProvider } from '@argon-router/react';
import { Providers } from './providers';
import { Pages } from '../pages';
import { router } from '@/shared/routing';

export function App() {
  return (
    <Providers>
      <RouterProvider router={router}>
        <Pages />
      </RouterProvider>
    </Providers>
  );
}
