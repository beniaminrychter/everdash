import { useState } from 'react';
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { RegisteredDevice } from '@everdash/contracts/auth/devices';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
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
import { useAdminLocale } from '@/lib/i18n';

function formatTimestamp(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleString(locale, {
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
  const { bcp47 } = useAdminLocale();
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
      toast.success(m.admin_devices_name_updated());
    } else {
      toast.error(m.admin_devices_name_update_error());
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
      toast.success(m.admin_devices_removed());
    } else {
      toast.error(m.admin_devices_remove_error());
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{m.admin_devices_registered_title()}</CardTitle>
          <CardDescription>{m.admin_devices_registered_description()}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">{m.admin_devices_loading()}</p>
          ) : error && devices.length === 0 ? (
            <div className="flex items-center justify-between gap-4 rounded-md border p-4">
              <p className="text-muted-foreground text-sm">{m.admin_devices_load_error()}</p>
              <Button variant="outline" size="sm" onClick={onRetry}>
                {m.admin_retry()}
              </Button>
            </div>
          ) : devices.length === 0 ? (
            <p className="text-muted-foreground text-sm">{m.admin_devices_empty()}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{m.admin_devices_col_name()}</TableHead>
                  <TableHead>{m.admin_devices_col_device()}</TableHead>
                  <TableHead>{m.admin_devices_col_screen()}</TableHead>
                  <TableHead>{m.admin_devices_col_ip()}</TableHead>
                  <TableHead>{m.admin_devices_col_last_seen()}</TableHead>
                  <TableHead className="text-right">{m.admin_devices_col_actions()}</TableHead>
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
                              aria-label={m.admin_devices_name_label()}
                              value={draftName}
                              maxLength={80}
                              placeholder={m.admin_devices_name_placeholder()}
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
                              aria-label={m.admin_devices_save_name()}
                            >
                              <CheckIcon className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              disabled={savingName}
                              aria-label={m.admin_cancel()}
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
                              <span className="text-muted-foreground">
                                {m.admin_devices_unnamed()}
                              </span>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              aria-label={m.admin_devices_rename_aria({
                                name: device.name || device.deviceType,
                              })}
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
                          <span className="text-muted-foreground font-sans">
                            {m.admin_devices_unknown()}
                          </span>
                        ) : (
                          device.ip
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatTimestamp(device.lastSeenAt, bcp47)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={m.admin_devices_remove_aria({
                            name: device.name || device.deviceType,
                          })}
                          onClick={() => setRemovingDevice(device)}
                        >
                          <Trash2Icon className="size-4" />
                          {m.admin_devices_remove()}
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
            <AlertDialogTitle>{m.admin_devices_remove_title()}</AlertDialogTitle>
            <AlertDialogDescription>
              {m.admin_devices_remove_description({
                name:
                  removingDevice?.name ||
                  removingDevice?.deviceType ||
                  m.admin_devices_this_device(),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingBusy}>{m.admin_cancel()}</AlertDialogCancel>
            <Button variant="destructive" disabled={removingBusy} onClick={confirmRemove}>
              {removingBusy ? m.admin_devices_removing() : m.admin_devices_remove()}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
