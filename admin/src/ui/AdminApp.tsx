import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  Copy,
  ExternalLink,
  GripVertical,
  Home,
  Laptop,
  MonitorCog,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  Wifi,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import type { CardConfig, DashboardDocument, ViewConfig } from '../../../src/shared/config/types';
import type { IconName } from '../../../src/shared/ui/iconNames';
import { validateDashboard } from '../../../src/shared/config/validate';
import { iconNames } from '../../../src/shared/ui/iconNames';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Combobox } from '../components/ui/combobox';
import { Field, FieldLabel } from '../components/ui/field';
import { Input, Textarea } from '../components/ui/input';
import { Sheet } from '../components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { api } from '../lib/api';
import type { AccessInfo, DeviceRecord, EntityOption, ManagedConfig } from '../lib/api';
import { createCard, createView, moveItem } from '../builder';

type SelectedItem = { type: 'view' } | { type: 'card' | 'badge'; index: number };
type AdminTab = 'builder' | 'preview' | 'json';
interface Confirmation {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => void | Promise<void>;
}
const emptyDocument: DashboardDocument = {
  schemaVersion: 1,
  views: [{ id: 'home', title: 'Home', cards: [], badges: [] }],
};
const previewNonce = window.crypto.randomUUID();
const cardKinds: CardConfig['type'][] = ['light', 'outlet', 'climate', 'weather', 'pstryk'];

function serialize(document: DashboardDocument) {
  return JSON.stringify(document, null, 2);
}

function plural(value: number, single: string, multiple = `${single}s`) {
  return `${value} ${value === 1 ? single : multiple}`;
}

function EntityPicker({
  value,
  domain,
  label,
  onChange,
}: {
  value: string;
  domain: string;
  label: string;
  onChange: (entityId: string) => void;
}) {
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      const search = async () => {
        try {
          const result = await api.getEntities(query, domain);
          if (active) {
            setOptions(result.entities);
            setError('');
          }
        } catch (error: unknown) {
          if (active) {
            setError(error instanceof Error ? error.message : 'Entity search failed.');
          }
        }
        if (active) {
          setLoading(false);
        }
      };
      search();
    }, 220);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [domain, query]);

  const items = useMemo(() => {
    const values = options.map((option) => ({
      value: option.entityId,
      label: option.name,
      detail: option.state,
      unavailable: !option.available,
    }));
    if (value && !values.some((item) => item.value === value)) {
      values.unshift({
        value,
        label: `${value} · not found`,
        detail: 'Existing reference',
        unavailable: true,
      });
    }
    return values;
  }, [options, value]);
  const selected = items.find((item) => item.value === value);
  const input = query || selected?.label || value;

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Combobox
        value={value}
        inputValue={input}
        onValueChange={(next) => {
          onChange(next);
          setQuery('');
        }}
        onInputValueChange={setQuery}
        options={items}
        placeholder={`Search ${domain} by name or ID`}
        empty={loading ? 'Searching Home Assistant…' : 'No matching entities.'}
      />
      <span className="helper">
        {error ||
          (selected?.unavailable
            ? `${value} is missing or unavailable; the saved ID stays unchanged.`
            : `${plural(options.length, 'match')} · ${domain} only`)}
      </span>
    </Field>
  );
}

