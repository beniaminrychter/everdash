import { h, render } from 'preact';
import { DashboardCanvas } from '../components/DashboardCanvas';
import type { DashboardCanvasProps } from '../components/DashboardCanvas';
import { editorKit } from './editorKit';

export type { DashboardCanvasProps } from '../components/DashboardCanvas';

export interface CanvasHandle {
  update: (props: DashboardCanvasProps) => void;
  unmount: () => void;
}

/**
 * Renders the tablet's Preact canvas into an element owned by another framework. This is the only
 * way the editor chrome and drag and drop (SortableJS) reach a page; the tablet never imports it.
 */
export function mountDashboardCanvas(
  element: HTMLElement,
  props: DashboardCanvasProps,
): CanvasHandle {
  render(h(DashboardCanvas, { ...props, editorKit }), element);

  return {
    update(next) {
      render(h(DashboardCanvas, { ...next, editorKit }), element);
    },
    unmount() {
      render(null, element);
    },
  };
}
