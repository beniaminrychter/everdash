import {
  Bed,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  CloudRain,
  CloudSun,
  Home,
  Copy,
  Coffee,
  Clapperboard,
  ExternalLink,
  Laptop,
  MoreHorizontal,
  LampDesk,
  LampFloor,
  Lightbulb,
  Moon,
  Plus,
  RotateCcw,
  Save,
  Share2,
  Settings2,
  Trash2,
  Thermometer,
  Plug,
  Sofa,
  Sun,
  Sunrise,
  UserRound,
  Upload,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import type {
  BadgeConfig,
  CardConfig,
  DashboardDocument,
  ViewConfig,
} from '../../../src/shared/config/types';
import type { IconName } from '../../../src/shared/ui/iconNames';
import { validateDashboard } from '../../../src/shared/config/validate';
import { iconNames } from '../../../src/shared/ui/iconNames';
import { Alert } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { Combobox } from '../components/ui/combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Field, FieldLabel } from '../components/ui/field';
import { Input, Textarea } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Sheet } from '../components/ui/sheet';
import { Toaster, toastManager } from '../components/ui/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { api } from '../lib/api';
import type { AccessInfo, DeviceRecord, EntityOption, ManagedConfig } from '../lib/api';
import {
  createCard,
  createConfiguredCard,
  createView,
  isCardEditorMessage,
  moveItem,
} from '../builder';

type SelectedItem = { type: 'view' } | { type: 'card' | 'badge'; index: number };
type AdminTab = 'dashboard' | 'devices' | 'json';
interface CardDraft {
  mode: 'add' | 'edit';
  viewId: string;
  index: number;
  value: CardConfig;
}
interface BadgeDraft {
  mode: 'add' | 'edit';
  viewId: string;
  index: number;
  value: BadgeConfig;
}
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
function createPreviewNonce() {
  const cryptoApi = window.crypto;
  if (typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof cryptoApi.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 256);
    });
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

