import { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  Code2Icon,
  DownloadIcon,
  GitCompareArrowsIcon,
  RotateCcwIcon,
  UploadIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pluralize } from '@/lib/i18n';
import { JsonCodeEditor } from './JsonCodeEditor';
import { JsonDiffView } from './JsonDiffView';
import { validateJsonText } from './jsonValidation';
import { UnappliedJsonDialog } from './UnappliedJsonDialog';
import { useJsonGuard } from './useJsonGuard';

type JsonViewMode = 'editor' | 'diff';

export function JsonPage() {
  const { state, dispatch } = useDraft();
  // A card still being added is not part of the dashboard yet, so it is not exported.
  const current = serializeDocument(withoutIncomplete(state.document));
  // Null while the editor just mirrors the draft, so a draft that finishes loading shows up.
  const [edited, setEdited] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [mode, setMode] = useState<JsonViewMode>('editor');
  const text = edited ?? current;
  const fileInput = useRef<HTMLInputElement>(null);
  const dirty = edited !== null && edited !== current;
  const hasSavedDiff = text !== state.baseline;

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
    toast.success(m.admin_json_applied_toast(), {
      description: m.admin_json_applied_description(),
    });

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
      setReadError(error instanceof Error ? error.message : m.admin_json_file_read_error());
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
        <CardTitle>{m.admin_json_title()}</CardTitle>
        <CardDescription>{m.admin_json_description()}</CardDescription>
        <CardAction className="flex flex-wrap items-center gap-2">
          <Tabs value={mode} onValueChange={(next) => setMode(next as JsonViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="editor" className="gap-1.5 px-2.5 text-xs">
                <Code2Icon className="size-3.5" aria-hidden="true" />
                {m.admin_json_tab_editor()}
              </TabsTrigger>
              <TabsTrigger value="diff" className="gap-1.5 px-2.5 text-xs">
                <GitCompareArrowsIcon className="size-3.5" aria-hidden="true" />
                {m.admin_json_tab_diff()}
                {hasSavedDiff && (
                  <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {validation.ok ? (
            <Badge
              variant="secondary"
              className="gap-1.5 bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
            >
              <CheckCircle2Icon className="size-3.5" aria-hidden="true" />
              <span>
                {pluralize(lineCount, {
                  one: m.admin_json_valid_lines_one,
                  few: m.admin_json_valid_lines_few,
                  many: m.admin_json_valid_lines_many,
                })}
              </span>
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1.5">
              <CircleAlertIcon className="size-3.5" aria-hidden="true" />
              <span>
                {pluralize(issues.length, {
                  one: m.admin_json_issues_one,
                  few: m.admin_json_issues_few,
                  many: m.admin_json_issues_many,
                })}
              </span>
            </Badge>
          )}
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-6 py-4">
        {mode === 'diff' ? (
          <JsonDiffView previous={state.baseline} current={text} />
        ) : (
          <JsonCodeEditor
            aria-label={m.admin_json_editor_aria()}
            value={text}
            errorLine={validation.errorLine}
            onChange={(nextText) => {
              setEdited(nextText);
              setReadError(null);
            }}
          />
        )}
        {issues.length > 0 && (
          <Alert variant="destructive" className="max-h-32 shrink-0 overflow-y-auto">
            <CircleAlertIcon />
            <AlertTitle>{m.admin_json_cannot_apply()}</AlertTitle>
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
        <Button onClick={apply}>{m.admin_json_validate_and_apply_amp()}</Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <UploadIcon /> {m.admin_json_import_file()}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label={m.admin_json_import_file_aria()}
          onChange={(event) => {
            importFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <Button variant="outline" onClick={download}>
          <DownloadIcon /> {m.admin_json_download()}
        </Button>
        <Button variant="outline" disabled={!canFormat} onClick={formatJson}>
          <WandSparklesIcon /> {m.admin_json_format()}
        </Button>
        <Button variant="ghost" disabled={!dirty} onClick={reset}>
          <RotateCcwIcon /> {m.admin_json_reset()}
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
