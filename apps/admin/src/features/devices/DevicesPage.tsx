import { useState } from 'react';
import { CheckIcon, CopyIcon, RefreshCwIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QrCode } from './QrCode';
import { RegisteredDevicesTable } from './RegisteredDevicesTable';
import { useDevices } from './useDevices';

function formatCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

export function DevicesPage({
  ingress,
  tabletPort,
}: {
  ingress?: boolean;
  tabletPort?: number;
} = {}) {
  const dashboardUrl =
    ingress && tabletPort
      ? `http://${window.location.hostname}:${tabletPort}/`
      : `${window.location.origin}/`;
  const {
    registrationCode,
    devices,
    loading,
    error,
    refresh,
    regenerateCode,
    renameDevice,
    removeDevice,
  } = useDevices();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(dashboardUrl);
      setCopiedUrl(true);
      window.setTimeout(() => setCopiedUrl(false), 1500);
    } catch {
      toast.error('Unable to copy the address.');
    }
  }

  async function copyCode() {
    if (!registrationCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(registrationCode);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 1500);
    } catch {
      toast.error('Unable to copy the registration code.');
    }
  }

  async function handleRegenerate() {
    if (regenerating) {
      return;
    }

    setRegenerating(true);

    const ok = await regenerateCode();

    setRegenerating(false);

    if (ok) {
      toast.success('New registration code generated.');
    } else {
      toast.error('Unable to generate a new code.');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Register a device</CardTitle>
          <CardDescription>
            Open the dashboard on a tablet or phone and enter this single-use registration code. A
            new code is generated automatically after each device registers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <QrCode value={dashboardUrl} />
            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tablet-url">Dashboard address</Label>
                <div className="flex gap-2">
                  <Input id="tablet-url" readOnly value={dashboardUrl} className="font-mono" />
                  <Button variant="outline" onClick={copyUrl}>
                    {copiedUrl ? <CheckIcon /> : <CopyIcon />}
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Registration code</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <output
                    aria-label="Registration code"
                    className="bg-muted inline-flex h-10 min-w-36 items-center justify-center rounded-md border px-4 font-mono text-xl font-semibold tracking-widest"
                  >
                    {registrationCode ? formatCode(registrationCode) : '--- ---'}
                  </output>
                  <Button variant="outline" disabled={!registrationCode} onClick={copyCode}>
                    {copiedCode ? <CheckIcon /> : <CopyIcon />}
                    {copiedCode ? 'Copied' : 'Copy'}
                  </Button>
                  <Button variant="outline" disabled={regenerating} onClick={handleRegenerate}>
                    <RefreshCwIcon className={regenerating ? 'animate-spin' : undefined} />
                    {regenerating ? 'Regenerating…' : 'Regenerate'}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Single-use code. Automatically regenerates once a device registers.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <RegisteredDevicesTable
        devices={devices}
        loading={loading}
        error={error}
        onRetry={refresh}
        onRename={renameDevice}
        onRemove={removeDevice}
      />
    </>
  );
}
