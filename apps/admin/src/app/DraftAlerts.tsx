import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDraft } from './DraftContext';

export function DraftAlerts() {
  const { loadError, recovery, saveError } = useDraft();

  return (
    <>
      {loadError && (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>
            {loadError} The editor is using a starter dashboard. It can still create a new
            dashboard, or use JSON import / export to import a valid configuration.
          </AlertDescription>
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
