import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { viewCards } from '@everdash/contracts/config/sections';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import { mountDashboardCanvas } from '@everdash/dashboard/editor/mountDashboardCanvas';
import type {
  CanvasHandle,
  DashboardCanvasProps,
} from '@everdash/dashboard/editor/mountDashboardCanvas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { draftIssues, initialDraft } from '@/app/draft/draftReducer';
import { api } from '@/lib/api';

type Snapshot = Awaited<ReturnType<typeof api.preview>>;

interface CanvasIslandProps {
  document: DashboardDocument;
  viewId: string;
  generation: number;
  /** The saved card, badge or section to outline. Pending items have no ring. */
  selection?: DashboardCanvasProps['selection'];
  /** New cards of the view that still need an entity. */
  incomplete?: DashboardCanvasProps['incomplete'];
  /** Draws the cards without the editor chrome, for a preview beside a form. */
  readOnly?: boolean;
  /** Entity states to show instead of the real ones, by entity id. */
  forcedStates?: Readonly<Record<string, string>>;
  onMessage: (message: unknown) => void;
}

interface CanvasMountProps {
  snapshot: DashboardCanvasProps['snapshot'];
  selectedView: string;
  selectionKind?: 'card' | 'badge' | 'section';
  /** The section id of the selected card or section; null for the unsectioned cards. */
  selectionSection?: string | null;
  selectionIndex?: number;
  incomplete?: DashboardCanvasProps['incomplete'];
  readOnly?: boolean;
  onMessage: (message: unknown) => void;
}

function canvasSelection(
  kind: CanvasMountProps['selectionKind'],
  section: string | null | undefined,
  index: number | undefined,
): DashboardCanvasProps['selection'] {
  if (kind === 'section' && typeof section === 'string') {
    return { kind, section };
  }

  if (kind === 'card' && index !== undefined && section !== undefined) {
    return { kind, section, index };
  }

  if (kind === 'badge' && index !== undefined) {
    return { kind, index };
  }

  return undefined;
}

/** Owns the Preact root: mounts once, re-renders on props, unmounts with the component. */
function CanvasMountView({
  snapshot,
  selectedView,
  selectionKind,
  selectionSection,
  selectionIndex,
  incomplete,
  readOnly,
  onMessage,
}: CanvasMountProps) {
  const container = useRef<HTMLDivElement>(null);
  const handle = useRef<CanvasHandle | null>(null);
  const onMessageRef = useRef(onMessage);

  useLayoutEffect(() => {
    onMessageRef.current = onMessage;
  });

  useLayoutEffect(() => {
    const element = container.current;

    if (!element) {
      return;
    }

    const props: DashboardCanvasProps = {
      snapshot,
      selectedView,
      selection: canvasSelection(selectionKind, selectionSection, selectionIndex),
      incomplete,
      onAction: (action) => onMessageRef.current(action),
    };

    if (handle.current) {
      handle.current.update(props);
    } else {
      handle.current = mountDashboardCanvas(element, props);
    }
  }, [snapshot, selectedView, selectionKind, selectionSection, selectionIndex, incomplete]);

  useLayoutEffect(
    () => () => {
      handle.current?.unmount();
      handle.current = null;
    },
    [],
  );

  // Only the editing canvas is "the island": the focus return and the tests look it up by this.
  return (
    <div
      ref={container}
      {...(readOnly ? { 'data-canvas-preview': '' } : { 'data-canvas-island': '' })}
      className="contents"
    />
  );
}

const CanvasMount = memo(CanvasMountView);

/** The entity a card or badge uses in the preview until a real one is chosen. */
const placeholderEntity = /^([a-z_]+)\.select_entity$/;

/**
 * Neutral states for placeholder entities, so a card that is still being added looks like an
 * idle card ("Off", "Tap to run") instead of reporting a missing entity.
 */
