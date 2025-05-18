import * as TanStackQueryProvider from '@/integrations/tanstack-query/root-provider.tsx';
import type { PropsWithChildren } from 'react';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <TanStackQueryProvider.Provider>{children}</TanStackQueryProvider.Provider>
  );
}
