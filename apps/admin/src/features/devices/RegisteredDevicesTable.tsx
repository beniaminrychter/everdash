import { useState } from 'react';
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { RegisteredDevice } from '@everdash/contracts/auth/devices';
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
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

interface RegisteredDevicesTableProps {
  devices: RegisteredDevice[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onRename: (id: string, name: string) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}

export function RegisteredDevicesTable({
  devices,
  loading,
  error,
  onRetry,
  onRename,
  onRemove,
}: RegisteredDevicesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [removingDevice, setRemovingDevice] = useState<RegisteredDevice | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);

  function startEditing(device: RegisteredDevice) {
    setEditingId(device.id);
    setDraftName(device.name);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftName('');
  }

  async function saveName(id: string) {
    if (savingName) {
      return;
    }

    setSavingName(true);

    const ok = await onRename(id, draftName);

    setSavingName(false);

    if (ok) {
      setEditingId(null);
      setDraftName('');
      toast.success('Device name updated.');
    } else {
      toast.error('Unable to update device name.');
    }
  }

  async function confirmRemove() {
    if (!removingDevice || removingBusy) {
      return;
    }

    setRemovingBusy(true);

    const ok = await onRemove(removingDevice.id);

    setRemovingBusy(false);

    if (ok) {
      setRemovingDevice(null);
      toast.success('Device removed.');
    } else {
      toast.error('Unable to remove device.');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Registered devices</CardTitle>
          <CardDescription>
            Devices allowed to open this dashboard. Reloading a registered device keeps it signed in
            until removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading registered devices…</p>
          ) : error && devices.length === 0 ? (
            <div className="flex items-center justify-between gap-4 rounded-md border p-4">
              <p className="text-muted-foreground text-sm">Unable to load registered devices.</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </div>
          ) : devices.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No devices registered yet. Open the dashboard address on your tablet or phone and
              enter the registration code above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Screen</TableHead>
                  <TableHead>Local IP</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => {
                  const isEditing = editingId === device.id;

                  return (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">
                        {isEditing ? (
                          <form
                            className="flex items-center gap-1.5"
                            onSubmit={(event) => {
                              event.preventDefault();
                              saveName(device.id);
                            }}
                          >
                            <Input
                              aria-label="Device name"
                              value={draftName}
                              maxLength={80}
                              placeholder="Living room iPad"
                              disabled={savingName}
                              autoFocus
                              className="h-8 w-44"
                              onChange={(event) => setDraftName(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                            />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={savingName}
                              aria-label="Save name"
                            >
                              <CheckIcon className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={savingName}
                              aria-label="Cancel"
                              onClick={cancelEditing}
                            >
                              <XIcon className="size-4" />
                            </Button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {device.name ? (
                              <span>{device.name}</span>
                            ) : (
                              <span className="text-muted-foreground">Unnamed device</span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={`Rename ${device.name || device.deviceType}`}
                              onClick={() => startEditing(device)}
                            >
                              <PencilIcon className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{device.deviceType}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{device.screenSize}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {device.ip === 'Unknown' ? (
                          <span className="text-muted-foreground font-sans">Unknown</span>
                        ) : (
                          device.ip
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatTimestamp(device.lastSeenAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Remove ${device.name || device.deviceType}`}
                          onClick={() => setRemovingDevice(device)}
                        >
                          <Trash2Icon className="size-4" />
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={removingDevice !== null}
        onOpenChange={(open) => !open && !removingBusy && setRemovingDevice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove device?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingDevice?.name || removingDevice?.deviceType || 'This device'} will lose access
              to the dashboard and will need a new registration code to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingBusy}>Cancel</AlertDialogCancel>
            <Button variant="destructive" disabled={removingBusy} onClick={confirmRemove}>
              {removingBusy ? 'Removing…' : 'Remove'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
