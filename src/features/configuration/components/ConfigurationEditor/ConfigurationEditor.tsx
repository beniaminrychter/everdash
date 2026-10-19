import { useEffect, useState } from 'preact/hooks';
import { useI18n } from '../../../../shared/i18n/index';
import type { DashboardDocument } from '../../../../shared/config/types';
import type { ConfigIssue } from '../../../../shared/config/validate';
import { validateDashboard } from '../../../../shared/config/validate';
import { configurationApi } from '../../data/api';
import type { RuntimeSnapshot } from '../../data/api';
import styles from './ConfigurationEditor.module.css';

interface Props {
  initial: RuntimeSnapshot;
  onPublished: (snapshot: RuntimeSnapshot) => void;
}

function serialize(config: DashboardDocument): string {
  return JSON.stringify(config, null, 2);
}

export function ConfigurationEditor({ initial, onPublished }: Props) {
  const { t } = useI18n();
  const [baseRevision, setBaseRevision] = useState(initial.revision);
  const [baseline, setBaseline] = useState(serialize(initial.config));
  const [draft, setDraft] = useState(serialize(initial.config));
  const [previousAvailable, setPreviousAvailable] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [issues, setIssues] = useState<ConfigIssue[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const dirty = draft !== baseline;

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const config = await configurationApi.get();
        if (active) {
          const text = serialize(config.config);
          setBaseRevision(config.revision);
          setBaseline(text);
          setDraft(text);
          setPreviousAvailable(config.previousAvailable);
          setConfigured(config.configured);
        }
      } catch (error) {
        if (active) {
          setError(
            error instanceof Error ? error.message : t('Configuration could not be loaded.'),
          );
        }
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [t]);

  const parseDraft = (): unknown => {
    try {
      return JSON.parse(draft) as unknown;
    } catch {
      setIssues([{ path: '', message: t('Enter valid JSON before continuing.') }]);
      return undefined;
    }
  };

  const validate = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const input = parseDraft();
    if (input === undefined) {
      setBusy(false);
      return;
    }
    try {
      const result = await configurationApi.validate(input);
      setDraft(serialize(result.config));
      setIssues([]);
      setMessage(t('Dashboard JSON is valid.'));
    } catch (error) {
      const failure = error as Error & { issues?: ConfigIssue[] };
      setIssues(failure.issues ?? []);
      setError(failure.message);
    }
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const input = parseDraft();
    if (input === undefined) {
      setBusy(false);
      return;
    }
    try {
      const snapshot = await configurationApi.save(baseRevision, input);
      const text = serialize(snapshot.config);
      setBaseRevision(snapshot.revision);
      setBaseline(text);
      setDraft(text);
      setPreviousAvailable(configured);
      setConfigured(true);
      setIssues([]);
      setMessage(t('Dashboard saved and applied.'));
      onPublished(snapshot);
    } catch (error) {
      const failure = error as Error & { issues?: ConfigIssue[]; code?: string };
      setIssues(failure.issues ?? []);
      setError(
        failure.code === 'CONFIG_CONFLICT'
          ? t('Another editor saved a newer dashboard. Your draft is unchanged.')
          : failure.message,
      );
    }
    setBusy(false);
  };

  const importFile = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        setDraft(reader.result);
        setIssues([]);
        setMessage(t('Imported as a draft. Validate before saving.'));
        setError('');
      }
      input.value = '';
    });
    reader.addEventListener('error', () => {
      setError(t('The selected file could not be read.'));
      input.value = '';
    });
    // Safari 12 does not support Blob.text().
    // oxlint-disable-next-line unicorn/prefer-blob-reading-methods
    reader.readAsText(file);
  };

  const download = () => {
    const input = parseDraft();
    if (input === undefined) {
      return;
    }
    const validation = validateDashboard(input);
    if (!validation.ok) {
      setIssues(validation.issues);
      setMessage('');
      return;
    }
    const blob = new Blob([`${JSON.stringify(validation.document, null, 2)}\n`], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'everdash-dashboard.json';
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const restorePrevious = async () => {
    setError('');
    try {
      const previous = await configurationApi.previous();
      setDraft(serialize(previous.config));
      setIssues([]);
      setMessage(t('Previous dashboard loaded as a draft. Save to apply it.'));
    } catch (error) {
      setError(error instanceof Error ? error.message : t('No previous dashboard is available.'));
    }
  };

  return (
    <section class={styles.editor} aria-label={t('Dashboard JSON configuration')}>
      <p>{t('Edit the dashboard JSON. Changes apply to paired tablets after you save.')}</p>
      {dirty && (
        <output class={styles.dirty} aria-live="polite">
          {t('Unsaved dashboard changes.')}
        </output>
      )}
      <label for="dashboard-json">{t('Dashboard JSON')}</label>
      <textarea
        id="dashboard-json"
        value={draft}
        spellcheck={false}
        onInput={(event) => setDraft((event.currentTarget as HTMLTextAreaElement).value)}
      />
      <div class={styles.actions}>
        <button type="button" disabled={busy} onClick={validate}>
          {t('Validate')}
        </button>
        <button type="button" disabled={busy || !dirty} onClick={save}>
          {t('Save and apply')}
        </button>
        <label class={styles.fileLabel}>
          {t('Import JSON')}
          <input type="file" accept="application/json,.json" onChange={importFile} />
        </label>
        <button type="button" onClick={download}>
          {t('Download JSON')}
        </button>
        <button type="button" disabled={!previousAvailable} onClick={restorePrevious}>
          {t('Restore previous')}
        </button>
      </div>
      <output class={styles.message} aria-live="polite">
        {message}
      </output>
      {error && <p role="alert">{error}</p>}
      {issues.length > 0 && (
        <ul class={styles.issues} aria-label={t('Validation issues')}>
          {issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`}>
              <strong>{issue.path || t('Dashboard')}:</strong> {issue.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
