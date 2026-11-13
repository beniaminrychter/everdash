import appearance from './AdminAppearance.module.css';
import { AccessSettings } from '../features/access/AccessSettings';
import { DashboardCanvas } from '@everdash/dashboard/components/DashboardCanvas';
import {
  Bed,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  CloudRain,
  CloudSun,
  Home,
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
  Thermometer,
  Plug,
  Sofa,
  Sun,
  Sunrise,
  UserRound,
  Upload,
  X,
  Zap,
} from '@everdash/ui/admin/AdminIcons/AdminIcons';
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { AdminDialog } from '@everdash/ui/admin/AdminDialog/AdminDialog';
import type {
  BadgeConfig,
  CardConfig,
  DashboardDocument,
  ViewConfig,
} from '@everdash/contracts/config/types';
import type { IconName } from '@everdash/contracts/iconNames';
import { validateDashboard } from '@everdash/contracts/config/validate';
import { iconNames } from '@everdash/contracts/iconNames';
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

import { Tabs, TabsContent } from '../components/ui/tabs';
import { api } from '../lib/api';
import type { EntityOption, ManagedConfig } from '../lib/api';
import { createCard, createConfiguredCard, createView, moveItem } from '../app/draft/builder';

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
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

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

  useEffect(() => {
    if (!document.views.some((view) => view.id === viewId)) {
      setViewId(document.views[0]?.id ?? 'home');
    }
  }, [document, viewId]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

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
        message.generation === draftGeneration &&
        typeof message.viewId === 'string' &&
        document.views.some((view) => view.id === message.viewId)
      ) {
        setViewId(message.viewId);
      }
      return;
    }
    if (message.type === 'everdash.editor.card.edit') {
      if (
        message.generation === draftGeneration &&
        message.viewId === viewId &&
        Number.isInteger(message.index) &&
        (message.index as number) >= 0 &&
        (message.index as number) < cardCount
      ) {
        beginCardEdit(message.index as number);
      }
      return;
    }
    if (message.type === 'everdash.editor.card.move') {
      if (
        message.generation === draftGeneration &&
        message.viewId === viewId &&
        Number.isInteger(message.index) &&
        (message.index as number) >= 0 &&
        (message.index as number) < cardCount
      ) {
        reorderCards(
          message.index as number,
          (message.index as number) + (message.offset as -1 | 1),
        );
      }
      return;
    }
    if (message.type === 'everdash.editor.card.delete') {
      if (
        message.generation === draftGeneration &&
        message.viewId === viewId &&
        Number.isInteger(message.index) &&
        (message.index as number) >= 0 &&
        (message.index as number) < cardCount
      ) {
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

  const importJson = async (event: JSX.TargetedEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      setJsonDraft(await file.text());
      setJsonIssues([]);
    } catch (error) {
      setJsonIssues([error instanceof Error ? error.message : 'JSON file could not be read.']);
    }
    input.value = '';
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
              onInput={(event) =>
                changeView((view) => ({ ...view, title: event.currentTarget.value }))
              }
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
                  onInput={(event) =>
                    changeSettings((previous) => ({
                      ...previous,
                      timeZone: event.currentTarget.value || undefined,
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
                  onInput={(event) =>
                    changeSettings((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        controlsMs: event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined,
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
                  onInput={(event) =>
                    changeDocument((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        observationsMs: event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined,
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
                  onInput={(event) =>
                    changeSettings((previous) => ({
                      ...previous,
                      polling: {
                        ...previous.polling,
                        metadataMs: event.currentTarget.value
                          ? Number(event.currentTarget.value)
                          : undefined,
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
              onInput={(event) =>
                changeCard(
                  (current) =>
                    ({ ...current, name: event.currentTarget.value || undefined }) as CardConfig,
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
              <FieldLabel>Temperature unit</FieldLabel>
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
              onInput={(event) =>
                changeBadge((badge) => ({ ...badge, name: event.currentTarget.value || undefined }))
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

  if (loadError && !server) {
    return (
      <main className={`admin-shell ${appearance.shell}`}>
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
    <div className={`admin-shell ${appearance.shell}`}>
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
          <TabsContent value="dashboard" aria-label="Dashboard">
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
              <EditorCanvas
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
          <TabsContent value="devices" aria-label="Tablet access">
            <AccessSettings />
          </TabsContent>
          <TabsContent value="json" aria-label="JSON">
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
                  spellcheck={false}
                  value={jsonDraft}
                  onInput={(event) => {
                    setJsonDraft(event.currentTarget.value);
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
        <AdminDialog
          open
          onOpenChange={(open) => !open && setConfirmation(null)}
          title={confirmation.title}
          description={confirmation.description}
          className="confirm-dialog"
        >
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => setConfirmation(null)}>
              Cancel
            </Button>
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
        </AdminDialog>
      )}
      <AdminDialog
        open={cardChooserOpen}
        onOpenChange={setCardChooserOpen}
        title="Add a card"
        description={`Choose what to add to ${currentView?.title || 'this view'}.`}
        className="confirm-dialog card-chooser"
      >
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
          <Button variant="outline" onClick={() => setCardChooserOpen(false)}>
            Cancel
          </Button>
        </div>
      </AdminDialog>
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
        <AdminDialog
          open
          onOpenChange={(open) => !open && confirmJsonExit(false)}
          title="Unapplied JSON changes"
          description="Apply the JSON to the visual builder draft, or discard the raw edits before leaving this tab."
          className="confirm-dialog"
        >
          <div className="confirm-actions">
            <Button variant="outline" onClick={() => confirmJsonExit(false)}>
              Discard JSON
            </Button>
            <Button onClick={() => confirmJsonExit(true)}>Validate and apply</Button>
          </div>
        </AdminDialog>
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
          Tablet access
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

function EditorCanvas({
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
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof api.preview>> | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(0);
  useEffect(() => {
    let current = true;
    if (active) {
      api
        .preview(document)
        .then((result) => {
          if (current) {
            setSnapshot(result);
            setNow(Date.now());
            setError('');
          }
        })
        .catch(() => {
          if (current) {
            setError('Dashboard data could not be loaded.');
          }
        });
    }
    return () => {
      current = false;
    };
  }, [document, refreshToken, active]);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      {snapshot && (
        <DashboardCanvas
          snapshot={{ ...snapshot, config: document, now, generation, editor: true }}
          selectedView={viewId}
          onAction={(action) => onEditorMessage(action)}
        />
      )}
    </>
  );
}

export { AdminApp };
