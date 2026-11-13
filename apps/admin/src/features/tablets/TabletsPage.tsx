import { useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PairedDevicesTable } from './PairedDevicesTable';
import { QrCode } from './QrCode';
import { useTabletAccess } from './useTabletAccess';

const pinLength = 6;
const minimumPinLength = 4;

export function TabletsPage() {
  const dashboardUrl = `${window.location.origin}/`;
  const { status, devices, save } = useTabletAccess();
  const protectedNow = status === 'pin_required';
  const statusUnknown = status === 'unavailable';
  // Null until the switch is touched, so it follows the saved PIN state.
  const [override, setOverride] = useState<boolean | null>(null);
  const enabled = override ?? protectedNow;
  const [pin, setPin] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // With an unknown status, saving the switch off must stay possible so a PIN can be removed.
  const canSave =
    !saving && (enabled ? pin.length >= minimumPinLength : protectedNow || statusUnknown);
  let protectionHint = 'Anyone who can reach this address can open the dashboard.';

  if (protectedNow) {
    protectionHint = 'Tablets ask for a PIN. Turn this off and save to remove it.';
  } else if (statusUnknown) {
    protectionHint = 'Unable to read the current PIN setting. Saving replaces it.';
  }

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(dashboardUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Unable to copy the address.');
    }
  }

  async function saveAccess() {
    setSaving(true);

    const saved = await save(enabled ? pin : null);

    setSaving(false);

    if (saved) {
      setPin('');
      setOverride(null);
      toast.success('Dashboard access saved.');
    } else {
      toast.error('Unable to save access settings.');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tablet access</CardTitle>
          <CardDescription>
            Open the dashboard on a tablet by scanning the code or typing the address. No pairing is
            required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <QrCode value={dashboardUrl} />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="tablet-url">Tablet address</Label>
              <div className="flex gap-2">
                <Input id="tablet-url" readOnly value={dashboardUrl} className="font-mono" />
                <Button variant="outline" onClick={copyUrl}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="pin-protection">PIN protection</Label>
              <p className="text-muted-foreground text-xs">{protectionHint}</p>
            </div>
            <Switch id="pin-protection" checked={enabled} onCheckedChange={setOverride} />
          </div>
          {enabled && (
            <div className="space-y-2">
              <Label htmlFor="tablet-pin">{protectedNow ? 'New PIN' : 'PIN'}</Label>
              <InputOTP
                id="tablet-pin"
                maxLength={pinLength}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                value={pin}
                onChange={setPin}
              >
                <InputOTPGroup>
                  {Array.from({ length: pinLength }, (_unused, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              <p className="text-muted-foreground text-xs">Use 4–6 digits.</p>
            </div>
          )}
          <Button disabled={!canSave} onClick={saveAccess}>
            {saving ? 'Saving…' : 'Save access'}
          </Button>
        </CardContent>
      </Card>
      {devices.length > 0 && <PairedDevicesTable devices={devices} />}
    </>
  );
}
