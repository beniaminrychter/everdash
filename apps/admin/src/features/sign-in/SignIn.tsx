import { useCallback, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckIcon, CircleAlertIcon, RefreshCwIcon } from 'lucide-react';
import type { DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  instanceOrigins,
  sourceLabel,
  useHomeAssistantDiscovery,
} from '@/features/home-assistant/useHomeAssistantDiscovery';
import { cn } from '@/lib/utils';
import { apiUrl } from '@/lib/api';
import { authErrorMessage } from './authErrors';

interface SignInProps {
  /** True when a Home Assistant connection is already saved. */
  connected: boolean;
  savedOrigin: string;
  initialError: string;
}

export function SignIn({ connected, savedOrigin, initialError }: SignInProps) {
  const [origin, setOrigin] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const userEditedRef = useRef(false);

  const handleDiscovered = useCallback((found: DiscoveredHomeAssistant[]) => {
    if (!userEditedRef.current && found.length === 1) {
      setOrigin(found[0]!.origin);
    }
  }, []);

  const discovery = useHomeAssistantDiscovery(!connected, handleDiscovered);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch(apiUrl('api/manage/auth/start'), {
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
      setError(error instanceof Error ? error.message : m.admin_signin_start_error());
      setBusy(false);
    }
  }

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">EverDash</CardTitle>
          <CardDescription>{m.admin_signin_description()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={signIn}>
            {connected && savedOrigin && (
              <p className="text-muted-foreground text-sm">
                {m.admin_signin_ha_label()} <code className="text-foreground">{savedOrigin}</code>
              </p>
            )}
            {!connected && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="home-assistant-url">{m.admin_signin_ha_url()}</Label>
                  <Input
                    id="home-assistant-url"
                    type="url"
                    value={origin}
                    onChange={(event) => {
                      userEditedRef.current = true;
                      setOrigin(event.target.value);
                    }}
                    placeholder="http://homeassistant.local:8123"
                    required
                  />
                </div>
                <div className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium">{m.admin_signin_discovered()}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      disabled={discovery.scanning}
                      onClick={discovery.rescan}
                    >
                      <RefreshCwIcon
                        className={cn('size-3.5', discovery.scanning && 'animate-spin')}
                      />
                      {discovery.scanning ? m.admin_signin_scanning() : m.admin_signin_rescan()}
                    </Button>
                  </div>
                  {discovery.scanning && discovery.instances.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      {m.admin_signin_scanning_network()}
                    </p>
                  )}
                  {discovery.instances.length > 0 && (
                    <ul className="space-y-1.5" aria-label={m.admin_signin_discovered_aria()}>
                      {discovery.instances.map((instance) => {
                        const urls = instanceOrigins(instance);
                        const key = instance.origin;
                        const matchingUrl = urls.find((url) => url === origin);
                        const chosen = selectedUrls[key];
                        const activeUrl =
                          matchingUrl ??
                          (chosen && urls.includes(chosen) ? chosen : instance.origin);
                        const selected = origin === activeUrl;

                        if (urls.length <= 1) {
                          return (
                            <li key={key}>
                              <button
                                type="button"
                                onClick={() => {
                                  userEditedRef.current = true;
                                  setOrigin(activeUrl);
                                }}
                                aria-pressed={selected}
                                className={cn(
                                  'hover:bg-accent flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors',
                                  selected && 'border-primary bg-accent/60',
                                )}
                              >
                                <div className="min-w-0">
                                  {instance.name && (
                                    <p className="truncate text-xs font-medium">{instance.name}</p>
                                  )}
                                  <p className="truncate font-mono text-xs">{activeUrl}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px]">
                                    {sourceLabel(instance.source)}
                                  </Badge>
                                  {selected && <CheckIcon className="text-primary size-3.5" />}
                                </div>
                              </button>
                            </li>
                          );
                        }

                        return (
                          <li
                            key={key}
                            className={cn(
                              'space-y-2 rounded-md border px-2.5 py-2 transition-colors',
                              selected && 'border-primary bg-accent/60',
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                userEditedRef.current = true;
                                setOrigin(activeUrl);
                              }}
                              aria-pressed={selected}
                              className="flex w-full items-center justify-between gap-2 text-left"
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate text-xs font-medium">
                                  {instance.name || activeUrl}
                                </span>
                                {instance.version && (
                                  <span className="text-muted-foreground shrink-0 text-[10px]">
                                    v{instance.version}
                                  </span>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px]">
                                  {sourceLabel(instance.source)}
                                </Badge>
                                {selected && <CheckIcon className="text-primary size-3.5" />}
                              </div>
                            </button>
                            <Select
                              value={activeUrl}
                              onValueChange={(value) => {
                                userEditedRef.current = true;
                                setSelectedUrls((previous) => ({ ...previous, [key]: value }));
                                setOrigin(value);
                              }}
                            >
                              <SelectTrigger
                                size="sm"
                                aria-label={m.admin_signin_url_for({
                                  name: instance.name ?? instance.origin,
                                })}
                                className="bg-background h-8 w-full font-mono text-xs"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent position="popper">
                                {urls.map((url) => (
                                  <SelectItem key={url} value={url} className="font-mono text-xs">
                                    {url}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!discovery.scanning &&
                    discovery.scannedOnce &&
                    discovery.instances.length === 0 && (
                      <p className="text-muted-foreground text-xs">
                        {discovery.error
                          ? m.admin_signin_scan_unavailable()
                          : m.admin_signin_none_found()}
                      </p>
                    )}
                </div>
              </>
            )}
            {error && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? m.admin_signin_connecting() : m.admin_signin_continue()}
            </Button>
            {connected && (
              <p className="text-muted-foreground text-xs">
                {m.admin_signin_switch_hint_prefix()} <code>pnpm reset-connection</code>{' '}
                {m.admin_signin_switch_hint_middle()} <code>--reset-connection</code>{' '}
                {m.admin_signin_switch_hint_suffix()}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
