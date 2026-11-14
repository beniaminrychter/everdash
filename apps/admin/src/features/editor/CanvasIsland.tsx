import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  /** The saved card or badge to outline. Pending items have no ring. */
  selection?: { kind: 'card' | 'badge'; index: number };
  onMessage: (message: unknown) => void;
}

interface CanvasMountProps {
  snapshot: DashboardCanvasProps['snapshot'];
  selectedView: string;
  selectionKind?: 'card' | 'badge';
  selectionIndex?: number;
  onMessage: (message: unknown) => void;
}

/** Owns the Preact root: mounts once, re-renders on props, unmounts with the component. */
function CanvasMountView({
  snapshot,
  selectedView,
  selectionKind,
  selectionIndex,
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
      selection:
        selectionKind && selectionIndex !== undefined
          ? { kind: selectionKind, index: selectionIndex }
          : undefined,
      onAction: (action) => onMessageRef.current(action),
    };

    if (handle.current) {
      handle.current.update(props);
    } else {
      handle.current = mountDashboardCanvas(element, props);
    }
  }, [snapshot, selectedView, selectionKind, selectionIndex]);

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
    for (const item of [...(view.cards ?? []), ...(view.badges ?? [])]) {
      if (placeholderEntity.test(item.entity)) {
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
          selectionIndex={selection?.index}
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
