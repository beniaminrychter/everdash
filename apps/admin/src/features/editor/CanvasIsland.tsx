import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DashboardDocument } from '@everdash/contracts/config/types';
import { mountDashboardCanvas } from '@everdash/dashboard/editor/mountDashboardCanvas';
import type {
  CanvasHandle,
  DashboardCanvasProps,
} from '@everdash/dashboard/editor/mountDashboardCanvas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { draftIssues, initialDraft } from '@/app/draft/draftReducer';
import { api } from '@/lib/api';

type Snapshot = Awaited<ReturnType<typeof api.preview>>;

interface CanvasIslandProps {
  document: DashboardDocument;
  viewId: string;
  generation: number;
  onMessage: (message: unknown) => void;
}

/** Owns the Preact root: mounts once, re-renders on props, unmounts with the component. */
function CanvasMount({ props }: { props: DashboardCanvasProps }) {
  const container = useRef<HTMLDivElement>(null);
  const handle = useRef<CanvasHandle | null>(null);

  useLayoutEffect(() => {
    const element = container.current;

    if (!element) {
      return;
    }

    if (handle.current) {
      handle.current.update(props);
    } else {
      handle.current = mountDashboardCanvas(element, props);
    }
  });

  useLayoutEffect(
    () => () => {
      handle.current?.unmount();
      handle.current = null;
    },
    [],
  );

  return <div ref={container} data-canvas-island className="contents" />;
}

export function CanvasIsland({ document, viewId, generation, onMessage }: CanvasIslandProps) {
  const onMessageRef = useRef(onMessage);
  const latestRequest = useRef(0);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [now, setNow] = useState(0);
  const [failed, setFailed] = useState(false);

  // Reuses the draft's validation messages so the editor and canvas agree.
  const issues = useMemo(() => draftIssues(initialDraft(document)), [document]);
  const invalid = issues.length > 0;

  useLayoutEffect(() => {
    onMessageRef.current = onMessage;
  });

  const forwardAction = useCallback((action: Record<string, unknown>) => {
    onMessageRef.current(action);
  }, []);

  const load = useCallback(() => {
    latestRequest.current += 1;
    const request = latestRequest.current;

    api
      .preview(document)
      .then((result) => {
        if (request === latestRequest.current) {
          setSnapshot(result);
          setNow(Date.now());
          setFailed(false);
        }
      })
      .catch(() => {
        if (request === latestRequest.current) {
          setFailed(true);
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

  if (invalid) {
    return (
      <Alert variant="destructive">
        <AlertTitle>This dashboard has problems</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-4">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
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
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {snapshot && (
        <CanvasMount
          props={{
            snapshot: { ...snapshot, config: document, now, generation, editor: true },
            selectedView: viewId,
            onAction: forwardAction,
          }}
        />
      )}
    </>
  );
}
