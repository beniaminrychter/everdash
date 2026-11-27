import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RegisteredDevice } from '@everdash/contracts/auth/devices';
import { DraftAlerts } from '@/app/DraftAlerts';
import { useDraft } from '@/app/DraftContext';
import { PageHeader } from '@/app/PageHeader';
import type { CardConfig, DashboardDocument } from '@everdash/contracts/config/types';
import type { DraftState } from '@/app/draft/draftReducer';
import { isIncomplete } from '@/app/draft/incomplete';
import { readDevicesOverview } from '@/features/devices/useDevices';
import { CanvasIsland } from './CanvasIsland';
import { CanvasToolbar } from './CanvasToolbar';
import { DeleteItemDialog } from './DeleteItemDialog';
import { EditorDialog } from './EditorDialog';
import type { DeleteTarget } from './DeleteItemDialog';
import {
  resolveDeviceViewport,
  resolvePreviewScale,
  toDeviceViewportOptions,
} from './deviceViewport';
import type { PreviewZoom, ViewportOrientation } from './deviceViewport';
import { focusInspectorField } from './focusInspectorField';
import { pendingPreview } from './pendingPreview';
import { ViewTabs } from './ViewTabs';

/** Reads a current canvas delete request. Stale or out-of-range messages are ignored. */
function deleteRequest(message: unknown, state: DraftState): DeleteTarget | null {
  if (typeof message !== 'object' || message === null) {
    return null;
  }

  const { type, index, section, generation, viewId } = message as Record<string, unknown>;
  const view = state.document.views.find((item) => item.id === state.viewId);

  if (generation !== state.generation || viewId !== state.viewId) {
    return null;
  }

  if (type === 'everdash.editor.section.delete') {
    const exists = view?.sections?.some((item) => item.id === section);

    return typeof section === 'string' && exists ? { kind: 'section', id: section } : null;
  }

  const kind =
    type === 'everdash.editor.card.delete'
      ? 'card'
      : type === 'everdash.editor.badge.delete'
        ? 'badge'
        : null;
  const sectionId = typeof section === 'string' ? section : null;
  const list =
    kind === 'card'
      ? sectionId === null
        ? view?.cards
        : view?.sections?.find((item) => item.id === sectionId)?.cards
      : view?.badges;

  if (
    !kind ||
    (section !== undefined && section !== null && typeof section !== 'string') ||
    typeof index !== 'number' ||
    !Number.isInteger(index) ||
    index < 0 ||
    index >= (list?.length ?? 0)
  ) {
    return null;
  }

  // A card that was only just added is deleted at once by the draft; there is nothing to confirm.
  if (kind === 'card' && isIncomplete((list as readonly CardConfig[])[index]!)) {
    return null;
  }

  return kind === 'card' ? { kind, section: sectionId, index } : { kind, index };
}

/** The canvas messages that ask to edit an item, which opens the editor dialog. */
const editorOpeners = new Set([
  'everdash.editor.card.add',
  'everdash.editor.card.edit',
  'everdash.editor.badge.add',
  'everdash.editor.badge.edit',
  'everdash.editor.section.edit',
  'everdash.editor.section.rename',
]);

