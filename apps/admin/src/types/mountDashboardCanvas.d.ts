// Declaration-only boundary for the Preact canvas island. The admin compiles
// with React JSX, so it must never type-check the tablet's Preact `.tsx`.
// Keep in sync with packages/dashboard/src/editor/mountDashboardCanvas.ts.
import type { DashboardDocument } from '@everdash/contracts/config/types';
import type { Language } from '@everdash/ui/i18n/locale';

/** A card's place: its section's id, or null for the cards outside any section. */
export interface CardLocation {
  section: string | null;
  index: number;
}

/** `section` is a section id, or null for the cards outside any section. */
export type EditorSelection =
  | { kind: 'card'; section: string | null; index: number }
  | { kind: 'badge'; index: number }
  | { kind: 'section'; section: string };

export interface CanvasSnapshot {
  config: DashboardDocument;
  states: unknown[];
  forecasts: Record<string, readonly unknown[]>;
  now: number;
  generation: number;
  editor: boolean;
}

export interface DashboardCanvasProps {
  snapshot: CanvasSnapshot;
  selectedView: string;
  /** Editor only: UI language for the canvas and its chrome. Defaults to `'en'`. */
  language?: Language;
  /** Editor only: the card, badge or section to outline. The tablet never passes it. */
  selection?: EditorSelection;
  /** Editor only: new cards that still need an entity, outlined as such. */
  incomplete?: readonly CardLocation[];
  onAction: (action: Record<string, unknown>) => void;
}

export interface CanvasHandle {
  update: (props: DashboardCanvasProps) => void;
  unmount: () => void;
}

export function mountDashboardCanvas(
  element: HTMLElement,
  props: DashboardCanvasProps,
): CanvasHandle;