function AdminApp() {
  const [server, setServer] = useState<ManagedConfig | null>(null);
  const [document, setDocument] = useState<DashboardDocument>(emptyDocument);
  const [baseline, setBaseline] = useState(serialize(emptyDocument));
  const [revision, setRevision] = useState<string | null>(null);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<AdminTab>('builder');
  const [viewId, setViewId] = useState('home');
  const [selected, setSelected] = useState<SelectedItem>({ type: 'view' });
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [newCardType, setNewCardType] = useState<CardConfig['type']>('light');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [jsonDraft, setJsonDraft] = useState(serialize(emptyDocument));
  const [jsonBaseline, setJsonBaseline] = useState(serialize(emptyDocument));
  const [jsonIssues, setJsonIssues] = useState<string[]>([]);
  const [jsonExitTarget, setJsonExitTarget] = useState<AdminTab | null>(null);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [accessError, setAccessError] = useState('');
  const [pairCode, setPairCode] = useState('');
  const [deviceName, setDeviceName] = useState('iPad');
  const [pairMessage, setPairMessage] = useState('');
  const [pairError, setPairError] = useState('');
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [hostOverride, setHostOverride] = useState(() => {
    try {
      return localStorage.getItem('everdash:host-override') ?? '';
    } catch {
      return '';
    }
  });

  const dirty = serialize(document) !== baseline;
  const currentView = document.views.find((view) => view.id === viewId) ?? document.views[0];
  const cards = currentView?.cards ?? [];
  const badges = currentView?.badges ?? [];
  const selectedCard = selected.type === 'card' ? cards[selected.index] : undefined;
  const selectedBadge = selected.type === 'badge' ? badges[selected.index] : undefined;
  const selectedBadgeIndex = selected.type === 'badge' ? selected.index : -1;
  const jsonDirty = jsonDraft !== jsonBaseline;

  const openInspectorIfNarrow = () => {
    if (window.matchMedia('(max-width: 1100px)').matches) {
      setInspectorOpen(true);
    }
  };

  const loadConfig = useCallback(async () => {
    try {
      const result = await api.getConfig();
      setServer(result);
      setRevision(result.revision);
      setDocument(result.config);
      setBaseline(serialize(result.config));
      setViewId(result.config.views[0]?.id ?? 'home');
      setLoadError('');
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Dashboard settings could not be loaded.',
      );
    }
  }, []);

  const loadAccess = useCallback(async () => {
    try {
      const [result, registered] = await Promise.all([api.getAccess(), api.getDevices()]);
      setAccess(result);
      setDevices(registered);
      setAccessError(result.errors.join(' '));
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : 'Tablet access could not be loaded.');
    }
  }, []);

  useEffect(() => {
    void loadConfig();
    void loadAccess();
    const refresh = () => {
      if (!window.document.hidden) {
        void loadAccess();
      }
    };
    const timer = window.setInterval(refresh, 8000);
    window.document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.document.removeEventListener('visibilitychange', refresh);
    };
  }, [loadAccess, loadConfig]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty || jsonDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty, jsonDirty]);

  const changeDocument = (update: (previous: DashboardDocument) => DashboardDocument) => {
    setDocument((previous) => update(previous));
    setError('');
    setNotice('');
  };

  const changeView = (update: (view: ViewConfig) => ViewConfig) => {
    changeDocument((previous) => ({
      ...previous,
      views: previous.views.map((view) => (view.id === viewId ? update(view) : view)),
    }));
  };

  const changeCard = (update: (card: CardConfig) => CardConfig) => {
    if (selected.type !== 'card' || !cards[selected.index]) {
      return;
    }
    const index = selected.index;
    changeView((view) => ({
      ...view,
      cards: (view.cards ?? []).map((card, cardIndex) =>
        cardIndex === index ? update(card) : card,
      ),
    }));
  };

  const changeBadge = (
    update: (
      badge: NonNullable<ViewConfig['badges']>[number],
    ) => NonNullable<ViewConfig['badges']>[number],
  ) => {
    if (selected.type !== 'badge' || !badges[selected.index]) {
      return;
    }
    const index = selected.index;
    changeView((view) => ({
      ...view,
      badges: (view.badges ?? []).map((badge, badgeIndex) =>
        badgeIndex === index ? update(badge) : badge,
      ),
    }));
  };

  const addCard = () => {
    const next = [...cards, createCard(newCardType)];
    const index = next.length - 1;
    changeView((view) => ({ ...view, cards: next }));
    setSelected({ type: 'card', index });
    openInspectorIfNarrow();
  };

  const addBadge = () => {
    const next = [
      ...badges,
      { type: 'temperature' as const, entity: 'sensor.select_entity' as `sensor.${string}` },
    ];
    const index = next.length - 1;
    changeView((view) => ({ ...view, badges: next }));
    setSelected({ type: 'badge', index });
    openInspectorIfNarrow();
  };

  const reorderCards = (source: number, target: number) => {
    if (
      source === target ||
      source < 0 ||
      target < 0 ||
      source >= cards.length ||
      target >= cards.length
    ) {
      return;
    }
    const next = [...cards];
    const [item] = next.splice(source, 1);
    if (item) {
      next.splice(target, 0, item);
      changeView((view) => ({ ...view, cards: next }));
      setSelected({ type: 'card', index: target });
    }
  };

  const addView = () => {
    let id = `view-${Date.now().toString(36)}`;
    while (document.views.some((view) => view.id === id)) {
      id = `${id}-1`;
    }
    changeDocument((previous) => ({
      ...previous,
      views: [...previous.views, createView(id, 'New view')],
    }));
    setViewId(id);
    setSelected({ type: 'view' });
  };

  const save = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await api.saveConfig(revision, document);
      setRevision(result.revision);
      setDocument(result.config);
      setBaseline(serialize(result.config));
      setServer((previous) =>
        previous ? { ...previous, configured: true, recovery: false } : previous,
      );
      setNotice('Dashboard saved and applied to paired tablets.');
    } catch (error) {
      const issue = error as Error & {
        code?: string;
        issues?: { path?: string; message?: string }[];
      };
      setError(
        issue.code === 'CONFIG_CONFLICT'
          ? 'Another Home Assistant editor saved a newer dashboard. Your draft is unchanged; reload before saving again.'
          : issue.message,
      );
      setJsonIssues(
        issue.issues?.map((item) => `${item.path || 'Dashboard'}: ${item.message}`) ?? [],
      );
    } finally {
      setBusy(false);
    }
  };

  const loadPrevious = async () => {
    try {
      const result = await api.getPreviousConfig();
      setDocument(result.config);
      setViewId(result.config.views[0]?.id ?? 'home');
      setSelected({ type: 'view' });
      setNotice('Previous dashboard loaded into the draft. Save and apply to restore it.');
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Previous dashboard could not be loaded.');
    }
  };

  const discard = () => {
    setConfirmation({
      title: 'Discard dashboard changes?',
      description: 'This restores the last saved dashboard and removes every unsaved edit.',
      confirmLabel: 'Discard changes',
      action: () => {
        const restored = JSON.parse(baseline) as DashboardDocument;
        setDocument(restored);
        setViewId(restored.views[0]?.id ?? 'home');
        setSelected({ type: 'view' });
        setNotice('Unsaved changes discarded.');
        setError('');
      },
    });
  };

  const chooseTab = (next: AdminTab) => {
    if (tab === 'json' && jsonDirty && next !== 'json') {
      setJsonExitTarget(next);
      return;
    }
    if (next === 'json') {
      const text = serialize(document);
      setJsonDraft(text);
      setJsonBaseline(text);
      setJsonIssues([]);
    }
    setTab(next);
  };

  const applyJson = () => {
    try {
      const result = validateDashboard(JSON.parse(jsonDraft) as unknown);
      if (!result.ok) {
        setJsonIssues(
          result.issues.map((issue) => `${issue.path || 'Dashboard'}: ${issue.message}`),
        );
        return false;
      }
      setDocument(result.document);
      setViewId(result.document.views[0]?.id ?? 'home');
      setSelected({ type: 'view' });
      const text = serialize(result.document);
      setJsonDraft(text);
      setJsonBaseline(text);
      setJsonIssues([]);
      setError('');
      setNotice(
        'Validated JSON applied to the visual builder draft. Save and apply to publish it.',
      );
      return true;
    } catch (error) {
      setJsonIssues([error instanceof Error ? error.message : 'Enter valid JSON.']);
      return false;
    }
  };

  const confirmJsonExit = (apply: boolean) => {
    if (apply && !applyJson()) {
      return;
    }
    if (!apply) {
      const text = serialize(document);
      setJsonDraft(text);
      setJsonBaseline(text);
      setJsonIssues([]);
    }
    const next = jsonExitTarget;
    setJsonExitTarget(null);
    if (next) {
      setTab(next);
    }
  };

  const importJson = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      setJsonDraft(await file.text());
      setJsonIssues([]);
    } catch (error) {
      setJsonIssues([error instanceof Error ? error.message : 'JSON file could not be read.']);
    }
    event.target.value = '';
  };

  const exportJson = () => {
    const blob = new Blob([`${serialize(document)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = 'everdash-dashboard.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const approvePairing = async (event: FormEvent) => {
    event.preventDefault();
    setPairError('');
    setPairMessage('');
    try {
      await api.approvePairing(pairCode, deviceName);
      setPairCode('');
      setPairMessage('Tablet approved. It will appear in the device list when pairing completes.');
      void loadAccess();
    } catch (error) {
      setPairError(error instanceof Error ? error.message : 'Pairing approval failed.');
    }
  };

  const setHost = (value: string) => {
    const host = value.trim();
    setHostOverride(host);
    try {
      if (host) {
        localStorage.setItem('everdash:host-override', host);
      } else {
        localStorage.removeItem('everdash:host-override');
      }
    } catch {
      setAccessError('This browser could not save the tablet host override.');
    }
  };

  const accessUrl = useMemo(() => {
    if (!access?.httpPort) {
      return '';
    }
    const rawHost = hostOverride || access.hostName || access.addresses[0] || '';
    let host = rawHost.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!host) {
      return '';
    }
    if (
      rawHost === access.hostName &&
      !host.includes('.') &&
      !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)
    ) {
      host = `${host}.local`;
    }
    return `http://${host.includes(':') && !host.startsWith('[') ? `[${host}]` : host}:${access.httpPort}/`;
  }, [access, hostOverride]);

  const removeView = () => {
    if (document.views.length < 2) {
      setError('At least one view is required.');
      return;
    }
    setConfirmation({
      title: `Delete “${currentView?.title ?? 'view'}”?`,
      description: 'The view and its cards will be removed from the dashboard draft.',
      confirmLabel: 'Delete view',
      action: () => {
        const remaining = document.views.filter((view) => view.id !== viewId);
        changeDocument((previous) => ({ ...previous, views: remaining }));
        setViewId(remaining[0]?.id ?? 'home');
        setSelected({ type: 'view' });
      },
    });
  };

  const moveView = (index: number, direction: -1 | 1) => {
    changeDocument((previous) => ({
      ...previous,
      views: moveItem(previous.views, index, direction),
    }));
  };

  const duplicateCard = (index: number) => {
    const next = [...cards];
    const current = cards[index];
    if (!current) {
      return;
    }
    next.splice(index + 1, 0, { ...current });
    changeView((view) => ({ ...view, cards: next }));
    setSelected({ type: 'card', index: index + 1 });
  };

  const deleteSelected = () => {
    if (selected.type === 'card') {
      const next = cards.filter((_card, index) => index !== selected.index);
      changeView((view) => ({ ...view, cards: next }));
      setSelected({ type: 'view' });
      return;
    }
    if (selected.type === 'badge') {
      const next = badges.filter((_badge, index) => index !== selected.index);
      changeView((view) => ({ ...view, badges: next }));
      setSelected({ type: 'view' });
    }
  };

  const cardItem = (card: CardConfig, index: number) => {
    const label = card.name || card.entity;
    return (
      <div
        className={`list-item ${selected.type === 'card' && selected.index === index ? 'selected' : ''}`}
        key={`card-${index}`}
        draggable
        onDragStart={() => setDragIndex(index)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (dragIndex !== null) {
            reorderCards(dragIndex, index);
          }
          setDragIndex(null);
        }}
        onDragEnd={() => setDragIndex(null)}
      >
        <GripVertical size={16} aria-hidden="true" className="drag-handle" />
        <button
          type="button"
          className="list-item-main"
          onClick={() => {
            setSelected({ type: 'card', index });
            openInspectorIfNarrow();
          }}
          aria-label={`Edit ${card.type}: ${label}`}
        >
          <span>
            <strong>{label}</strong>
            <small>
              {card.type} · {card.entity}
            </small>
          </span>
        </button>
        <div className="item-actions">
          <button
            type="button"
            className="icon-action"
            aria-label={`Move ${label} up`}
            title="Move up"
            disabled={index === 0}
            onClick={() => reorderCards(index, index - 1)}
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            className="icon-action"
            aria-label={`Move ${label} down`}
            title="Move down"
            disabled={index === cards.length - 1}
            onClick={() => reorderCards(index, index + 1)}
          >
            <ArrowDown size={14} />
          </button>
          <button
            type="button"
            className="icon-action hide-mobile"
            aria-label={`Duplicate ${label}`}
            title="Duplicate"
            onClick={() => duplicateCard(index)}
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            className="icon-action hide-mobile"
            aria-label={`Delete ${label}`}
            title="Delete"
            onClick={() => {
              changeView((view) => ({
                ...view,
                cards: (view.cards ?? []).filter((_item, itemIndex) => itemIndex !== index),
              }));
              setSelected({ type: 'view' });
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const renderInspector = () => {
    if (selected.type === 'view') {
      return currentView ? (
        <div className="form-stack">
          <Field>
            <FieldLabel htmlFor="view-name">View name</FieldLabel>
            <Input
              id="view-name"
              value={currentView.title}
              onChange={(event) => changeView((view) => ({ ...view, title: event.target.value }))}
            />
          </Field>
          <p className="helper">
            View ID <code>{currentView.id}</code> stays stable so tablets remember the selected
            page.
          </p>
          <hr className="section-divider" />
          <h3 className="card-title">Temperature badges</h3>
          {badges.map((badge, index) => (
            <div
              className={`list-item ${selectedBadgeIndex === index ? 'selected' : ''}`}
              key={`badge-${index}`}
            >
              <button
                type="button"
                className="list-item-main"
                aria-label={`Edit temperature badge: ${badge.name || badge.entity}`}
                onClick={() => {
                  setSelected({ type: 'badge', index });
                  openInspectorIfNarrow();
                }}
              >
                <span>
                  <strong>{badge.name || badge.entity}</strong>
                  <small>Temperature badge · {badge.entity}</small>
                </span>
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addBadge}>
            <Plus size={14} /> Add temperature badge
          </Button>
          <hr className="section-divider" />
          <details>
            <summary className="status-line">
              <Settings2 size={15} /> Dashboard settings <ChevronDown size={13} />
            </summary>
            <div className="form-stack" style={{ marginTop: 14 }}>
              <Field>
                <FieldLabel htmlFor="timezone">Home timezone</FieldLabel>
                <Input
                  id="timezone"
                  placeholder="Europe/Warsaw"
                  value={document.timeZone ?? ''}
                  onChange={(event) =>
                    changeDocument((previous) => ({
                      ...previous,
                      timeZone: event.target.value || undefined,
                    }))
                  }
                />
              </Field>
              <EntityPicker
                label="Sun entity"
                value={document.sun ?? ''}
                domain="sun"
                onChange={(entity) =>
                  changeDocument((previous) => ({
                    ...previous,
                    sun: entity ? (entity as `sun.${string}`) : undefined,
                  }))
                }
              />
              <Field>
                <FieldLabel htmlFor="poll-controls">Control polling (ms)</FieldLabel>
                <Input
                  id="poll-controls"
                  type="number"
                  min="1000"
                  value={document.polling?.controlsMs ?? ''}
                  onChange={(event) =>
                    changeDocument((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        controlsMs: event.target.value ? Number(event.target.value) : undefined,
                      },
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="poll-observations">Sensor polling (ms)</FieldLabel>
                <Input
                  id="poll-observations"
                  type="number"
                  min="1000"
                  value={document.polling?.observationsMs ?? ''}
                  onChange={(event) =>
                    changeDocument((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        observationsMs: event.target.value ? Number(event.target.value) : undefined,
                      },
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="poll-metadata">Entity metadata polling (ms)</FieldLabel>
                <Input
                  id="poll-metadata"
                  type="number"
                  min="1000"
                  value={document.polling?.metadataMs ?? ''}
                  onChange={(event) =>
                    changeDocument((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        metadataMs: event.target.value ? Number(event.target.value) : undefined,
                      },
                    }))
                  }
                />
              </Field>
            </div>
          </details>
        </div>
      ) : (
        <p className="helper">Choose a view to edit its settings.</p>
      );
    }

    if (selectedCard) {
      const card = selectedCard;
      const domain =
        card.type === 'outlet' ? 'switch' : card.type === 'pstryk' ? 'sensor' : card.type;
      const pstryk = card.type === 'pstryk' ? card : null;
      return (
        <div className="form-stack">
          <div className="status-line">
            <Badge>{card.type}</Badge>
            <span>Card settings</span>
          </div>
          <EntityPicker
            label="Home Assistant entity"
            value={card.entity}
            domain={domain}
            onChange={(entity) => changeCard((current) => ({ ...current, entity }) as CardConfig)}
          />
          <Field>
            <FieldLabel htmlFor="card-name">Display name override</FieldLabel>
            <Input
              id="card-name"
              placeholder="Use Home Assistant name"
              value={card.name ?? ''}
              onChange={(event) =>
                changeCard(
                  (current) =>
                    ({ ...current, name: event.target.value || undefined }) as CardConfig,
                )
              }
            />
          </Field>
          {(card.type === 'light' || card.type === 'outlet') && (
            <Field>
              <FieldLabel htmlFor="card-icon">Icon</FieldLabel>
              <select
                className="native-select"
                id="card-icon"
                value={card.icon ?? ''}
                onChange={(event) =>
                  changeCard(
                    (current) =>
                      ({
                        ...current,
                        icon: (event.target.value || undefined) as IconName | undefined,
                      }) as CardConfig,
                  )
                }
              >
                <option value="">Default icon</option>
                {iconNames.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {card.type === 'climate' && (
            <Field>
              <FieldLabel htmlFor="climate-unit">Temperature unit</FieldLabel>
              <select
                className="native-select"
                id="climate-unit"
                value={card.temperatureUnit ?? ''}
                onChange={(event) =>
                  changeCard(
                    (current) =>
                      ({
                        ...current,
                        temperatureUnit: (event.target.value || undefined) as
                          | '°C'
                          | '°F'
                          | undefined,
                      }) as CardConfig,
                  )
                }
              >
                <option value="">Use Home Assistant unit</option>
                <option value="°C">°C Celsius</option>
                <option value="°F">°F Fahrenheit</option>
              </select>
            </Field>
          )}
          {pstryk && (
            <>
              <hr className="section-divider" />
              <h3 className="card-title">Optional Pstryk sources</h3>
              {(['sellPrice', 'nextPrice', 'usage', 'schedule'] as const).map((field) => (
                <EntityPicker
                  key={field}
                  label={
                    {
                      sellPrice: 'Sell price sensor',
                      nextPrice: 'Next price sensor',
                      usage: 'Usage sensor',
                      schedule: 'Schedule sensor',
                    }[field]
                  }
                  value={pstryk[field] ?? ''}
                  domain="sensor"
                  onChange={(entity) =>
                    changeCard(
                      (current) => ({ ...current, [field]: entity || undefined }) as CardConfig,
                    )
                  }
                />
              ))}
            </>
          )}
          <Button variant="destructive" size="sm" onClick={deleteSelected}>
            <Trash2 size={14} /> Remove card
          </Button>
        </div>
      );
    }

    if (selectedBadge) {
      return (
        <div className="form-stack">
          <div className="status-line">
            <Badge>temperature</Badge>
            <span>Badge settings</span>
          </div>
          <EntityPicker
            label="Temperature sensor"
            value={selectedBadge.entity}
            domain="sensor"
            onChange={(entity) =>
              changeBadge((badge) => ({ ...badge, entity: entity as `sensor.${string}` }))
            }
          />
          <Field>
            <FieldLabel htmlFor="badge-name">Display name override</FieldLabel>
            <Input
              id="badge-name"
              placeholder="Use Home Assistant name"
              value={selectedBadge.name ?? ''}
              onChange={(event) =>
                changeBadge((badge) => ({ ...badge, name: event.target.value || undefined }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="badge-icon">Icon</FieldLabel>
            <select
              className="native-select"
              id="badge-icon"
              value={selectedBadge.icon ?? ''}
              onChange={(event) =>
                changeBadge((badge) => ({
                  ...badge,
                  icon: (event.target.value || undefined) as typeof badge.icon,
                }))
              }
            >
              <option value="">Default icon</option>
              {iconNames.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </Field>
          <Button variant="destructive" size="sm" onClick={deleteSelected}>
            <Trash2 size={14} /> Remove badge
          </Button>
        </div>
      );
    }

    return (
      <div className="inspector-empty">
        <div>
          <CircleHelp size={24} />
          <p>Select a view, card, or badge to edit its settings.</p>
        </div>
      </div>
    );
  };

  const renderAccess = () => (
    <div className="access-grid">
      <div className="form-stack">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Open EverDash on a tablet</CardTitle>
              <CardDescription>
                This local address opens the dashboard directly, outside the Home Assistant editor.
              </CardDescription>
            </div>
            <Smartphone size={20} />
          </CardHeader>
          <CardContent>
            {accessUrl ? (
              <div className="url-block">
                <code>{accessUrl}</code>
                <div className="url-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void navigator.clipboard?.writeText(accessUrl)}
                  >
                    <Copy size={14} /> Copy
                  </Button>
                  <a
                    className="button button-sm button-outline"
                    href={accessUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={14} /> Open
                  </a>
                </div>
              </div>
            ) : (
              <Alert>
                <Wifi size={16} />{' '}
                {accessError ||
                  'Home Assistant has not reported an active LAN port mapping for EverDash.'}
              </Alert>
            )}
            {access?.addresses.length ? (
              <div className="form-stack" style={{ marginTop: 13 }}>
                <span className="helper">Detected Home Assistant addresses</span>
                {access.addresses.map((address) => (
                  <div className="url-block" key={address}>
                    <code>
                      {access.httpPort ? `http://${address}:${access.httpPort}/` : address}
                    </code>
                    {access.httpPort && (
                      <Button size="sm" variant="ghost" onClick={() => setHost(address)}>
                        Use this address
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            <hr className="section-divider" />
            <Field>
              <FieldLabel htmlFor="host-override">Tablet host override</FieldLabel>
              <Input
                id="host-override"
                placeholder="homeassistant.local or 192.168.1.20"
                value={hostOverride}
                onChange={(event) => setHost(event.target.value)}
              />
              <span className="helper">
                Saved in this Home Assistant browser. Enter a local hostname or IP; the mapped port
                is added automatically.
              </span>
            </Field>
            {access?.httpsPort && (
              <p className="footer-note">
                Trusted HTTPS dashboard is also available on port {access.httpsPort}.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Register a tablet</CardTitle>
              <CardDescription>
                On the iPad, open the address above and start pairing. Enter its code here to
                approve it.
              </CardDescription>
            </div>
            <ShieldCheck size={20} />
          </CardHeader>
          <CardContent>
            <form className="form-row" onSubmit={(event) => void approvePairing(event)}>
              <Field>
                <FieldLabel htmlFor="pair-code">Pairing code</FieldLabel>
                <Input
                  id="pair-code"
                  inputMode="text"
                  autoComplete="off"
                  maxLength={8}
                  value={pairCode}
                  onChange={(event) => setPairCode(event.target.value.toUpperCase())}
                  placeholder="ABCD2345"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="device-name">Device name</FieldLabel>
                <Input
                  id="device-name"
                  value={deviceName}
                  maxLength={80}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="Kitchen iPad"
                />
              </Field>
              <Button type="submit" disabled={pairCode.trim().length < 8 || !deviceName.trim()}>
                <Check size={15} /> Approve tablet
              </Button>
            </form>
            {pairMessage && (
              <p className="status-line" style={{ marginTop: 10 }}>
                <Check size={14} /> {pairMessage}
              </p>
            )}
            {pairError && (
              <p role="alert" className="inline-error" style={{ marginTop: 10 }}>
                {pairError}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Registered tablets</CardTitle>
              <CardDescription>
                Access refreshes automatically while this page is open.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void loadAccess()}>
              <RotateCcw size={14} /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {devices.length ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Tablet</TableHeader>
                    <TableHeader>Added</TableHeader>
                    <TableHeader aria-label="Actions" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <strong>{device.label}</strong>
                      </TableCell>
                      <TableCell>{new Date(device.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            setConfirmation({
                              title: `Revoke ${device.label}?`,
                              description:
                                'This tablet will need to pair again before it can open EverDash.',
                              confirmLabel: 'Revoke tablet',
                              action: async () => {
                                try {
                                  await api.revokeDevice(device.id);
                                  await loadAccess();
                                } catch (error) {
                                  setError(
                                    error instanceof Error
                                      ? error.message
                                      : 'Tablet could not be revoked.',
                                  );
                                }
                              },
                            })
                          }
                        >
                          <Trash2 size={14} /> Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="helper">No tablets have been paired yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="form-stack">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Scan to open</CardTitle>
              <CardDescription>
                Point the iPad camera at this QR code while connected to your home network.
              </CardDescription>
            </div>
            <Laptop size={20} />
          </CardHeader>
          <CardContent>
            {accessUrl ? (
              <div className="qr-card">
                <QRCodeSVG
                  value={accessUrl}
                  level="M"
                  includeMargin
                  aria-label={`QR code for ${accessUrl}`}
                />
                <code>{accessUrl}</code>
              </div>
            ) : (
              <p className="helper">A QR code appears when the LAN address is available.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>How the connection works</CardTitle>
              <CardDescription>
                EverDash keeps Home Assistant credentials on the server.
              </CardDescription>
            </div>
            <Home size={20} />
          </CardHeader>
          <CardContent>
            <div className="form-stack">
              <p className="status-line">
                <ShieldCheck size={15} /> Home Assistant login protects this builder.
              </p>
              <p className="status-line">
                <Wifi size={15} /> Pairing gives the tablet its own revocable session.
              </p>
              <p className="status-line">
                <MonitorCog size={15} /> The direct dashboard URL has no management controls.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (loadError && !server) {
    return (
      <main className="admin-shell">
        <Topbar />
        <div className="workspace">
          <Alert>
            <CircleHelp size={16} /> {loadError}
          </Alert>
          <p className="helper">
            The visual editor can still create a new dashboard, or use the Advanced JSON tab to
            import a valid configuration.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <Topbar />
      <main className="workspace">
        <div className="page-heading">
          <div>
            <h1>Dashboard builder</h1>
            <p>Choose what appears on your legacy tablet and arrange it by view.</p>
          </div>
          <div className="heading-actions">
            <div className={`save-state ${dirty ? 'dirty' : ''}`} aria-live="polite">
              {dirty ? (
                <>
                  <span className="status-dot pending" /> Unsaved changes
                </>
              ) : (
                <>
                  <span className="status-dot" />{' '}
                  {server?.configured ? 'All changes saved' : 'Setup not saved yet'}
                </>
              )}
            </div>
            <Button onClick={() => void save()} disabled={!dirty || busy}>
              <Save size={15} /> {busy ? 'Saving…' : 'Save and apply'}
            </Button>
            <Button variant="outline" disabled={!dirty || busy} onClick={discard}>
              <RotateCcw size={14} /> Discard
            </Button>
          </div>
        </div>
        {loadError && (
          <Alert>
            <CircleHelp size={16} /> {loadError} The editor is using a starter dashboard.
          </Alert>
        )}
        {server?.recovery && (
          <Alert>
            <RotateCcw size={16} />{' '}
            {server.diagnostic ||
              'Saved settings need recovery. Import a valid document or build a replacement, then save it.'}
          </Alert>
        )}
        {server?.previousAvailable && (
          <Alert className="alert-info">
            <RotateCcw size={16} /> A previous dashboard is available.{' '}
            <Button size="sm" variant="outline" onClick={() => void loadPrevious()}>
              Load previous version
            </Button>
          </Alert>
        )}
        {error && (
          <Alert>
            <CircleHelp size={16} /> {error}
          </Alert>
        )}
        {notice && (
          <Alert className="alert-info">
            <Check size={16} /> {notice}
          </Alert>
        )}
        <Tabs value={tab} onValueChange={(value) => chooseTab(value as AdminTab)}>
          <TabsList aria-label="EverDash workspace">
            <TabsTrigger value="builder">
              <Settings2 size={15} /> Builder
            </TabsTrigger>
            <TabsTrigger value="preview">
              <MonitorCog size={15} /> Preview
            </TabsTrigger>
            <TabsTrigger value="json">
              <span className="hide-mobile">Advanced </span>JSON
            </TabsTrigger>
          </TabsList>
          <TabsContent value="builder">
            <div className="builder-grid">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Views</CardTitle>
                    <CardDescription>Pages available on your tablet</CardDescription>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Add view"
                    title="Add view"
                    onClick={addView}
                  >
                    <Plus size={16} />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="list-stack">
                    {document.views.map((view, index) => (
                      <div
                        className={`list-item ${view.id === viewId && selected.type === 'view' ? 'selected' : ''}`}
                        key={view.id}
                      >
                        <button
                          type="button"
                          className="list-item-main"
                          aria-label={`Select view ${view.title}`}
                          onClick={() => {
                            setViewId(view.id);
                            setSelected({ type: 'view' });
                          }}
                        >
                          <span>
                            <strong>{view.title}</strong>
                            <small>{view.id}</small>
                          </span>
                        </button>
                        <div className="item-actions">
                          <button
                            className="icon-action"
                            type="button"
                            aria-label={`Move ${view.title} up`}
                            disabled={index === 0}
                            onClick={() => moveView(index, -1)}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            className="icon-action"
                            type="button"
                            aria-label={`Move ${view.title} down`}
                            disabled={index === document.views.length - 1}
                            onClick={() => moveView(index, 1)}
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {document.views.length > 1 && (
                    <Button className="view-delete" variant="ghost" size="sm" onClick={removeView}>
                      <Trash2 size={14} /> Delete current view
                    </Button>
                  )}
                </CardContent>
              </Card>
              <Card>
                <div className="view-heading">
                  <div>
                    <h2>{currentView?.title || 'View cards'}</h2>
                    <p className="card-description">Drag to arrange, or use the move buttons.</p>
                  </div>
                  <Badge>{plural(cards.length, 'card')}</Badge>
                </div>
                <CardContent>
                  <div className="list-stack">
                    {cards.length ? (
                      cards.map(cardItem)
                    ) : (
                      <div className="inspector-empty" style={{ minHeight: 110 }}>
                        <div>
                          <Cloud size={22} />
                          <p>No cards yet. Add your first device or home information card.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="add-row">
                    <select
                      className="native-select"
                      aria-label="New card type"
                      value={newCardType}
                      onChange={(event) => setNewCardType(event.target.value as CardConfig['type'])}
                    >
                      {cardKinds.map((kind) => (
                        <option key={kind} value={kind}>
                          {kind === 'pstryk'
                            ? 'Pstryk energy'
                            : kind[0]?.toUpperCase() + kind.slice(1)}
                        </option>
                      ))}
                    </select>
                    <Button onClick={addCard}>
                      <Plus size={15} /> Add card
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="builder-inspector">
                <CardHeader>
                  <div>
                    <CardTitle>
                      {selected.type === 'view'
                        ? 'View settings'
                        : selected.type === 'badge'
                          ? 'Badge inspector'
                          : 'Card inspector'}
                    </CardTitle>
                    <CardDescription>Changes update the draft as you edit.</CardDescription>
                  </div>
                  {selected.type !== 'view' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Close inspector"
                      onClick={() => setSelected({ type: 'view' })}
                    >
                      <X size={15} />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>{renderInspector()}</CardContent>
              </Card>
            </div>
            <div className="json-actions">
              <Button onClick={() => void save()} disabled={!dirty || busy}>
                <Save size={15} /> {busy ? 'Saving…' : 'Save and apply'}
              </Button>
              <Button variant="outline" disabled={!dirty || busy} onClick={discard}>
                <RotateCcw size={14} /> Discard changes
              </Button>
              <span className="helper">The tablet keeps its current automatic layout.</span>
            </div>
            <section style={{ marginTop: 26 }} aria-label="Tablet access">
              {renderAccess()}
            </section>
          </TabsContent>
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Tablet preview</CardTitle>
                  <CardDescription>
                    Uses the current unsaved builder draft and a read-only Home Assistant snapshot.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.dispatchEvent(new Event('everdash-preview-refresh'))}
                >
                  <RotateCcw size={14} /> Refresh preview
                </Button>
              </CardHeader>
              <CardContent>
                <PreviewFrame document={document} active={tab === 'preview'} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="json">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Advanced JSON editor</CardTitle>
                  <CardDescription>
                    Optional raw editing for imports and advanced changes.
                  </CardDescription>
                </div>
                <Badge>Schema v1</Badge>
              </CardHeader>
              <CardContent>
                <p className="json-help">
                  The builder remains the primary editor. Raw JSON stays isolated until you validate
                  it and choose <strong>Apply JSON</strong>.
                </p>
                <Textarea
                  aria-label="Dashboard JSON"
                  spellCheck={false}
                  value={jsonDraft}
                  onChange={(event) => {
                    setJsonDraft(event.target.value);
                    setJsonIssues([]);
                  }}
                />
                {jsonIssues.length > 0 && (
                  <Alert>
                    <div>
                      {jsonIssues.map((issue) => (
                        <p key={issue}>{issue}</p>
                      ))}
                    </div>
                  </Alert>
                )}
                <div className="json-actions">
                  <Button onClick={applyJson}>
                    <Check size={14} /> Validate and apply JSON
                  </Button>
                  <label className="button button-outline button-sm">
                    <Upload size={14} /> Import JSON
                    <input
                      type="file"
                      accept="application/json,.json"
                      hidden
                      onChange={importJson}
                    />
                  </label>
                  <Button variant="outline" size="sm" onClick={exportJson}>
                    <ExternalLink size={14} /> Download current JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const text = serialize(document);
                      setJsonDraft(text);
                      setJsonBaseline(text);
                      setJsonIssues([]);
                    }}
                  >
                    Reset editor from builder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      {confirmation && (
        <Dialog.Root open onOpenChange={(open) => !open && setConfirmation(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="sheet-backdrop" />
            <Dialog.Popup className="confirm-dialog">
              <Dialog.Title className="card-title">{confirmation?.title}</Dialog.Title>
              <Dialog.Description className="confirm-description">
                {confirmation?.description}
              </Dialog.Description>
              <div className="confirm-actions">
                <Dialog.Close className="button button-outline">Cancel</Dialog.Close>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    await confirmation?.action();
                    setConfirmation(null);
                  }}
                >
                  {confirmation?.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen} title="Inspector">
        <div className="form-stack">{renderInspector()}</div>
      </Sheet>
      {jsonExitTarget && (
        <Dialog.Root open onOpenChange={(open) => !open && confirmJsonExit(false)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="sheet-backdrop" />
            <Dialog.Popup className="confirm-dialog">
              <Dialog.Title className="card-title">Unapplied JSON changes</Dialog.Title>
              <Dialog.Description className="confirm-description">
                Apply the JSON to the visual builder draft, or discard the raw edits before leaving
                this tab.
              </Dialog.Description>
              <div className="confirm-actions">
                <Button variant="outline" onClick={() => confirmJsonExit(false)}>
                  Discard JSON
                </Button>
                <Button onClick={() => confirmJsonExit(true)}>Validate and apply</Button>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      )}
      <footer className="workspace footer-note">
        EverDash keeps your schema version 1 document compatible with the existing iPad dashboard.
      </footer>
    </div>
  );
}

function Topbar() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <Home size={20} />
        </div>
        <div className="brand-copy">
          <strong>EverDash</strong>
          <span>Home Assistant workspace</span>
        </div>
      </div>
      <a
        className="button button-ghost button-sm"
        href="https://github.com/beniaminrychter/everdash"
        target="_blank"
        rel="noreferrer"
      >
        EverDash project <ExternalLink size={13} />
      </a>
    </header>
  );
}

function PreviewFrame({ document, active }: { document: DashboardDocument; active: boolean }) {
  const [frameReady, setFrameReady] = useState(false);
  const [error, setError] = useState('');
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const sendDraft = useCallback(async () => {
    if (!frame?.contentWindow || !frameReady || !active) {
      return;
    }
    try {
      const result = await api.preview(document);
      frame.contentWindow.postMessage(
        {
          type: 'everdash.preview',
          nonce: previewNonce,
          config: result.config,
          states: result.states,
        },
        '*',
      );
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Preview data could not be loaded.');
    }
  }, [active, document, frame, frameReady]);
  useEffect(() => {
    if (frameReady && active) {
      void sendDraft();
    }
  }, [active, frameReady, sendDraft]);
  useEffect(() => {
    const receive = (event: MessageEvent<unknown>) => {
      if (event.source !== frame?.contentWindow || event.origin !== 'null') {
        return;
      }
      if (typeof event.data !== 'object' || event.data === null || !('type' in event.data)) {
        return;
      }
      const data = event.data as { type?: unknown; nonce?: unknown };
      if (data.type !== 'everdash.preview.ready' || data.nonce !== previewNonce) {
        return;
      }
      frame?.contentWindow?.postMessage({ type: 'everdash.preview.ack', nonce: previewNonce }, '*');
      setFrameReady(true);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [frame]);
  useEffect(() => {
    const refresh = () => void sendDraft();
    window.addEventListener('everdash-preview-refresh', refresh);
    return () => window.removeEventListener('everdash-preview-refresh', refresh);
  }, [sendDraft]);

  return (
    <>
      {error && (
        <Alert>
          <CircleHelp size={15} /> {error}
        </Alert>
      )}
      <iframe
        ref={setFrame}
        title="Read-only EverDash tablet preview"
        className="preview-frame"
        src={`preview/?nonce=${encodeURIComponent(previewNonce)}&parentOrigin=${encodeURIComponent(window.location.origin)}`}
        sandbox="allow-scripts"
      />
      {!frameReady && <p className="helper">Loading the tablet renderer…</p>}
    </>
  );
}

export { AdminApp };
