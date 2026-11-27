import { useState } from 'react';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
  DashboardAddressInfo,
  DashboardAddressReasonCode,
} from '@everdash/contracts/auth/devices';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminLocale } from '@/lib/i18n';
import { QrCode } from './QrCode';
import { RegisteredDevicesTable } from './RegisteredDevicesTable';
import { useDashboardAddresses, useDevices } from './useDevices';

function formatCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

function describeAddressFailure(
  reasonCode: DashboardAddressReasonCode | undefined,
  isExternal: boolean,
  httpStatus?: number,
): string {
  switch (reasonCode) {
    case 'connection_refused': {
      return isExternal
        ? m.admin_devices_fail_connection_refused_external()
        : m.admin_devices_fail_connection_refused_local();
    }
    case 'timeout': {
      return isExternal
        ? m.admin_devices_fail_timeout_external()
        : m.admin_devices_fail_timeout_local();
    }
    case 'dns_failed': {
      return isExternal ? m.admin_devices_fail_dns_external() : m.admin_devices_fail_dns_local();
    }
    case 'tls_error': {
      return isExternal ? m.admin_devices_fail_tls_external() : m.admin_devices_fail_tls_local();
    }
    case 'wrong_service': {
      if (httpStatus) {
        return isExternal
          ? m.admin_devices_fail_wrong_service_external_status({ status: httpStatus })
          : m.admin_devices_fail_wrong_service_local_status({ status: httpStatus });
      }

      return isExternal
        ? m.admin_devices_fail_wrong_service_external()
        : m.admin_devices_fail_wrong_service_local();
    }
    case 'network_unreachable': {
      return isExternal
        ? m.admin_devices_fail_network_external()
        : m.admin_devices_fail_network_local();
    }
    default: {
      return isExternal
        ? m.admin_devices_fail_unknown_external()
        : m.admin_devices_fail_unknown_local();
    }
  }
}

function AddressReachabilityStatus({ address }: { address: DashboardAddressInfo | null }) {
  if (!address) {
    return null;
  }

  if (address.reachable) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
        {m.admin_devices_address_reachable()}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
      <AlertCircleIcon className="size-3.5" aria-hidden="true" />
      {m.admin_devices_address_unreachable()}
    </span>
  );
}

export function DevicesPage({
  ingress,
  tabletPort,
}: {
  ingress?: boolean;
  tabletPort?: number;
} = {}) {
  useAdminLocale();
  const fallbackUrl =
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

  const { addresses, initialLoading, rechecking, recheck } = useDashboardAddresses();

  const localAddress = addresses?.local ?? null;
  const externalAddress = addresses?.external ?? null;
  const localUrl = localAddress?.url ?? fallbackUrl;
  const showExternalRow = initialLoading || externalAddress !== null;

  const [copiedKey, setCopiedKey] = useState<'local' | 'external' | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function copyAddress(url: string, key: 'local' | 'external') {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1500);
    } catch {
      toast.error(m.admin_devices_copy_url_error());
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
      toast.error(m.admin_devices_copy_code_error());
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
      toast.success(m.admin_devices_code_generated());
    } else {
      toast.error(m.admin_devices_code_error());
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{m.admin_devices_register_title()}</CardTitle>
          <CardDescription>{m.admin_devices_register_description()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {initialLoading ? (
              <Skeleton className="size-40 shrink-0 rounded-md" aria-hidden="true" />
            ) : (
              <QrCode value={localUrl} />
            )}
            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="tablet-url">{m.admin_devices_local_address()}</Label>
                    {!initialLoading && <AddressReachabilityStatus address={localAddress} />}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    disabled={initialLoading || rechecking}
                    onClick={recheck}
                  >
                    <RefreshCwIcon className={rechecking ? 'size-3.5 animate-spin' : 'size-3.5'} />
                    {m.admin_devices_address_check_again()}
                  </Button>
                </div>
                <div className="flex gap-2">
                  {initialLoading ? (
                    <Skeleton className="h-9 flex-1 rounded-md" aria-hidden="true" />
                  ) : (
                    <Input id="tablet-url" readOnly value={localUrl} className="font-mono" />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    disabled={initialLoading}
                    onClick={() => copyAddress(localUrl, 'local')}
                  >
                    {copiedKey === 'local' ? <CheckIcon /> : <CopyIcon />}
                    {copiedKey === 'local' ? m.admin_devices_copied() : m.admin_devices_copy()}
                  </Button>
                </div>
                {!initialLoading && localAddress && !localAddress.reachable ? (
                  <p className="text-muted-foreground text-xs">
                    {describeAddressFailure(
                      localAddress.reasonCode,
                      false,
                      localAddress.httpStatus,
                    )}
                  </p>
                ) : null}
              </div>

              {showExternalRow ? (
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="external-tablet-url">
                      {m.admin_devices_external_address()}
                    </Label>
                    {!initialLoading && <AddressReachabilityStatus address={externalAddress} />}
                  </div>
                  <div className="flex gap-2">
                    {initialLoading ? (
                      <Skeleton className="h-9 flex-1 rounded-md" aria-hidden="true" />
                    ) : (
                      <Input
                        id="external-tablet-url"
                        readOnly
                        value={externalAddress?.url ?? ''}
                        className="font-mono"
                      />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={initialLoading || !externalAddress}
                      onClick={() => {
                        if (externalAddress) {
                          copyAddress(externalAddress.url, 'external');
                        }
                      }}
                    >
                      {copiedKey === 'external' ? <CheckIcon /> : <CopyIcon />}
                      {copiedKey === 'external' ? m.admin_devices_copied() : m.admin_devices_copy()}
                    </Button>
                  </div>
                  {!initialLoading && externalAddress && !externalAddress.reachable ? (
                    <p className="text-muted-foreground text-xs">
                      {describeAddressFailure(
                        externalAddress.reasonCode,
                        true,
                        externalAddress.httpStatus,
                      )}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>{m.admin_devices_registration_code()}</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <output
                    aria-label={m.admin_devices_registration_code()}
                    className="bg-muted inline-flex h-10 min-w-36 items-center justify-center rounded-md border px-4 font-mono text-xl font-semibold tracking-widest"
                  >
                    {registrationCode ? formatCode(registrationCode) : '--- ---'}
                  </output>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!registrationCode}
                    onClick={copyCode}
                  >
                    {copiedCode ? <CheckIcon /> : <CopyIcon />}
                    {copiedCode ? m.admin_devices_copied() : m.admin_devices_copy()}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={regenerating}
                    onClick={handleRegenerate}
                  >
                    <RefreshCwIcon className={regenerating ? 'animate-spin' : undefined} />
                    {regenerating ? m.admin_devices_regenerating() : m.admin_devices_regenerate()}
                  </Button>
                </div>
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