function placeholderStates(document: DashboardDocument): unknown[] {
  const ids = new Set<string>();

  for (const view of document.views) {
    for (const item of [...viewCards(view), ...(view.badges ?? [])]) {
      if ('entity' in item && placeholderEntity.test(item.entity)) {
        ids.add(item.entity);
      }
    }
  }

  return [...ids].map((id) => {
    const domain = placeholderEntity.exec(id)?.[1] ?? '';
    const switchable = ['light', 'switch', 'input_boolean', 'climate'].includes(domain);
    // Readings show a dash, which is not a value; scenes and weather treat "unknown" as idle.
    const reading = ['sensor', 'input_number', 'binary_sensor'].includes(domain);
    const state = switchable ? 'off' : reading ? '—' : 'unknown';

    return { entity_id: id, state, attributes: {} };
  });
}

/** The states with the forced ones swapped in; a forced entity the server did not report is added. */
function withForcedStates(
  states: unknown[],
  forced: Readonly<Record<string, string>> | undefined,
): unknown[] {
  if (!forced) {
    return states;
  }

  const seen = new Set<string>();
  const result: unknown[] = states.map((item) => {
    const entry = item as { entity_id: string; state: string };

    seen.add(entry.entity_id);

    return entry.entity_id in forced ? { ...entry, state: forced[entry.entity_id] } : entry;
  });

  for (const [entityId, state] of Object.entries(forced)) {
    if (!seen.has(entityId)) {
      result.push({ entity_id: entityId, state, attributes: {} });
    }
  }

  return result;
}

export function CanvasIsland({
  document,
  viewId,
  generation,
  selection,
  incomplete,
  readOnly,
  forcedStates,
  onMessage,
}: CanvasIslandProps) {
  const latestRequest = useRef(0);
  const [preview, setPreview] = useState<{ result: Snapshot; now: number } | null>(null);
  // Failure belongs to one document, so editing (or retrying) clears it without an effect.
  const [failedDocument, setFailedDocument] = useState<DashboardDocument | null>(null);

  // Reuses the draft's validation messages so the editor and canvas agree.
  const issues = useMemo(() => draftIssues(initialDraft(document)), [document]);
  const invalid = issues.length > 0;
  const failed = failedDocument === document;

  const load = useCallback(() => {
    latestRequest.current += 1;
    const request = latestRequest.current;

    api
      .preview(document)
      .then((result) => {
        if (request === latestRequest.current) {
          setPreview({ result, now: Date.now() });
          setFailedDocument(null);
        }
      })
      .catch(() => {
        if (request === latestRequest.current) {
          setFailedDocument(document);
        }
      });
  }, [document]);

  useEffect(() => {
    if (invalid) {
      return;
    }

    load();

    return () => {
      // Invalidates any request still in flight for the previous document.
      latestRequest.current += 1;
    };
  }, [invalid, load]);

  const snapshot = useMemo<DashboardCanvasProps['snapshot'] | null>(() => {
    if (!preview) {
      return null;
    }

    return {
      ...preview.result,
      states: withForcedStates(
        [...preview.result.states, ...placeholderStates(document)],
        forcedStates,
      ),
      config: document,
      now: preview.now,
      generation,
      editor: !readOnly,
    };
  }, [document, forcedStates, generation, preview, readOnly]);

  if (invalid && readOnly) {
    return (
      <p className="text-muted-foreground text-sm">Fix the highlighted fields to see a preview.</p>
    );
  }

  if (invalid) {
    return (
      <Alert variant="destructive">
        <AlertTitle>This dashboard has problems</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-4">
            {issues.map((issue, index) => (
              <li key={`${index}-${issue}`}>{issue}</li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {failed && (
        <Alert variant="destructive">
          <AlertTitle>Dashboard data could not be loaded.</AlertTitle>
          <AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFailedDocument(null);
                load();
              }}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {snapshot && (
        <CanvasMount
          snapshot={snapshot}
          selectedView={viewId}
          selectionKind={selection?.kind}
          selectionSection={selection && 'section' in selection ? selection.section : undefined}
          selectionIndex={selection && 'index' in selection ? selection.index : undefined}
          incomplete={incomplete}
          readOnly={readOnly}
          onMessage={onMessage}
        />
      )}
      {!snapshot && !failed && (
        <output className="block space-y-3" aria-label="Loading preview">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </output>
      )}
    </>
  );
}
