import { useState } from 'react';
import { toast } from 'sonner';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { disconnectHomeAssistant, reconnectHomeAssistant } from './connectionActions';

async function reconnect() {
  if (!(await reconnectHomeAssistant())) {
    toast.error('Unable to reconnect. Sign in again.');
  }
}

export function HomeAssistantPage({ origin }: { origin: string }) {
  const [confirming, setConfirming] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  async function disconnect() {
    setDisconnecting(true);

    if (await disconnectHomeAssistant()) {
      return;
    }

    setDisconnecting(false);
    setConfirming(false);
    toast.error('Unable to disconnect Home Assistant.');
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
    </>
  );
}
