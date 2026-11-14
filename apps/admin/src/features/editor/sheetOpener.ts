const canvasEditButtons = '[data-canvas-island] button[aria-label^="Edit "]';

/** What the inspector sheet remembers about the element that opened it. */
export interface OpenerMemory {
  element: HTMLElement;
  label: string | null;
  /** Position among the canvas Edit buttons, or -1 when the opener is elsewhere. */
  canvasIndex: number;
}

function editButtons(): HTMLElement[] {
  return Array.prototype.slice.call(document.querySelectorAll(canvasEditButtons));
}

export function rememberOpener(active: Element | null): OpenerMemory | null {
  if (!(active instanceof HTMLElement) || active === document.body) {
    return null;
  }

  return {
    element: active,
    label: active.getAttribute('aria-label'),
    canvasIndex: editButtons().indexOf(active),
  };
}

/**
 * Finds where focus should return when the sheet closes. A live edit re-renders the canvas and
 * replaces its buttons, so a detached opener is looked up again by label, then by position (the
 * label changes when the card was renamed).
 */
export function findOpener(memory: OpenerMemory | null): HTMLElement | null {
  if (!memory) {
    return null;
  }

  if (memory.element.isConnected) {
    return memory.element;
  }

  if (memory.canvasIndex < 0) {
    return null;
  }

  const buttons = editButtons();
  const byLabel = buttons.find((button) => button.getAttribute('aria-label') === memory.label);

  return byLabel ?? buttons[memory.canvasIndex] ?? null;
}
