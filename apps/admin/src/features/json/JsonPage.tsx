import { useMemo, useRef, useState } from 'react';
import {
  CircleAlertIcon,
  DownloadIcon,
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
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { pluralize } from '@/lib/i18n';
import { JsonCodeEditor } from './JsonCodeEditor';
import { JsonDiffView } from './JsonDiffView';
import { validateJsonText } from './jsonValidation';
import { UnappliedJsonDialog } from './UnappliedJsonDialog';
import { useJsonGuard } from './useJsonGuard';

type JsonViewMode = 'editor' | 'diff';

const jsonPanelClass =
  'flex min-h-0 min-w-0 flex-col data-[state=inactive]:hidden max-md:h-[clamp(12rem,45svh,28rem)] max-md:flex-none';

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
    <Card className="min-h-0 min-w-0 shrink-0 gap-0 overflow-hidden py-0 md:flex-1">
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-4 py-3 sm:px-6">
        <Tabs
          value={mode}
          onValueChange={(next) => setMode(next as JsonViewMode)}
          className="min-h-0 flex-1 gap-3"
        >
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="editor" className="px-3">
                {m.admin_json_tab_editor()}
              </TabsTrigger>
              <TabsTrigger value="diff" className="px-3">
                {m.admin_json_tab_diff()}
                {hasSavedDiff && (
                  <span className="bg-primary size-1.5 rounded-full" aria-hidden="true" />
                )}
              </TabsTrigger>
            </TabsList>
            {validation.ok ? (
              <Badge
                variant="secondary"
                className="bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
              >
                {m.admin_json_valid()}
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
          </div>
          <TabsContent value="editor" className={jsonPanelClass}>
            <JsonCodeEditor
              aria-label={m.admin_json_editor_aria()}
              value={text}
              errorLine={validation.errorLine}
              onChange={(nextText) => {
                setEdited(nextText);
                setReadError(null);
              }}
            />
          </TabsContent>
          <TabsContent value="diff" className={jsonPanelClass}>
            <JsonDiffView previous={state.baseline} current={text} />
          </TabsContent>
        </Tabs>
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
      <CardFooter
        data-json-actions
        className="bg-card shrink-0 flex-wrap gap-2 border-t px-4 pt-3 pb-3 sm:px-6 [.border-t]:pt-3"
      >
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