const previewNonce = createPreviewNonce();
const cardKinds: CardConfig['type'][] = ['light', 'outlet', 'climate', 'weather', 'pstryk'];
const iconComponents = {
  away: UserRound,
  bed: Bed,
  bulb: Lightbulb,
  check: Check,
  close: X,
  cloud: Cloud,
  coffee: Coffee,
  'desk-lamp': LampDesk,
  'floor-lamp': LampFloor,
  home: Home,
  laptop: Laptop,
  moon: Moon,
  more: Settings2,
  movie: Clapperboard,
  outlet: Plug,
  pendant: Lightbulb,
  plug: Plug,
  rain: CloudRain,
  share: Share2,
  sliders: Settings2,
  sofa: Sofa,
  sun: Sun,
  sunrise: Sunrise,
  thermometer: Thermometer,
} satisfies Record<IconName, typeof Home>;

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
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [viewId, setViewId] = useState('home');
  const [draftGeneration, setDraftGeneration] = useState(0);
  const [selected, setSelected] = useState<SelectedItem>({ type: 'view' });
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [cardDraft, setCardDraft] = useState<CardDraft | null>(null);
  const [badgeDraft, setBadgeDraft] = useState<BadgeDraft | null>(null);
  const [viewDraft, setViewDraft] = useState<{ viewId: string; value: ViewConfig } | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<DashboardDocument | null>(null);
  const [cardChooserOpen, setCardChooserOpen] = useState(false);
  const [viewActionsOpen, setViewActionsOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(serialize(emptyDocument));
  const [jsonBaseline, setJsonBaseline] = useState(serialize(emptyDocument));
  const [jsonIssues, setJsonIssues] = useState<string[]>([]);
  const [jsonExitTarget, setJsonExitTarget] = useState<AdminTab | null>(null);
  const [access, setAccess] = useState<AccessInfo | null>(null);
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [accessError, setAccessError] = useState('');
  const [pairCode, setPairCode] = useState('');
  const [deviceName, setDeviceName] = useState('iPad');
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
  const currentView =
    (viewDraft?.viewId === viewId ? viewDraft.value : undefined) ??
    document.views.find((view) => view.id === viewId) ??
    document.views[0];
  const cards = currentView?.cards ?? [];
  const cardCount = cards.length;
  const badges = currentView?.badges ?? [];
  const selectedCard =
    cardDraft?.value ?? (selected.type === 'card' ? cards[selected.index] : undefined);
  const selectedBadge =
    badgeDraft?.value ?? (selected.type === 'badge' ? badges[selected.index] : undefined);
  const jsonDirty = jsonDraft !== jsonBaseline;

  const replaceDocument = useCallback((next: DashboardDocument) => {
    setDocument(next);
    setDraftGeneration((previous) => previous + 1);
  }, []);
  const loadConfig = useCallback(async () => {
    try {
      const result = await api.getConfig();
      setServer(result);
      setRevision(result.revision);
      replaceDocument(result.config);
      setBaseline(serialize(result.config));
      setViewId(result.config.views[0]?.id ?? 'home');
      setLoadError('');
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : 'Dashboard settings could not be loaded.',
      );
    }
  }, [replaceDocument]);

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
    if (!document.views.some((view) => view.id === viewId)) {
      setViewId(document.views[0]?.id ?? 'home');
    }
  }, [document, viewId]);

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
    setDraftGeneration((previous) => previous + 1);
    setError('');
  };

  const changeView = (update: (view: ViewConfig) => ViewConfig) => {
    if (viewDraft) {
      setViewDraft((previous) =>
        previous ? { ...previous, value: update(previous.value) } : previous,
      );
      return;
    }
    changeDocument((previous) => ({
      ...previous,
      views: previous.views.map((view) => (view.id === viewId ? update(view) : view)),
    }));
  };

  const changeSettings = (update: (value: DashboardDocument) => DashboardDocument) => {
    setSettingsDraft((previous) => update(previous ?? document));
  };

  const changeCard = (update: (card: CardConfig) => CardConfig) => {
    if (cardDraft) {
      setCardDraft((previous) =>
        previous ? { ...previous, value: update(previous.value) } : previous,
      );
      return;
    }
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
    if (badgeDraft) {
      setBadgeDraft((previous) =>
        previous ? { ...previous, value: update(previous.value) } : previous,
      );
      return;
    }
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

  const addCard = (type: CardConfig['type']) => {
    const card = { ...createCard(type), entity: '' } as unknown as CardConfig;
    setSelected({ type: 'card', index: -1 });
    setCardDraft({ mode: 'add', viewId, index: cards.length, value: card });
    setBadgeDraft(null);
    setInspectorOpen(true);
  };

  const addBadge = () => {
    setSelected({ type: 'badge', index: -1 });
    setBadgeDraft({
      mode: 'add',
      viewId,
      index: badges.length,
      value: { type: 'temperature', entity: '' as `sensor.${string}` },
    });
    setCardDraft(null);
    setInspectorOpen(true);
  };

  const beginCardEdit = (index: number) => {
    const card = cards[index];
    if (!card) {
      return;
    }
    setSelected({ type: 'card', index });
    setCardDraft({ mode: 'edit', viewId, index, value: { ...card } });
    setBadgeDraft(null);
    setInspectorOpen(true);
  };

  const beginBadgeEdit = (index: number) => {
    const badge = badges[index];
    if (!badge) {
      return;
    }
    setSelected({ type: 'badge', index });
    setBadgeDraft({ mode: 'edit', viewId, index, value: { ...badge } });
    setCardDraft(null);
    setInspectorOpen(true);
  };

  const commitCardDraft = () => {
    if (!cardDraft || !currentView) {
      return;
    }
    let value: CardConfig;
    try {
      value = {
        ...cardDraft.value,
        ...createConfiguredCard(cardDraft.value.type, cardDraft.value.entity),
      } as CardConfig;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Choose a valid entity before adding the card.',
      );
      return;
    }
    const index = cardDraft.index;
    const mode = cardDraft.mode;
    const targetViewId = cardDraft.viewId;
    changeDocument((previous) => ({
      ...previous,
      views: previous.views.map((view) => {
        if (view.id !== targetViewId) {
          return view;
        }
        const next = [...(view.cards ?? [])];
        if (mode === 'add') {
          next.splice(index, 0, value);
        } else {
          next[index] = value;
        }
        return { ...view, cards: next };
      }),
    }));
    setCardDraft(null);
    setInspectorOpen(false);
  };

  const commitBadgeDraft = () => {
    if (!badgeDraft) {
      return;
    }
    if (!/^sensor\.[a-z0-9_]+$/.test(badgeDraft.value.entity)) {
      setError('Choose a valid temperature sensor before adding the badge.');
      return;
    }
    const targetViewId = badgeDraft.viewId;
    const index = badgeDraft.index;
    const mode = badgeDraft.mode;
    const value = badgeDraft.value;
    changeDocument((previous) => ({
      ...previous,
      views: previous.views.map((view) => {
        if (view.id !== targetViewId) {
          return view;
        }
        const next = [...(view.badges ?? [])];
        if (mode === 'add') {
          next.splice(index, 0, value);
        } else {
          next[index] = value;
        }
        return { ...view, badges: next };
      }),
    }));
    setBadgeDraft(null);
    setInspectorOpen(false);
  };

  const cancelInspector = () => {
    setCardDraft(null);
    setBadgeDraft(null);
    setViewDraft(null);
    setSettingsDraft(null);
    setInspectorOpen(false);
  };

  const openViewSettings = () => {
    if (!currentView) {
      return;
    }
    setSelected({ type: 'view' });
    setViewDraft({ viewId, value: { ...currentView } });
    setSettingsDraft({ ...document });
    setCardDraft(null);
    setBadgeDraft(null);
    setInspectorOpen(true);
  };

  const commitViewDraft = () => {
    if (viewDraft) {
      const targetViewId = viewDraft.viewId;
      const value = viewDraft.value;
      changeDocument((previous) => ({
        ...previous,
        ...(settingsDraft
          ? {
              timeZone: settingsDraft.timeZone,
              sun: settingsDraft.sun,
              polling: settingsDraft.polling,
            }
          : {}),
        views: previous.views.map((view) => (view.id === targetViewId ? value : view)),
      }));
    }
    setViewDraft(null);
    setSettingsDraft(null);
    setInspectorOpen(false);
  };

  const commitInspector = () => {
    if (cardDraft) {
      commitCardDraft();
    } else if (badgeDraft) {
      commitBadgeDraft();
    } else {
      commitViewDraft();
    }
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

  const handlePreviewMessage = (value: unknown) => {
    if (typeof value !== 'object' || value === null || !('type' in value)) {
      return;
    }
    const message = value as Record<string, unknown>;
    if (message.type === 'everdash.editor.view.select') {
      if (
        message.nonce === previewNonce &&
        message.generation === draftGeneration &&
        typeof message.viewId === 'string' &&
        document.views.some((view) => view.id === message.viewId)
      ) {
        setViewId(message.viewId);
      }
      return;
    }
    if (message.type === 'everdash.editor.card.edit') {
      if (isCardEditorMessage(value, previewNonce, draftGeneration, viewId, cardCount)) {
        beginCardEdit(message.index as number);
      }
      return;
    }
    if (message.type === 'everdash.editor.card.move') {
      if (isCardEditorMessage(value, previewNonce, draftGeneration, viewId, cardCount)) {
        reorderCards(
          message.index as number,
          (message.index as number) + (message.offset as -1 | 1),
        );
      }
      return;
    }
    if (message.type === 'everdash.editor.card.delete') {
      if (isCardEditorMessage(value, previewNonce, draftGeneration, viewId, cardCount)) {
        const index = message.index as number;
        const label = cards[index]?.name || cards[index]?.entity || 'card';
        setConfirmation({
          title: `Delete ${label}?`,
          description: 'This card will be removed from the dashboard draft.',
          confirmLabel: 'Delete card',
          action: () =>
            changeView((view) => ({
              ...view,
              cards: (view.cards ?? []).filter((_card, cardIndex) => cardIndex !== index),
            })),
        });
      }
      return;
    }
    if (
      message.type === 'everdash.editor.badge.edit' ||
      message.type === 'everdash.editor.badge.delete'
    ) {
      const index = message.index;
      if (
        message.nonce !== previewNonce ||
        message.generation !== draftGeneration ||
        message.viewId !== viewId ||
        !Number.isInteger(index) ||
        (index as number) < 0 ||
        (index as number) >= badges.length
      ) {
        return;
      }
      if (message.type === 'everdash.editor.badge.edit') {
        beginBadgeEdit(index as number);
      } else {
        const label = badges[index as number]?.name || 'temperature badge';
        setConfirmation({
          title: `Delete ${label}?`,
          description: 'This badge will be removed from the dashboard draft.',
          confirmLabel: 'Delete badge',
          action: () =>
            changeView((view) => ({
              ...view,
              badges: (view.badges ?? []).filter((_badge, badgeIndex) => badgeIndex !== index),
            })),
        });
      }
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
    try {
      const result = await api.saveConfig(revision, document);
      setRevision(result.revision);
      replaceDocument(result.config);
      setBaseline(serialize(result.config));
      setServer((previous) =>
        previous ? { ...previous, configured: true, recovery: false } : previous,
      );
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
      replaceDocument(result.config);
      setViewId(result.config.views[0]?.id ?? 'home');
      setSelected({ type: 'view' });
      toastManager.add({
        title: 'Previous dashboard loaded',
        description: 'Save to restore it.',
        type: 'info',
      });
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
        replaceDocument(restored);
        setViewId(restored.views[0]?.id ?? 'home');
        setSelected({ type: 'view' });
        toastManager.add({ title: 'Unsaved changes discarded', type: 'info' });
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
      replaceDocument(result.document);
      setViewId(result.document.views[0]?.id ?? 'home');
      setSelected({ type: 'view' });
      const text = serialize(result.document);
      setJsonDraft(text);
      setJsonBaseline(text);
      setJsonIssues([]);
      setError('');
      toastManager.add({
        title: 'Validated JSON applied',
        description: 'Save to publish these changes.',
        type: 'success',
      });
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
    try {
      await api.approvePairing(pairCode, deviceName);
      setPairCode('');
      toastManager.add({
        title: 'Tablet approved',
        description: 'It will appear in the device list when pairing completes.',
        type: 'success',
      });
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

  const renderInspector = () => {
    if (selected.type === 'view') {
      const settings = settingsDraft ?? document;
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
          <Collapsible className="dashboard-settings-collapsible">
            <CollapsibleTrigger className="status-line dashboard-settings-trigger">
              <Settings2 size={15} /> Dashboard settings <ChevronDown size={13} />
            </CollapsibleTrigger>
            <CollapsibleContent className="form-stack dashboard-settings-content">
              <Field>
                <FieldLabel htmlFor="timezone">Home timezone</FieldLabel>
                <Input
                  id="timezone"
                  placeholder="Europe/Warsaw"
                  value={settings.timeZone ?? ''}
                  onChange={(event) =>
                    changeSettings((previous) => ({
                      ...previous,
                      timeZone: event.target.value || undefined,
                    }))
                  }
                />
              </Field>
              <EntityPicker
                label="Sun entity"
                value={settings.sun ?? ''}
                domain="sun"
                onChange={(entity) =>
                  changeSettings((previous) => ({
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
                  value={settings.polling?.controlsMs ?? ''}
                  onChange={(event) =>
                    changeSettings((previous) => ({
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
                  value={settings.polling?.metadataMs ?? ''}
                  onChange={(event) =>
                    changeSettings((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        metadataMs: event.target.value ? Number(event.target.value) : undefined,
                      },
                    }))
                  }
                />
              </Field>
            </CollapsibleContent>
          </Collapsible>
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
              <fieldset className="icon-picker">
                <legend className="visually-hidden">Choose card icon</legend>
                {iconNames.map((icon) => {
                  const IconPreview = iconComponents[icon];
                  return (
                    <Button
                      type="button"
                      key={icon}
                      variant="outline"
                      size="icon"
                      className="icon-choice"
                      aria-label={icon}
                      aria-pressed={card.icon === icon}
                      onClick={() => changeCard((current) => ({ ...current, icon }) as CardConfig)}
                    >
                      <IconPreview size={19} aria-hidden="true" />
                    </Button>
                  );
                })}
              </fieldset>
            </Field>
          )}
          {card.type === 'climate' && (
            <Field>
              <FieldLabel htmlFor="climate-unit">Temperature unit</FieldLabel>
              <Select
                ariaLabel="Temperature unit"
                className="native-select"
                value={card.temperatureUnit ?? 'ha-default'}
                onValueChange={(value) =>
                  changeCard(
                    (current) =>
                      ({
                        ...current,
                        temperatureUnit: (value === 'ha-default' ? undefined : value) as
                          | '°C'
                          | '°F'
                          | undefined,
                      }) as CardConfig,
                  )
                }
                options={[
                  { value: 'ha-default', label: 'Use Home Assistant unit' },
                  { value: '°C', label: '°C Celsius' },
                  { value: '°F', label: '°F Fahrenheit' },
                ]}
              />
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
            <fieldset className="icon-picker">
              <legend className="visually-hidden">Choose badge icon</legend>
              {iconNames.map((icon) => {
                const IconPreview = iconComponents[icon];
                return (
                  <button
                    type="button"
                    key={icon}
                    aria-label={icon}
                    aria-pressed={selectedBadge.icon === icon}
                    onClick={() => changeBadge((badge) => ({ ...badge, icon }))}
                  >
                    <IconPreview size={19} aria-hidden="true" />
                  </button>
                );
              })}
            </fieldset>
          </Field>
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
    <div className="devices-page">
      <header className="devices-heading">
        <h1>Devices</h1>
        <p>Connect tablets and manage which devices can open EverDash.</p>
      </header>
      <Card className="devices-panel">
        <CardContent>
          <section className="devices-section" aria-labelledby="devices-address-title">
            <div className="devices-section-heading">
              <div>
                <h2 id="devices-address-title">Dashboard address</h2>
                <p>Use this address on a tablet connected to your home network.</p>
              </div>
            </div>
            {accessUrl ? (
              <div className="device-address-layout">
                <div className="device-address-copy">
                  <code>{accessUrl}</code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void navigator.clipboard?.writeText(accessUrl)}
                  >
                    <Copy size={14} /> Copy address
                  </Button>
                </div>
                <div className="device-qr">
                  <QRCodeSVG
                    value={accessUrl}
                    level="M"
                    includeMargin
                    size={132}
                    aria-label="QR code for dashboard address"
                  />
                </div>
              </div>
            ) : (
              <Alert>
                <Wifi size={16} />{' '}
                {accessError ||
                  'Home Assistant has not reported an active LAN port mapping for EverDash.'}
              </Alert>
            )}
            <details className="device-advanced">
              <summary>Address settings</summary>
              <Field>
                <FieldLabel htmlFor="host-override">Tablet host override</FieldLabel>
                <Input
                  id="host-override"
                  placeholder="homeassistant.local or 192.168.1.20"
                  value={hostOverride}
                  onChange={(event) => setHost(event.target.value)}
                />
                <span className="helper">
                  Saved in this Home Assistant browser. Enter a local hostname or IP; the mapped
                  port is added automatically.
                </span>
              </Field>
              {access?.httpsPort && (
                <p className="footer-note">
                  Trusted HTTPS dashboard is also available on port {access.httpsPort}.
                </p>
              )}
            </details>
          </section>
          <section className="devices-section" aria-labelledby="devices-pair-title">
            <div className="devices-section-heading">
              <div>
                <h2 id="devices-pair-title">Pair a tablet</h2>
                <p>Start pairing on the tablet, then approve its code here.</p>
              </div>
            </div>
            <form className="device-pair-form" onSubmit={(event) => void approvePairing(event)}>
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
                <Check size={15} /> Pair tablet
              </Button>
            </form>
            {pairError && (
              <p role="alert" className="inline-error" style={{ marginTop: 10 }}>
                {pairError}
              </p>
            )}
          </section>
          <section className="devices-section" aria-labelledby="devices-registered-title">
            <div className="devices-section-heading devices-registered-heading">
              <div>
                <h2 id="devices-registered-title">Paired tablets</h2>
                <p>Remove a device to require pairing again.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void loadAccess()}>
                <RotateCcw size={14} /> Refresh
              </Button>
            </div>
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
          </section>
        </CardContent>
      </Card>
    </div>
  );

  if (loadError && !server) {
    return (
      <main className="admin-shell">
        <Topbar
          tab={tab}
          onTabChange={chooseTab}
          dirty={dirty}
          configured={false}
          busy={busy}
          onSave={() => void save()}
          onDiscard={discard}
          onSettings={openViewSettings}
          onJson={() => chooseTab('json')}
          onRestore={() => void loadPrevious()}
          restoreAvailable={false}
        />
        <div className="workspace">
          <Alert>
            <CircleHelp size={16} /> {loadError}
          </Alert>
          <p className="helper">
            The visual editor can still create a new dashboard, or use JSON import / export to
            import a valid configuration.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <Topbar
        tab={tab}
        onTabChange={chooseTab}
        dirty={dirty}
        configured={server?.configured ?? false}
        busy={busy}
        onSave={() => void save()}
        onDiscard={discard}
        onSettings={openViewSettings}
        onJson={() => chooseTab('json')}
        onRestore={() => void loadPrevious()}
        restoreAvailable={server?.previousAvailable ?? false}
      />
      <Toaster />
      <main className={`workspace ${tab === 'dashboard' ? 'dashboard-workspace' : ''}`}>
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
        {error && (
          <Alert>
            <CircleHelp size={16} /> {error}
          </Alert>
        )}
        <Tabs value={tab} onValueChange={(value) => chooseTab(value as AdminTab)}>
          <TabsContent value="dashboard">
            <section className="dashboard-stage" aria-label="Dashboard canvas">
              <div className="canvas-toolbar">
                <div className="canvas-view-controls">
                  <Select
                    ariaLabel="Dashboard view"
                    className="canvas-view-select"
                    value={viewId}
                    onValueChange={setViewId}
                    options={document.views.map((view) => ({
                      value: view.id,
                      label: view.title,
                    }))}
                  />
                  <Button
                    className="canvas-tool"
                    variant="ghost"
                    size="icon"
                    aria-label="Rename view"
                    onClick={openViewSettings}
                  >
                    <Settings2 size={16} />
                  </Button>
                  <Button className="canvas-tool" variant="ghost" size="sm" onClick={addView}>
                    <Plus size={15} /> Add view
                  </Button>
                  <DropdownMenu
                    modal={false}
                    open={viewActionsOpen}
                    onOpenChange={setViewActionsOpen}
                  >
                    <DropdownMenuTrigger
                      className="canvas-tool button button-ghost button-icon"
                      aria-label="View actions"
                    >
                      <MoreHorizontal size={17} />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        disabled={document.views.findIndex((view) => view.id === viewId) === 0}
                        onClick={() => {
                          moveView(
                            document.views.findIndex((view) => view.id === viewId),
                            -1,
                          );
                          setViewActionsOpen(false);
                        }}
                      >
                        Move view earlier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={
                          document.views.findIndex((view) => view.id === viewId) ===
                          document.views.length - 1
                        }
                        onClick={() => {
                          moveView(
                            document.views.findIndex((view) => view.id === viewId),
                            1,
                          );
                          setViewActionsOpen(false);
                        }}
                      >
                        Move view later
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={document.views.length < 2}
                        onClick={() => {
                          removeView();
                          setViewActionsOpen(false);
                        }}
                      >
                        Delete view
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button className="canvas-tool" variant="ghost" size="sm" onClick={addBadge}>
                  <Plus size={15} /> Temperature badge
                </Button>
              </div>
              <PreviewFrame
                document={document}
                viewId={viewId}
                generation={draftGeneration}
                refreshToken={0}
                active={tab === 'dashboard'}
                onEditorMessage={handlePreviewMessage}
              />
              <div className="canvas-add-card">
                <Button variant="outline" onClick={() => setCardChooserOpen(true)}>
                  <Plus size={16} /> Add card
                </Button>
              </div>
            </section>
          </TabsContent>
          <TabsContent value="devices">{renderAccess()}</TabsContent>
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
      <Dialog.Root open={cardChooserOpen} onOpenChange={setCardChooserOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="sheet-backdrop" />
          <Dialog.Popup className="confirm-dialog card-chooser">
            <Dialog.Title className="card-title">Add a card</Dialog.Title>
            <p className="confirm-description">
              Choose what to add to {currentView?.title || 'this view'}.
            </p>
            <div className="card-kind-grid">
              {cardKinds.map((kind) => {
                const IconChoice =
                  kind === 'light'
                    ? Lightbulb
                    : kind === 'outlet'
                      ? Plug
                      : kind === 'climate'
                        ? Thermometer
                        : kind === 'weather'
                          ? CloudSun
                          : Zap;
                return (
                  <Button
                    key={kind}
                    type="button"
                    variant="outline"
                    className="card-kind-choice"
                    onClick={() => {
                      setCardChooserOpen(false);
                      addCard(kind);
                    }}
                  >
                    <IconChoice size={22} aria-hidden="true" />
                    <span>
                      {kind === 'pstryk' ? 'Pstryk energy' : kind[0].toUpperCase() + kind.slice(1)}
                    </span>
                  </Button>
                );
              })}
            </div>
            <div className="confirm-actions">
              <Dialog.Close className="button button-outline">Cancel</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
      <Sheet
        open={inspectorOpen}
        onOpenChange={(open) => {
          if (!open) {
            cancelInspector();
          }
        }}
        title={
          cardDraft
            ? cardDraft.mode === 'add'
              ? 'Add card'
              : 'Edit card'
            : badgeDraft
              ? badgeDraft.mode === 'add'
                ? 'Add temperature badge'
                : 'Edit temperature badge'
              : 'View settings'
        }
        onBack={
          cardDraft?.mode === 'add'
            ? () => {
                setCardDraft(null);
                setInspectorOpen(false);
                setCardChooserOpen(true);
              }
            : undefined
        }
      >
        <div className="form-stack">{renderInspector()}</div>
        <div className="inspector-actions">
          <Button variant="outline" onClick={cancelInspector}>
            Cancel
          </Button>
          <Button onClick={commitInspector}>
            {cardDraft?.mode === 'add' || badgeDraft?.mode === 'add' ? 'Add' : 'Done'}
          </Button>
        </div>
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
    </div>
  );
}

function Topbar({
  tab,
  onTabChange,
  dirty,
  configured,
  busy,
  onSave,
  onDiscard,
  onSettings,
  onJson,
  onRestore,
  restoreAvailable,
}: {
  tab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  dirty: boolean;
  configured: boolean;
  busy: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onSettings: () => void;
  onJson: () => void;
  onRestore: () => void;
  restoreAvailable: boolean;
}) {
  const [actionsOpen, setActionsOpen] = useState(false);

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-copy">
          <strong>EverDash</strong>
        </div>
      </div>
      <nav className="editor-navigation" aria-label="EverDash sections">
        <Button
          variant="ghost"
          className="navigation-button"
          aria-current={tab === 'dashboard' ? 'page' : undefined}
          onClick={() => onTabChange('dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant="ghost"
          className="navigation-button"
          aria-current={tab === 'devices' ? 'page' : undefined}
          onClick={() => onTabChange('devices')}
        >
          Devices
        </Button>
      </nav>
      <div className="topbar-actions">
        <span className={`save-state ${dirty ? 'dirty' : ''}`} aria-live="polite">
          <span className={`status-dot ${dirty ? 'pending' : ''}`} />
          {dirty ? 'Unsaved changes' : configured ? 'All changes saved' : 'Setup not saved yet'}
        </span>
        <Button onClick={onSave} disabled={!dirty || busy}>
          <Save size={15} /> {busy ? 'Saving…' : 'Save'}
        </Button>
        <DropdownMenu modal={false} open={actionsOpen} onOpenChange={setActionsOpen}>
          <DropdownMenuTrigger
            className="button button-outline button-icon editor-overflow-trigger"
            aria-label="More dashboard actions"
          >
            <MoreHorizontal size={18} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={!dirty || busy}
              onClick={() => {
                setActionsOpen(false);
                onDiscard();
              }}
            >
              Discard changes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setActionsOpen(false);
                onSettings();
              }}
            >
              Dashboard settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setActionsOpen(false);
                onJson();
              }}
            >
              JSON import / export
            </DropdownMenuItem>
            {restoreAvailable && (
              <DropdownMenuItem
                onClick={() => {
                  setActionsOpen(false);
                  onRestore();
                }}
              >
                Restore previous version
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function PreviewFrame({
  document,
  viewId,
  generation,
  refreshToken,
  active,
  onEditorMessage,
}: {
  document: DashboardDocument;
  viewId: string;
  generation: number;
  refreshToken: number;
  active: boolean;
  onEditorMessage: (message: unknown) => void;
}) {
  const [frameReady, setFrameReady] = useState(false);
  const [error, setError] = useState('');
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [frameHeight, setFrameHeight] = useState(720);
  const requestSequence = useRef(0);
  const sendDraft = useCallback(async () => {
    if (!frame?.contentWindow || !frameReady || !active) {
      return;
    }
    const sequence = ++requestSequence.current;
    try {
      const result = await api.preview(document);
      if (sequence !== requestSequence.current) {
        return;
      }
      frame.contentWindow.postMessage(
        {
          type: 'everdash.preview',
          nonce: previewNonce,
          config: result.config,
          states: result.states,
          forecasts: result.forecasts,
          generation,
          viewId,
          refreshToken,
          editor: true,
        },
        '*',
      );
      setError('');
    } catch (error) {
      if (sequence === requestSequence.current) {
        setError(error instanceof Error ? error.message : 'Dashboard data could not be loaded.');
      }
    }
  }, [active, document, frame, frameReady, generation, refreshToken, viewId]);
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
      if (data.nonce !== previewNonce) {
        return;
      }
      if (data.type === 'everdash.preview.ready') {
        frame?.contentWindow?.postMessage(
          { type: 'everdash.preview.ack', nonce: previewNonce },
          '*',
        );
        setFrameReady(true);
        return;
      }
      if (data.type === 'everdash.preview.size') {
        const height = (data as { height?: unknown }).height;
        if (typeof height === 'number' && Number.isFinite(height)) {
          setFrameHeight(Math.max(400, Math.min(5000, height)));
        }
        return;
      }
      if (data.type?.toString().startsWith('everdash.editor.')) {
        onEditorMessage(event.data);
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [frame, onEditorMessage]);
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
        title="EverDash dashboard editor canvas"
        className="preview-frame"
        style={{ height: frameHeight }}
        src={`preview/?nonce=${encodeURIComponent(previewNonce)}&parentOrigin=${encodeURIComponent(window.location.origin)}`}
        sandbox="allow-scripts"
      />
      {!frameReady && <p className="helper">Loading the tablet renderer…</p>}
    </>
  );
}

export { AdminApp };
