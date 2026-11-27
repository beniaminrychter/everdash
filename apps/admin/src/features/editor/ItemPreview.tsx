import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as m from '@everdash/ui/i18n/paraglide/messages.js';
import { useDraft } from '@/app/DraftContext';
import { CanvasIsland } from './CanvasIsland';
import { itemPreviewDocument } from './itemPreviewDocument';

const ignoreMessage = () => undefined;

/** The width of the row the tablet lays cards out in, so a card's size (1/4, 1/2, 1/1) shows. */
const stageWidth = 720;

type PreviewState = 'live' | 'on' | 'off' | 'unavailable';

function previewStateLabel(state: PreviewState): string {
  switch (state) {
    case 'live': {
      return m.admin_editor_state_live();
    }

    case 'on': {
      return m.admin_editor_state_on();
    }

    case 'off': {
      return m.admin_editor_state_off();
    }

    default: {
      return m.admin_editor_state_unavailable();
    }
  }
}

/** What each choice shows, by the kind of entity. Domains not listed offer Live and Unavailable. */
const forcedValues: Record<string, Partial<Record<PreviewState, string>>> = {
  light: { on: 'on', off: 'off' },
  switch: { on: 'on', off: 'off' },
  input_boolean: { on: 'on', off: 'off' },
  climate: { on: 'heat', off: 'off' },
};

const noValues: Partial<Record<PreviewState, string>> = {};

/** The grid cells of the preview: each card, sized by its share of the row. */
const cardCells = '[style*="grid-column"]';

/**
 * A tablet-width row, so the share of the row a card takes (1/4, 1/2, 1/1) is true to size. The
 * card is shown at its natural size, and the whole row is scaled down only when the card is wider
 * than the pane.
 */
function ScaledStage({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const frame = outer.current;
    const content = inner.current;

    if (!frame || !content) {
      return;
    }

    const measure = () => {
      const box = content.getBoundingClientRect();
      // Rectangles include the current scale; the card's width at natural size is what matters.
      const current = box.width / stageWidth || 1;
      let needed = 0;

      for (const cell of content.querySelectorAll(cardCells)) {
        needed = Math.max(needed, (cell.getBoundingClientRect().right - box.left) / current);
      }

      setScale(needed > 0 ? Math.round(Math.min(1, frame.clientWidth / needed) * 1000) / 1000 : 1);
      setHeight(content.offsetHeight);
    };

    measure();

    const resized = new ResizeObserver(measure);
    const changed = new MutationObserver(measure);

    resized.observe(frame);
    resized.observe(content);
    // A change of size moves a card's grid span without resizing the stage itself.
    changed.observe(content, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: true,
      subtree: true,
    });

    return () => {
      resized.disconnect();
      changed.disconnect();
    };
  }, []);

  return (
    <div ref={outer} className="w-full overflow-hidden" style={{ height: height * scale }}>
      <div
        ref={inner}
        className="[&_[data-testid=empty-view]]:hidden"
        style={{ width: stageWidth, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  );
}

/** The card, badge or section being edited, drawn by the real tablet canvas without editor chrome. */
export function ItemPreview() {
  const { state } = useDraft();
  const [shown, setShown] = useState<PreviewState>('live');
  const document = useMemo(
    () => itemPreviewDocument(state.document, state.viewId, state.selection),
    [state.document, state.viewId, state.selection],
  );
  const item = document?.views[0]?.cards?.[0] ?? document?.views[0]?.badges?.[0];
  const entity = item && 'entity' in item && item.entity ? item.entity : undefined;
  const domain = entity?.split('.')[0] ?? '';
  const values = forcedValues[domain] ?? noValues;
  const choices: PreviewState[] = [
    'live',
    ...(['on', 'off'] as const).filter((choice) => values[choice] !== undefined),
    'unavailable',
  ];
  const forcedStates = useMemo(() => {
    if (!entity || shown === 'live') {
      return undefined;
    }

    return { [entity]: shown === 'unavailable' ? 'unavailable' : (values[shown] ?? 'unavailable') };
  }, [entity, shown, values]);

  if (!document) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-col gap-4 p-5">
      <div className="text-xs font-medium text-slate-600">{m.admin_editor_preview()}</div>
      <ScaledStage>
        <CanvasIsland
          document={document}
          viewId={state.viewId}
          generation={state.generation}
          readOnly
          forcedStates={forcedStates}
          onMessage={ignoreMessage}
        />
      </ScaledStage>
      {entity && (
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">{m.admin_editor_preview_state()}</legend>
          <span className="text-xs text-slate-600" aria-hidden="true">
            {m.admin_editor_show_as()}
          </span>
          <div className="flex rounded-lg bg-slate-300/70 p-0.5">
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                aria-pressed={shown === choice}
                className={`rounded-md px-3 py-1 text-xs font-medium text-slate-800 ${
                  shown === choice ? 'bg-white shadow-sm' : ''
                }`}
                onClick={() => setShown(choice)}
              >
                {previewStateLabel(choice)}
              </button>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
