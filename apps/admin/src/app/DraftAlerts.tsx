import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDraft } from './DraftContext';

export function DraftAlerts() {
  const { loadError, recovery, saveError } = useDraft();

  return (
    <>
      {loadError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{m.admin_load_error_fallback({ error: loadError })}</AlertDescription>
        </Alert>
      )}
      {recovery && (
        <Alert>
          <RotateCcwIcon />
          <AlertDescription>{recovery}</AlertDescription>
        </Alert>
      )}
      {saveError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
