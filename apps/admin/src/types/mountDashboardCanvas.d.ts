// Declaration-only boundary for the Preact canvas island. The admin compiles
// with React JSX, so it must never type-check the tablet's Preact `.tsx`.
// Keep in sync with packages/dashboard/src/editor/mountDashboardCanvas.ts.
import type { DashboardDocument } from '@everdash/contracts/config/types';

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
