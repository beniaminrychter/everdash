import { useEffect, useState } from 'react';
import { api, onUnauthorized } from '@/lib/api';
import { takeAuthErrorFromUrl } from '@/features/sign-in/authErrors';
import { SignIn } from '@/features/sign-in/SignIn';
import { AppShell } from './AppShell';
import { DraftProvider } from './DraftContext';

interface Session {
  authenticated: boolean;
  connected: boolean;
  origin: string;
  connectionMode?: 'oauth' | 'supervisor';
  ingress?: boolean;
  tabletPort?: number;
}

export function AdminRoot() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState(takeAuthErrorFromUrl);

  useEffect(() => {
    let active = true;

    api
      .getSession()
      .then((result) => {
        if (!active) {
          return;
        }

        setSession({
          authenticated: result.authenticated,
          connected: result.connection !== 'unconfigured',
          origin: result.homeAssistantOrigin ?? '',
          connectionMode: result.connectionMode,
          ingress: result.ingress,
          tabletPort: result.tabletPort,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError('Unable to connect to EverDash.');
        setSession({ authenticated: false, connected: false, origin: '' });
      });

    const stopListening = onUnauthorized(() => {
      setSession((previous) => (previous ? { ...previous, authenticated: false } : previous));
    });

    return () => {
      active = false;
      stopListening();
    };
  }, []);

  if (!session) {
    return (
      <p className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        Checking your session…
      </p>
    );
  }

  if (!session.authenticated) {
    return (
      <SignIn connected={session.connected} savedOrigin={session.origin} initialError={error} />
    );
  }

  return (
    <DraftProvider>
      <AppShell
        origin={session.origin}
        connectionMode={session.connectionMode}
        ingress={session.ingress}
        tabletPort={session.tabletPort}
      />
    </DraftProvider>
  );
}
