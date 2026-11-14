import { h, render } from 'preact';
import { DashboardCanvas } from '../components/DashboardCanvas';
import type { DashboardCanvasProps } from '../components/DashboardCanvas';

export type { DashboardCanvasProps } from '../components/DashboardCanvas';

export interface CanvasHandle {
  update: (props: DashboardCanvasProps) => void;
  unmount: () => void;
}

/** Renders the tablet's Preact canvas into an element owned by another framework. */
export function mountDashboardCanvas(
  element: HTMLElement,
  props: DashboardCanvasProps,
): CanvasHandle {
  render(h(DashboardCanvas, props), element);

  return {
    update(next) {
      render(h(DashboardCanvas, next), element);
    },
    unmount() {
      render(null, element);
    },
  };
}
