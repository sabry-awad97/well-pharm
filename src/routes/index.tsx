import router from '@/router';
import { createFileRoute } from '@tanstack/react-router';
import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';
import logo from '../logo.svg';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isOnboarded = await invoke('check_onboarding_status');

        if (!isOnboarded) {
          // Redirect to onboarding if not completed
          router.navigate({ to: '/onboarding' });
        }
      } catch (err) {
        console.error('Failed to check onboarding status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2" />
      </div>
    );
  }

  return (
    <div className="text-center">
      <header className="flex min-h-screen flex-col items-center justify-center bg-[#282c34] text-[calc(10px+2vmin)] text-white">
        <img
          src={logo}
          className="pointer-events-none h-[40vmin] animate-[spin_20s_linear_infinite]"
          alt="logo"
        />
        <p>
          Edit <code>src/routes/index.tsx</code> and save to reload.
        </p>
      </header>
    </div>
  );
}
