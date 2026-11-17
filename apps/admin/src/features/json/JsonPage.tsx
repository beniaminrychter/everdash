import { useRef, useState } from 'react';
import { CircleAlertIcon, DownloadIcon, RotateCcwIcon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { useDraft } from '@/app/DraftContext';
import { serializeDocument } from '@/app/draft/draftReducer';
import { withoutIncomplete } from '@/app/draft/incomplete';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { UnappliedJsonDialog } from './UnappliedJsonDialog';
import { useJsonGuard } from './useJsonGuard';

export function JsonPage() {
  const { state, dispatch } = useDraft();
  // A card still being added is not part of the dashboard yet, so it is not exported.
  const current = serializeDocument(withoutIncomplete(state.document));
  // Null while the textarea just mirrors the draft, so a draft that finishes loading shows up.
  const [edited, setEdited] = useState<string | null>(null);
  const text = edited ?? current;
  const [issues, setIssues] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = edited !== null && edited !== current;

  function apply(): boolean {
    try {
      const result = validateDashboard(JSON.parse(text) as unknown);

      if (!result.ok) {
        setIssues(result.issues.map((issue) => `${issue.path || 'Dashboard'}: ${issue.message}`));

        return false;
      }

      if (serializeDocument(result.document) !== current) {
        dispatch({ type: 'replace', document: result.document });
      }

      setEdited(null);
      setIssues([]);
      toast.success('Validated JSON applied', { description: 'Save to publish these changes.' });

      return true;
    } catch (error) {
      setIssues([error instanceof Error ? error.message : 'Enter valid JSON.']);

      return false;
    }
  }

  const guard = useJsonGuard(dirty, apply);

  function reset() {
    setEdited(null);
    setIssues([]);
  }

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setEdited(await file.text());
      setIssues([]);
    } catch (error) {
      setIssues([error instanceof Error ? error.message : 'JSON file could not be read.']);
    }
  }

  function download() {
    const blob = new Blob([`${current}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');

    anchor.href = url;
    anchor.download = 'everdash-dashboard.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced JSON editor</CardTitle>
        <CardDescription>
          The editor stays the primary way to change the dashboard. Raw JSON stays isolated until
          you validate it and apply it to the draft.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          aria-label="Dashboard JSON"
          spellCheck={false}
          className="min-h-[480px] font-mono text-xs"
          value={text}
          onChange={(event) => {
            setEdited(event.target.value);
            setIssues([]);
          }}
        />
        {issues.length > 0 && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>The JSON can not be applied</AlertTitle>
            <AlertDescription>
              <ul className="list-disc space-y-1 pl-4">
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={apply}>Validate &amp; apply</Button>
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <UploadIcon /> Import file
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import JSON file"
            onChange={(event) => {
              importFile(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <Button variant="outline" onClick={download}>
            <DownloadIcon /> Download
          </Button>
          <Button variant="ghost" onClick={reset}>
            <RotateCcwIcon /> Reset from editor
          </Button>
        </div>
      </CardContent>
      <UnappliedJsonDialog
        open={guard.open}
        onKeepEditing={guard.keepEditing}
        onDiscard={guard.discardAndLeave}
        onApply={guard.applyAndLeave}
      />
    </Card>
  );
}
