import { useState } from 'react';
import { RotateCwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDraft } from '@/app/DraftContext';
import { unfinishedCardIssue } from '@/app/draft/draftReducer';
import { hasIncomplete } from '@/app/draft/incomplete';
import { previewZoomOptions } from './deviceViewport';
import type { DeviceViewportOption, PreviewZoom, ResolvedViewport } from './deviceViewport';
import { AddCardDialog } from './AddCardDialog';
import { focusInspectorField } from './focusInspectorField';

interface CanvasToolbarProps {
  /** A new item was started; its editor opens. */
  onEdit: () => void;
  deviceOptions: readonly DeviceViewportOption[];
  selectedViewport: ResolvedViewport | null;
  zoom: PreviewZoom;
  onSelectViewport: (deviceId: string) => void;
  onToggleOrientation: () => void;
  onChangeZoom: (zoom: PreviewZoom) => void;
}

export function CanvasToolbar({
  onEdit,
  deviceOptions,
  selectedViewport,
  zoom,
  onSelectViewport,
  onToggleOrientation,
  onChangeZoom,
}: CanvasToolbarProps) {
  const { state, dispatch } = useDraft();
  const pendingCard = hasIncomplete(state.document);
  const [pickingCard, setPickingCard] = useState(false);

  const unfinished = unfinishedCardIssue(state);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground flex items-center gap-2" title="Live preview">
            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className={selectedViewport ? 'hidden 2xl:inline' : undefined}>Live preview</span>
          </span>
          {deviceOptions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Select
                value={selectedViewport?.deviceId ?? 'default'}
                onValueChange={onSelectViewport}
              >
                <SelectTrigger size="sm" aria-label="Preview viewport" className="max-w-36 px-2.5">
                  <SelectValue>{selectedViewport?.label ?? 'Default'}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="default">Default</SelectItem>
                  {deviceOptions.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <span>{device.label}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {device.width} × {device.height}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedViewport && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="px-2.5"
                    title={
                      selectedViewport.orientation === 'portrait'
                        ? 'Switch to landscape mode'
                        : 'Switch to portrait mode'
                    }
                    onClick={onToggleOrientation}
                  >
                    <RotateCwIcon className="size-3.5" aria-hidden="true" />
                    <span>
                      {selectedViewport.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    </span>
                  </Button>
                  <Select
                    value={zoom}
                    onValueChange={(value) => onChangeZoom(value as PreviewZoom)}
                  >
                    <SelectTrigger size="sm" aria-label="Preview zoom" className="px-2.5">
                      <SelectValue>{zoom === 'fit' ? 'Fit' : `${zoom}%`}</SelectValue>
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {previewZoomOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span
                    data-preview-size
                    className="text-muted-foreground hidden text-xs whitespace-nowrap tabular-nums min-[1400px]:inline"
                  >
                    {selectedViewport.width} × {selectedViewport.height}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="px-2.5"
            onClick={() => {
              dispatch({ type: 'start-badge' });
              onEdit();
            }}
          >
            + Badge
          </Button>
          {/* Sections are optional titled groups of cards; the new one is named in the editor. */}
          <Button
            variant="outline"
            size="sm"
            className="px-2.5"
            onClick={() => {
              dispatch({ type: 'add-section' });
              onEdit();
              focusInspectorField('section-name');
            }}
          >
            + Section
          </Button>
          {/* Pick a type first; the new card is then added to the view and finished in the editor. */}
          <Button
            variant="outline"
            size="sm"
            className="px-2.5"
            disabled={pendingCard}
            onClick={() => setPickingCard(true)}
          >
            + Add card
          </Button>
        </div>
      </div>
      <AddCardDialog
        open={pickingCard}
        onOpenChange={setPickingCard}
        onPick={(kind) => {
          dispatch({ type: 'start-card', kind });
          onEdit();
        }}
      />
      {unfinished && (
        <output className="mt-2 block text-sm text-amber-700 dark:text-amber-400">
          {unfinished}
        </output>
      )}
    </>
  );
}
