import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  DownloadIcon,
  RotateCcwIcon,
  UploadIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDraft } from '@/app/DraftContext';
import { serializeDocument } from '@/app/draft/draftReducer';
import { withoutIncomplete } from '@/app/draft/incomplete';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { JsonCodeEditor } from './JsonCodeEditor';
import { validateJsonText } from './jsonValidation';
import { UnappliedJsonDialog } from './UnappliedJsonDialog';
import { useJsonGuard } from './useJsonGuard';

export function JsonPage() {
  const { state, dispatch } = useDraft();
  // A card still being added is not part of the dashboard yet, so it is not exported.
  const current = serializeDocument(withoutIncomplete(state.document));
  // Null while the editor just mirrors the draft, so a draft that finishes loading shows up.
  const [edited, setEdited] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const text = edited ?? current;
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = edited !== null && edited !== current;

  const validation = useMemo(() => validateJsonText(text), [text]);
  const issues = readError ? [readError, ...validation.issues] : validation.issues;
  const lineCount = useMemo(() => text.split('\n').length, [text]);

  function apply(): boolean {
    if (!validation.ok || !validation.document) {
      return false;
    }

    if (serializeDocument(validation.document) !== current) {
      dispatch({ type: 'replace', document: validation.document });
    }

    setEdited(null);
    setReadError(null);
    toast.success('Validated JSON applied', { description: 'Save to publish these changes.' });

    return true;
  }

  const guard = useJsonGuard(dirty, apply);

  function reset() {
    setEdited(null);
    setReadError(null);
  }

  function formatJson() {
    try {
      const formatted = JSON.stringify(JSON.parse(text) as unknown, null, 2);

      setEdited(formatted);
      setReadError(null);
    } catch {
      // Syntax errors are surfaced live in the validation panel.
    }
  }

  const canFormat = useMemo(() => {
    try {
      JSON.parse(text);

      return true;
    } catch {
      return false;
    }
  }, [text]);

  async function importFile(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      setEdited(await file.text());
      setReadError(null);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : 'JSON file could not be read.');
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
    <Card className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden py-0">
      <CardHeader className="shrink-0 border-b px-6 py-4">
        <CardTitle>Advanced JSON editor</CardTitle>
        <CardDescription>
          Raw JSON stays isolated until you validate and apply it to the draft.
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          {validation.ok ? (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
              <span>Valid JSON · {lineCount} lines</span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5">
              <CircleAlertIcon className="size-3.5" aria-hidden="true" />
              <span>
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
              </span>
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
        <JsonCodeEditor
          aria-label="Dashboard JSON"
          value={text}
          errorLine={validation.errorLine}
          onChange={(nextText) => {
            setEdited(nextText);
            setReadError(null);
          }}
        />
        {issues.length > 0 && (
          <Alert variant="destructive" className="max-h-32 shrink-0 overflow-y-auto">
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
      </CardContent>
      <CardFooter data-json-actions className="bg-card shrink-0 flex-wrap gap-2 border-t px-6 py-3">
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
        <Button variant="outline" disabled={!canFormat} onClick={formatJson}>
          <WandSparklesIcon /> Format
        </Button>
        <Button variant="ghost" disabled={!dirty} onClick={reset}>
          <RotateCcwIcon /> Reset from editor
        </Button>
      </CardFooter>
      <UnappliedJsonDialog
        open={guard.open}
        onKeepEditing={guard.keepEditing}
        onDiscard={guard.discardAndLeave}
        onApply={guard.applyAndLeave}
      />
    </Card>
  );
}
