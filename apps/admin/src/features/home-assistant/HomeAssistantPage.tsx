import { useState } from 'react';
import { CircleAlertIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { DiscoveredHomeAssistant } from '@everdash/contracts/auth/oauth';
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
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    toast.error('Unable to reconnect. Sign in again.');
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
    toast.error('Unable to disconnect Home Assistant.');
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
    toast.error('Unable to switch Home Assistant instance.');
  }

  if (isSupervisor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>
            EverDash talks to Home Assistant through the built-in app connection on behalf of every
            tablet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <span className="text-sm font-medium">Home Assistant Supervisor</span>
            <Badge variant="secondary">Connected</Badge>
          </div>
          <p className="text-muted-foreground text-xs">
            Managed automatically while running inside Home Assistant. No separate login or OAuth
            token is required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>
            EverDash talks to this Home Assistant on behalf of every tablet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 rounded-md border p-3">
            <code className="min-w-0 truncate font-mono text-sm">{origin || 'Not connected'}</code>
            {origin ? (
              <Badge variant="secondary">Connected</Badge>
            ) : (
              <Badge variant="outline">Not connected</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={reconnect}>
              Reconnect
            </Button>
            <Button variant="destructive" onClick={() => setConfirming(true)}>
              Disconnect…
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network discovery</CardTitle>
          <CardDescription>
            Automatically scans your home network for Home Assistant instances.
          </CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              disabled={discovery.scanning}
              onClick={discovery.rescan}
            >
              <RefreshCwIcon className={cn(discovery.scanning && 'animate-spin')} />
              {discovery.scanning ? 'Scanning…' : 'Rescan'}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {discovery.scanning && discovery.instances.length === 0 && (
            <p className="text-muted-foreground text-sm">
              Scanning your home network for Home Assistant…
            </p>
          )}
          {discovery.error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{discovery.error}</AlertDescription>
            </Alert>
          )}
          {discovery.instances.length > 0 && (
            <ul className="space-y-2" aria-label="Discovered Home Assistant instances">
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
                            aria-label={`URL for ${instance.name ?? instance.origin}`}
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
                      <Badge variant="secondary">Current</Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSwitchTarget({ ...instance, origin: selectedUrl })}
                      >
                        Connect…
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
              <p className="text-muted-foreground text-sm">
                No Home Assistant instances were found on this network.
              </p>
            )}
        </CardContent>
      </Card>

      <AlertDialog open={confirming} onOpenChange={(open) => !disconnecting && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Home Assistant?</AlertDialogTitle>
            <AlertDialogDescription>
              EverDash forgets this Home Assistant connection and signs you out. Your dashboard
              layout is kept. Then you can sign in to any Home Assistant instance. Tablets show no
              data until you connect again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={disconnecting} onClick={disconnect}>
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
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
            <AlertDialogTitle>Switch Home Assistant instance?</AlertDialogTitle>
            <AlertDialogDescription>
              EverDash will disconnect from{' '}
              <code className="text-foreground">{origin || 'the current instance'}</code> and open
              sign-in for <code className="text-foreground">{switchTarget?.origin}</code>. Your
              dashboard layout is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={switching}>Cancel</AlertDialogCancel>
            <Button disabled={switching} onClick={confirmSwitch}>
              {switching ? 'Switching…' : 'Disconnect & connect'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