export function EditorPage() {
  const { state, dispatch } = useDraft();
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  // Selecting an item (a move, a duplicate, a drag) does not open the editor; asking to edit does.
  const [editing, setEditing] = useState(false);
  // The dashboard when the editor opened: what its Cancel puts back.
  const [baseline, setBaseline] = useState<DashboardDocument | null>(null);
  const [devices, setDevices] = useState<RegisteredDevice[]>([]);
  const [viewportSelection, setViewportSelection] = useState<{
    deviceId: string;
    orientation: ViewportOrientation;
  } | null>(null);
  const [zoom, setZoom] = useState<PreviewZoom>('fit');
  const [availableSpace, setAvailableSpace] = useState({ width: 0, height: 0 });
  const scrollPaneRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const latest = useRef(state);

  useLayoutEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    let active = true;

    const refreshDevices = async () => {
      const overview = await readDevicesOverview();

      if (!active || !overview) {
        return;
      }

      setDevices(overview.devices);
    };

    refreshDevices();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshDevices();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const deviceOptions = useMemo(() => toDeviceViewportOptions(devices), [devices]);

  const activeViewport = useMemo(() => {
    if (!viewportSelection) {
      return null;
    }

    const option = deviceOptions.find((item) => item.id === viewportSelection.deviceId);

    return option ? resolveDeviceViewport(option, viewportSelection.orientation) : null;
  }, [deviceOptions, viewportSelection]);

  useLayoutEffect(() => {
    if (!activeViewport) {
      return;
    }

    const measure = () => {
      const scrollPane = scrollPaneRef.current;
      const stage = stageRef.current;

      if (!scrollPane || !stage) {
        return;
      }

      const scrollRect = scrollPane.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();
      const paddingBottom =
        Number(getComputedStyle(scrollPane).paddingBottom.replace('px', '')) || 0;
      const stageTop = stageRect.top - scrollRect.top + scrollPane.scrollTop;
      const nextWidth = Math.max(0, stage.clientWidth - 4);
      const nextHeight = Math.max(120, scrollPane.clientHeight - stageTop - paddingBottom - 4);

      setAvailableSpace((current) =>
        current.width === nextWidth && current.height === nextHeight
          ? current
          : { width: nextWidth, height: nextHeight },
      );
    };

    measure();

    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);

    if (scrollPaneRef.current) {
      observer?.observe(scrollPaneRef.current);
    }

    if (stageRef.current) {
      observer?.observe(stageRef.current);
    }

    window.addEventListener('resize', measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [activeViewport]);

  const previewScale = useMemo(
    () => (activeViewport ? resolvePreviewScale(zoom, activeViewport, availableSpace) : 1),
    [activeViewport, availableSpace, zoom],
  );

  const handleSelectViewport = useCallback(
    (deviceId: string) => {
      if (deviceId === 'default') {
        setViewportSelection(null);
        setZoom('fit');

        return;
      }

      const option = deviceOptions.find((item) => item.id === deviceId);

      if (!option) {
        setViewportSelection(null);
        setZoom('fit');

        return;
      }

      setViewportSelection({ deviceId: option.id, orientation: option.defaultOrientation });
    },
    [deviceOptions],
  );

  const handleToggleOrientation = useCallback(() => {
    setViewportSelection((current) => {
      if (!current) {
        return null;
      }

      return {
        ...current,
        orientation: current.orientation === 'portrait' ? 'landscape' : 'portrait',
      };
    });
  }, []);

  // Called as an edit is asked for, before it reaches the draft, so the baseline is what the
  // dialog opened on (a card or section that is about to be added is not part of it).
  const openEditor = useCallback(() => {
    setBaseline(latest.current.document);
    setEditing(true);
  }, []);

  const handleMessage = useCallback(
    (message: unknown) => {
      // The reducer only selects on a canvas delete; the confirmation belongs to this page, and
      // selecting would open the editor dialog behind it, so the confirmation is all that opens.
      const request = deleteRequest(message, latest.current);

      if (request) {
        setDeleting(request);
      } else {
        dispatch({ type: 'canvas-message', message });
      }

      if (
        typeof message === 'object' &&
        message !== null &&
        (message as Record<string, unknown>).generation === latest.current.generation &&
        (message as Record<string, unknown>).viewId === latest.current.viewId
      ) {
        const { type } = message as Record<string, unknown>;

        if (typeof type === 'string' && editorOpeners.has(type)) {
          openEditor();
        }

        // "Rename" in a section's menu selects the section and puts the cursor in its name.
        if (type === 'everdash.editor.section.rename') {
          focusInspectorField('section-name');
        }
      }
    },
    [dispatch, openEditor],
  );

  const renameView = useCallback(() => {
    dispatch({ type: 'select', selection: { kind: 'view' } });
    openEditor();
    // Waits for the menu to close and the dialog to mount before focusing.
    window.setTimeout(() => {
      const input = document.querySelector('#view-name') as HTMLInputElement | null;

      input?.focus();
      input?.select();
    }, 150);
  }, [dispatch, openEditor]);

  // Shows a card or badge that is still being added, so its type is visible before it is saved.
  const preview = useMemo(
    () => pendingPreview(state.document, state.viewId, state.selection),
    [state.document, state.viewId, state.selection],
  );

  const scaledWidth = activeViewport ? Math.round(activeViewport.width * previewScale) : 0;
  const scaledHeight = activeViewport ? Math.round(activeViewport.height * previewScale) : 0;

  return (
    <div className="flex h-svh min-h-0 flex-col">
      <PageHeader>
        <ViewTabs onRename={renameView} />
      </PageHeader>
      <div className="flex min-h-0 flex-1">
        <div className="bg-muted flex min-w-0 flex-1 flex-col">
          <div className="border-border/60 bg-muted shrink-0 border-b px-4 py-2.5 xl:px-6">
            <div className="mx-auto max-w-4xl">
              <CanvasToolbar
                onEdit={openEditor}
                deviceOptions={deviceOptions}
                selectedViewport={activeViewport}
                zoom={zoom}
                onSelectViewport={handleSelectViewport}
                onToggleOrientation={handleToggleOrientation}
                onChangeZoom={setZoom}
              />
            </div>
          </div>
          <div ref={scrollPaneRef} className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            <div className="mx-auto mb-4 max-w-4xl space-y-4 empty:hidden">
              <DraftAlerts />
            </div>
            <div
              ref={stageRef}
              className={
                activeViewport
                  ? zoom === 'fit'
                    ? 'overflow-x-hidden'
                    : 'overflow-x-auto pb-2'
                  : undefined
              }
            >
              <div
                data-preview-scale={activeViewport ? String(previewScale) : undefined}
                className={activeViewport ? 'relative mx-auto' : undefined}
                style={
                  activeViewport && previewScale !== 1
                    ? { width: `${scaledWidth}px`, height: `${scaledHeight}px` }
                    : undefined
                }
              >
                <div
                  data-preview-viewport={activeViewport?.deviceId ?? 'default'}
                  data-preview-orientation={activeViewport?.orientation}
                  className={
                    activeViewport
                      ? 'ring-border mx-auto overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl bg-[#e4eaf1] shadow-sm ring-1'
                      : 'mx-auto max-w-4xl'
                  }
                  style={
                    activeViewport
                      ? {
                          width: `${activeViewport.width}px`,
                          height: `${activeViewport.height}px`,
                          ...(previewScale === 1
                            ? undefined
                            : {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left',
                              }),
                        }
                      : undefined
                  }
                >
                  <CanvasIsland
                    document={preview.document}
                    viewId={state.viewId}
                    generation={state.generation}
                    selection={preview.selection}
                    incomplete={preview.incomplete}
                    onMessage={handleMessage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <EditorDialog
        open={editing}
        onOpenChange={setEditing}
        baseline={baseline}
        onRequestDelete={setDeleting}
      />
      <DeleteItemDialog target={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
