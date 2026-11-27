import { useEffect, useState } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { api, onUnauthorized } from '@/lib/api';
import { AdminI18nProvider } from '@/lib/i18n';
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
  language?: string;
}

function AdminContent({ session, error }: { session: Session | null; error: string }) {
  if (!session) {
    return (
      <p className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
        {m.admin_checking_session()}
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
          language: result.language,
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setError(m.admin_unable_to_connect());
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

  return (
    <AdminI18nProvider language={session?.language}>
      <AdminContent session={session} error={error} />
    </AdminI18nProvider>
  );
}
