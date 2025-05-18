import * as TanStackQueryProvider from '@/integrations/tanstack-query/root-provider.tsx';
import type { PropsWithChildren } from 'react';
import { AuthProvider } from './contexts/auth-context';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <TanStackQueryProvider.Provider>
      <AuthProvider>{children}</AuthProvider>
    </TanStackQueryProvider.Provider>
  );
}
