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

  return <div ref={container} data-canvas-island className="contents" />;
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

export function CanvasIsland({
  document,
  viewId,
  generation,
  selection,
  incomplete,
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
      states: [...preview.result.states, ...placeholderStates(document)],
      config: document,
      now: preview.now,
      generation,
      editor: true,
    };
  }, [document, generation, preview]);

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
