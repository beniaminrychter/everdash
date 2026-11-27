import { useState } from 'react';
import { CircleAlertIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  disconnectHomeAssistant,
  reconnectHomeAssistant,
  switchHomeAssistant,
} from './connectionActions';
import {
  instanceOrigins,
  sourceLabel,
  useHomeAssistantDiscovery,
} from './useHomeAssistantDiscovery';

async function reconnect() {
  if (!(await reconnectHomeAssistant())) {
    toast.error(m.admin_ha_reconnect_error());
  }
}

export function HomeAssistantPage({
  origin,
  connectionMode,
}: {
  origin: string;
  connectionMode?: 'oauth' | 'supervisor';
}) {
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<DiscoveredHomeAssistant | null>(null);
  const [switching, setSwitching] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<Record<string, string>>({});
  const isSupervisor = connectionMode === 'supervisor';
  const discovery = useHomeAssistantDiscovery(!isSupervisor);

  async function disconnect() {
    setDisconnecting(true);

    if (await disconnectHomeAssistant()) {
      return;
    }

    setDisconnecting(false);
    setConfirming(false);
    toast.error(m.admin_ha_disconnect_error());
  }

  async function confirmSwitch() {
    if (!switchTarget) {
      return;
    }

    setSwitching(true);

    if (await switchHomeAssistant(switchTarget.origin)) {
      return;
    }

    setSwitching(false);
    setSwitchTarget(null);
    toast.error(m.admin_ha_switch_error());
  }

  if (isSupervisor) {
    return (
      <Card>
        <CardHeader className="grid-rows-1">
          <CardTitle>{m.admin_ha_connection_title()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <span className="text-sm font-medium">{m.admin_ha_supervisor_name()}</span>
            <Badge variant="secondary">{m.admin_ha_connected()}</Badge>
          </div>
          <p className="text-muted-foreground text-xs">{m.admin_ha_supervisor_hint()}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="grid-rows-1">
          <CardTitle>{m.admin_ha_connection_title()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            {origin && <code className="min-w-0 truncate font-mono text-sm">{origin}</code>}
            {origin ? (
              <Badge variant="secondary">{m.admin_ha_connected()}</Badge>
            ) : (
              <Badge variant="outline">{m.admin_ha_not_connected()}</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={reconnect}>
              {m.admin_ha_reconnect()}
            </Button>
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              {m.admin_ha_disconnect_ellipsis()}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="grid-rows-1">
          <CardTitle>{m.admin_ha_discovery_title()}</CardTitle>
          <CardAction className="row-span-1">
            <Button
              variant="outline"
              size="sm"
              disabled={discovery.scanning}
              onClick={discovery.rescan}
            >
              <RefreshCwIcon className={cn(discovery.scanning && 'animate-spin')} />
              {discovery.scanning ? m.admin_signin_scanning() : m.admin_signin_rescan()}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {discovery.scanning && discovery.instances.length === 0 && (
            <p className="text-muted-foreground text-sm">{m.admin_signin_scanning_network()}</p>
          )}
          {discovery.error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{discovery.error}</AlertDescription>
            </Alert>
          )}
          {discovery.instances.length > 0 && (
            <ul className="space-y-2" aria-label={m.admin_signin_discovered_aria()}>
              {discovery.instances.map((instance) => {
                const urls = instanceOrigins(instance);
                const key = instance.origin;
                const currentMemberUrl = urls.find((url) => url === origin);
                const chosen = selectedUrls[key];
                const selectedUrl =
                  chosen && urls.includes(chosen) ? chosen : (currentMemberUrl ?? instance.origin);
                const isCurrent = origin === selectedUrl;

                return (
                  <li
                    key={key}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {instance.name && (
                          <span className="text-sm font-medium">{instance.name}</span>
                        )}
                        <Badge variant="outline">{sourceLabel(instance.source)}</Badge>
                        {instance.version && (
                          <span className="text-muted-foreground text-xs">v{instance.version}</span>
                        )}
                      </div>
                      {urls.length > 1 ? (
                        <Select
                          value={selectedUrl}
                          onValueChange={(value) =>
                            setSelectedUrls((previous) => ({ ...previous, [key]: value }))
                          }
                        >
                          <SelectTrigger
                            size="sm"
                            aria-label={m.admin_signin_url_for({
                              name: instance.name ?? instance.origin,
                            })}
                            className="h-8 w-full max-w-full font-mono text-xs sm:max-w-md"
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
                      ) : (
                        <code className="text-muted-foreground block truncate font-mono text-xs">
                          {selectedUrl}
                        </code>
                      )}
                    </div>
                    {isCurrent ? (
                      <Badge variant="secondary">{m.admin_ha_current()}</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSwitchTarget({ ...instance, origin: selectedUrl })}
                      >
                        {m.admin_ha_connect_ellipsis()}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!discovery.scanning &&
            discovery.scannedOnce &&
            !discovery.error &&
            discovery.instances.length === 0 && (
              <p className="text-muted-foreground text-sm">{m.admin_ha_none_found()}</p>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={confirming} onOpenChange={(open) => !disconnecting && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.admin_ha_disconnect_dialog_title()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.admin_ha_disconnect_dialog_description()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>{m.admin_cancel()}</AlertDialogCancel>
            <Button variant="destructive" disabled={disconnecting} onClick={disconnect}>
              {disconnecting ? m.admin_ha_disconnecting() : m.admin_ha_disconnect()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={switchTarget !== null}
        onOpenChange={(open) => !switching && !open && setSwitchTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{m.admin_ha_switch_dialog_title()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.admin_ha_switch_dialog_prefix()}{' '}
              <code className="text-foreground">
                {origin || m.admin_ha_switch_current_fallback()}
              </code>{' '}
              {m.admin_ha_switch_dialog_middle()}{' '}
              <code className="text-foreground">{switchTarget?.origin}</code>
              {m.admin_ha_switch_dialog_suffix()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={switching}>{m.admin_cancel()}</AlertDialogCancel>
            <Button disabled={switching} onClick={confirmSwitch}>
              {switching ? m.admin_ha_switching() : m.admin_ha_disconnect_and_connect()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
