import { useState } from 'react';
import type { FormEvent } from 'react';
import { CircleAlertIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authErrorMessage } from './authErrors';

interface SignInProps {
  /** True when a Home Assistant connection is already saved. */
  connected: boolean;
  savedOrigin: string;
  initialError: string;
}

export function SignIn({ connected, savedOrigin, initialError }: SignInProps) {
  const [origin, setOrigin] = useState('');
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/manage/auth/start', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-EverDash-Request': '1' },
        body: JSON.stringify({
          intent: 'login',
          ...(origin ? { homeAssistantOrigin: origin } : {}),
        }),
      });
      const result = (await response.json()) as { authorizationUrl?: string; error?: string };

      if (!response.ok || !result.authorizationUrl) {
        setError(authErrorMessage(result.error ?? 'INVALID_REQUEST'));
        setBusy(false);

        return;
      }

      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not start login.');
      setBusy(false);
    }
  }

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">EverDash</CardTitle>
          <CardDescription>Sign in with a Home Assistant administrator account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={signIn}>
            {connected && savedOrigin && (
              <p className="text-muted-foreground text-sm">
                Home Assistant: <code className="text-foreground">{savedOrigin}</code>
              </p>
            )}
            {!connected && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="home-assistant-url">Home Assistant URL</Label>
                <Input
                  id="home-assistant-url"
                  type="url"
                  value={origin}
                  onChange={(event) => setOrigin(event.target.value)}
                  placeholder="http://homeassistant.local:8123"
                  required
                />
              </div>
            )}
            {error && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Connecting…' : 'Continue with Home Assistant'}
            </Button>
            {connected && (
              <p className="text-muted-foreground text-xs">
                To use a different Home Assistant, sign in and choose Disconnect under Tablet
                access. If you cannot sign in, reset the saved connection with{' '}
                <code>pnpm reset-connection</code> (or <code>--reset-connection</code> on the
                server).
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
